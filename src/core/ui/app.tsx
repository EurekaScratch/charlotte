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
    onMount(() => {
        setModalStatus = setShow;
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
                        <For each={Object.values(globalCtx!.addons)}>
                            {(addon) => (
                                <div class={styles.addon}>
                                    <div class={styles.info}>
                                        <span class={styles.name}>{addon.name}</span>
                                        <span class={styles.description}>{addon.description}</span>
                                    </div>
                                    <Switch value={addon.enabled} onChange={(value: boolean) => {
                                        if (value) {
                                            globalCtx!.loader.activate(addon.id);
                                        } else {
                                            globalCtx!.loader.deactivate(addon.id);
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
