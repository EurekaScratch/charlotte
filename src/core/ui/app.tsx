import type { Addon } from '../loader/loader';
import { createSignal, Show, For, onMount } from 'solid-js';
import { render } from 'solid-js/web';
import console from '../util/console';
import classNames from 'classnames';
import globalCss from './style.css';
import type { GlobalCtx } from '../loader/ctx';
import styles, { stylesheet } from './style.module.css';
import closeIcon from './assets/icon--close.svg';

let globalCtx: GlobalCtx | null = null;

export function attachCtx (ctx: GlobalCtx) {
    globalCtx = ctx;
}

let setModalStatus: null | Function = null;

interface SwitchProps {
    value?: boolean;
    disabled?: boolean;
    onChange: (value: boolean) => void;
}

interface AddonStatus extends Addon {
    pending?: boolean;
}

function Switch (props: SwitchProps) {
    const [value, setValue] = createSignal(props.value ?? false);

    const handleClick = () => {
        if (!props.disabled) {
            props.onChange(!value());
            setValue(!value());
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !props.disabled) {
            setValue(!value());
            props.onChange(!value());
            event.stopPropagation();
        }
    };

    return (
        <div
            class={classNames(styles.switch, value() ? styles.true : styles.false, props.disabled ? styles.disabled : null)}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            <div class={classNames(styles.slider, value() ? styles.true : styles.false, props.disabled ? styles.disabled : null)} />
            <input class={styles.dummyInput} inputMode='none' />
        </div>
    );
}

function Modal () {
    const [show, setShow] = createSignal(true);
    const [refreshRequested, setRefreshRequested] = createSignal(false);
    const [addons, setAddons] = createSignal<Record<string, AddonStatus>>(Object.assign({}, globalCtx.addons));
    const activate = (id: string) => {
        const newAddonStatus = Object.assign({}, addons()[id], {enabled: true, pending: true});
        setAddons(Object.assign({}, addons(), {[id]: newAddonStatus}));
        if (addons()[id].dynamicEnable) globalCtx!.loader.activate(id);
        else setRefreshRequested(true);
    };
    const deactivate = (id: string) => {
        const newAddonStatus = Object.assign({}, addons()[id], {enabled: false, pending: true});
        setAddons(Object.assign({}, addons(), {[id]: newAddonStatus}));
        if (addons()[id].dynamicDisable) globalCtx!.loader.deactivate(id);
        else setRefreshRequested(true);
    };
    onMount(() => {
        setModalStatus = setShow;
        // Track addon status
        globalCtx.on('core.addon.activated', (id: string) => {
            const newAddonStatus = Object.assign({}, addons()[id], {enabled: true, pending: false});
            setAddons(Object.assign({}, addons(), {[id]: newAddonStatus}));
            console.log(addons());
        });
        globalCtx.on('core.addon.deactivated', (id: string) => {
            const newAddonStatus = Object.assign({}, addons()[id], {enabled: false, pending: false});
            setAddons(Object.assign({}, addons(), {[id]: newAddonStatus}));
        });
    });

    return (
        <Show when={show()}>
            <div
                id='charlotte-overlay'
                class={styles.overlay}
                onClick={() => setShow(false)}
            />
            <div class={styles.container}>
                <div class={styles.modal}>
                    <div class={styles.header}>
                        <span class={styles.title}>Charlotte</span>
                        <div class={styles.headerItem}>
                            <div
                                aria-label="Close"
                                class={styles.closeButton}
                                role="button"
                                tabIndex="0"
                                onClick={() => setShow(false)}
                            >
                                <img
                                    class={styles.closeIcon}
                                    src={closeIcon}
                                />
                            </div>
                        </div>
                    </div>
                    <div class={styles.body}>
                        <Show when={refreshRequested()}>
                            <span class={styles.alert}>
                                Some changes require a refresh to take effect.
                            </span>
                        </Show>
                        <For each={Object.values(addons())}>
                            {(addon) => (
                                <div class={styles.addon}>
                                    <div class={styles.info}>
                                        <span class={styles.name}>{addon.name}</span>
                                        <span class={styles.description}>{addon.description}</span>
                                    </div>
                                    <Switch value={addon.enabled} disabled={addon.pending} onChange={(value: boolean) => {
                                        if (value) {
                                            activate(addon.id);
                                        } else {
                                            deactivate(addon.id);
                                        }
                                        globalCtx.settings[`${addon.id}.enabled`] = value;
                                    }} />
                                </div>
                            )}
                        </For>
                    </div>
                </div>
            </div>
        </Show>
    );
}

export function openFrontend () {
    if (!globalCtx) {
        throw new Error('UI: globalCtx not attached');
    }

    if (!setModalStatus) {
        // Initialize front-end
        const style = document.createElement('style');
        style.id = 'charlotte-styles';
        style.innerHTML = `${globalCss}\n${stylesheet}`;
        document.body.append(style);
        render(Modal, document.body);
    } else {
        setModalStatus(true);
    }
}
