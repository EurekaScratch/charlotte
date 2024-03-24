import type { GlobalCtx } from '../../src/core/loader/ctx';
import { platformInfo } from '../../src/core/loader/match';

export interface CtxWithAPI extends GlobalCtx {
    api: CharlotteAPI,
    instances: {
        vm?: unknown // @todo: add type declaration
        blockly?: unknown // @todo: add type declaration
    }
}

export interface CharlotteAPI {
    /**
     * Get current platform.
     * @returns platform alias, such as `cc`, `cocrea`
     */
    getPlatform (): string;
    /**
     * Get Scratch's VM instance asynchronously.
     * @returns a promise that returns VM instance
     */
    getVM (): Promise<unknown>;
    /**
     * Get Scratch's Blockly instance asynchronously.
     * This won't available if you're in project page.
     * @returns a promise that returns Blockly instance
     */
    getBlockly (): Promise<unknown>;
    /**
     * Creates an item in the editor Blockly context menu by callback.
     * Available only when Blockly exists.
     * @param callback A function to modify context menu.
     * @param options Specify the callback's scope.
     * @example
     * Here's a example to modify context menu in Blockly:
     * ```ts
     * addon.api.createBlockContextMenu((items: ContextMenuItem[], block: Blockly.Block, event: Blockly.Event) => {
     *     items.push({
     *         {
     *             enabled: true, // Whether the option is available
     *             text: '🌠 Meteor shower begins', // The display text of the option
     *             callback: () => console.log('🌠🌠🌠🌠'), // Triggers when option clicked
     *             separator: false // Whether displays a separator at the bottom of current option
     *         }
     *     });
     * }, {blocks: true}); // Only display in block's context menu
     * ```
     */
    createBlockContextMenu (callback: ContextMenuCallback, options: ContextMenuOptions);
    /**
     * Escape a string to be safe to use in XML content.
     * CC-BY-SA: hgoebl
     * https://stackoverflow.com/questions/7918868/
     * how-to-escape-xml-entities-in-javascript
     * @param unsafe Unsafe string.
     * @returns XML-escaped string, for use within an XML tag.
     */
    xmlEscape (unsafe: string): string;
    /**
     * Waiting until redux state marches condition.
     * @param condition The function to judge whether current state matches condition.
     * @param scope Which actions will trigger condition function.
     * @example
     * await addon.api.pendingReduxState((state) => state.scratchGui?.mode?.isFullScreen);
     * console.log('The stage is full-screen!');
     */
    pendingReduxState (condition: StatePendingCondition, scope?: string[]): Promise<void>;
    /**
     * Waiting until selected element rendered.
     * @param selector Selector string, syntax is same as `querySelector`.
     * @returns a promise that resolves requested element.
     */
    waitForElementRender (selector: string): Promise<HTMLElement>;
    /**
     * Append a element to a specific position in Scratch editor.
     * @param element The element you want to append to
     * @param space Where do you want to append
     * @param order The the order of the added element.
     * @example
     * const button = document.createElement('button');
     * button.className = 'charlotteButton';
     * button.innerHTML = '🌠&nbsp;Charlotte';
     * button.addEventListener('click', () => {
     *     addon.app.openFrontend();
     * });
     *
     * addon.api.appendToSharedSpace(button, 'afterSoundTab');
     */
    appendToSharedSpace (element: HTMLElement, space: SharedSpace, order?: number): void;
}

export type SharedSpace = 'stageHeader' | 'fullscreenStageHeader' | 'afterGreenFlag' | 'afterStopButton' | 'afterSoundTab';

export interface BaseContextMenuOptions {
    workspace: boolean;
    blocks: boolean;
    flyout: boolean;
    comments: boolean;
}

export type ContextMenuOptions = Partial<BaseContextMenuOptions>;

export interface ContextMenuItem {
    enabled: boolean;
    text: string;
    callback: () => void;
    separator: boolean;
}

export interface StoredContextMenuCallback extends BaseContextMenuOptions {
    callback: ContextMenuCallback;
}

export type ContextMenuCallback = (items: ContextMenuItem[], block: unknown, event: unknown) => ContextMenuItem[];

export type StatePendingCondition = (state: unknown) => boolean;

export default async function ({addon, console}) {
    addon.api = {};

    let cachedResult: keyof typeof platformInfo | 'unknown' | null = null;
    function getPlatform () {
        if (cachedResult) return cachedResult;
        for (const alias in platformInfo) {
            const platform = platformInfo[alias];
            if (platform.root.test(document.URL)) {
                cachedResult = alias as keyof typeof platformInfo;
                return cachedResult;
            }
        }
        cachedResult = 'unknown';
        return cachedResult;
    }

    let vmFailed = false;
    function getVM () {
        if (typeof addon.instances.vm === 'object') {
            return Promise.resolve(addon.instances.vm);
        }
        if (vmFailed) {
            return Promise.reject();
        }
        return new Promise((resolve, reject) => {
            addon.once('API.instance.vm.initialized', () => resolve(addon.instances.vm));
            addon.once('API.instance.vm.error', () => {
                vmFailed = true;
                reject();
            });
        });
    }

    let blocklyFailed = false;
    function getBlockly () {
        if (typeof addon.instances.Blockly === 'object') {
            return Promise.resolve(addon.instances.Blockly);
        }
        if (blocklyFailed) {
            return Promise.reject();
        }
        return new Promise((resolve, reject) => {
            addon.once('API.instance.Blockly.initialized', () => resolve(addon.instances.Blockly));
            addon.once('API.instance.Blockly.error', () => {
                blocklyFailed = true;
                reject();
            });
        });
    }

    let createdAnyBlockContextMenus = false;
    const contextMenuCallbacks: StoredContextMenuCallback[] = [];
    function createBlockContextMenu (
        callback: ContextMenuCallback,
        { workspace = false, blocks = false, flyout = false, comments = false }: ContextMenuOptions = {}
    ) {
        contextMenuCallbacks.push({ callback, workspace, blocks, flyout, comments });

        if (createdAnyBlockContextMenus) return;
        const ScratchBlocks = addon.instances.Blockly;
        if (!ScratchBlocks?.ContextMenu) {
            return console.error('Blockly not ready');
        }
        createdAnyBlockContextMenus = true;

        const oldShow = ScratchBlocks.ContextMenu.show;
        ScratchBlocks.ContextMenu.show = function (event: any, items: ContextMenuItem[], rtl: boolean) {
            const gesture = ScratchBlocks.mainWorkspace.currentGesture_;
            const block = gesture.targetBlock_;

            for (const { callback, workspace, blocks, flyout, comments } of contextMenuCallbacks) {
                const injectMenu =
                // Workspace
                (workspace && !block && !gesture.flyout_ && !gesture.startBubble_) ||
                // Block in workspace
                (blocks && block && !gesture.flyout_) ||
                // Block in flyout
                (flyout && gesture.flyout_) ||
                // Comments
                (comments && gesture.startBubble_);
                if (injectMenu) {
                    try {
                        items = callback(items, block, event);
                    } catch (e) {
                        console.error('Error while calling context menu callback: ', e);
                    }
                }
            }

            oldShow.call(this, event, items, rtl);

            const blocklyContextMenu = ScratchBlocks.WidgetDiv.DIV.firstChild as HTMLElement;
            items.forEach((item, i) => {
                if (i !== 0 && item.separator) {
                    const itemElt = blocklyContextMenu.children[i] as HTMLElement;
                    itemElt.style.paddingTop = '2px';
                    itemElt.style.borderTop = '1px solid hsla(0, 0%, 0%, 0.15)';
                }
            });
        };
    }

    function pendingReduxState (condition: StatePendingCondition, scope?: string[]) {
        if (!addon.redux.target) {
            throw new Error('Redux not ready');
        }

        if (condition(addon.redux.state)) return Promise.resolve();
        return new Promise<void>(resolve => {
            const listener = ({detail}) => {
                if (scope && !scope.includes(detail.action.type)) return;
                if (!condition(detail.next)) return;
                addon.redux.removeEventListener('statechanged', listener);
                setTimeout(resolve, 0);
            };
            addon.redux.addEventListener('statechanged', listener);
        });
    }

    function waitForElementRender (selector: string) {
        return new Promise<HTMLElement>((resolve) => {
            const observer = new MutationObserver((mutationsList, observer) => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((element) => {
                    if (element instanceof HTMLElement) {
                        observer.disconnect();
                        resolve(element);
                    }
                });
            });

            observer.observe(document.body, { subtree: true, childList: true });
        });
    }

    function appendToSharedSpace (element: HTMLElement, space: SharedSpace, order = 0) {
        const q = document.querySelector.bind(document);
        const sharedSpaces = {
            stageHeader: {
                // Non-fullscreen stage header only
                element: () => q("[class^='stage-header_stage-size-row']"),
                from: () => [],
                until: () => [
                    // Small/big stage buttons (for editor mode)
                    q("[class^='stage-header_stage-size-toggle-group']"),
                    // Full screen icon (for player mode)
                    q("[class^='stage-header_stage-size-row']").lastChild,
                ],
            },
            fullscreenStageHeader: {
                // Fullscreen stage header only
                element: () => q("[class^='stage-header_stage-menu-wrapper']"),
                from: function () {
                    let emptyDiv = this.element().querySelector('.charlotte-spacer');
                    if (!emptyDiv) {
                        emptyDiv = document.createElement('div');
                        emptyDiv.style.marginLeft = 'auto';
                        emptyDiv.className = 'charlotte-spacer';
                        this.element().insertBefore(emptyDiv, this.element().lastChild);
                    }
                    return [emptyDiv];
                },
                until: () => [q("[class^='stage-header_stage-menu-wrapper']").lastChild],
            },
            afterGreenFlag: {
                element: () => q("[class^='controls_controls-container']"),
                from: () => [],
                until: () => [q("[class^='stop-all_stop-all']")],
            },
            afterStopButton: {
                element: () => q("[class^='controls_controls-container']"),
                from: () => [q("[class^='stop-all_stop-all']")],
                until: () => [],
            },
            afterSoundTab: {
                element: () => q("[class^='react-tabs_react-tabs__tab-list']"),
                from: () => [q("[class^='react-tabs_react-tabs__tab-list']").children[2]],
                until: () => [],
            },
        };

        const spaceInfo = sharedSpaces[space];
        const spaceElement = spaceInfo.element();
        if (!spaceElement) return false;
        const from = spaceInfo.from();
        const until = spaceInfo.until();

        element.dataset.charlotteSharedSpaceOrder = String(order);

        let foundFrom = false;
        if (from.length === 0) foundFrom = true;

        // InsertAfter = element whose nextSibling will be the new element
        // -1 means append at beginning of space (prepend)
        // This will stay null if we need to append at the end of space
        let insertAfter: HTMLElement | number | null = null;

        const children = Array.from(spaceElement.children);
        for (const indexString of children.keys()) {
            const child = children[indexString] as HTMLElement;
            const i = Number(indexString);

            // Find either element from "from" before doing anything
            if (!foundFrom) {
                if (from.includes(child)) {
                    foundFrom = true;
                    // If this is the last child, insertAfter will stay null
                    // And the element will be appended at the end of space
                }
                continue;
            }

            if (until.includes(child)) {
                // This is the first Charlotte element appended to this space
                // If from = [] then prepend, otherwise append after
                // Previous child (likely a "from" element)
                if (i === 0) insertAfter = -1;
                else insertAfter = children[i - 1] as HTMLElement;
                break;
            }

            if (child.dataset.charlotteSharedSpaceOrder) {
                if (Number(child.dataset.charlotteSharedSpaceOrder) > order) {
                    // We found another element with higher order number
                    // If from = [] and this is the first child, prepend.
                    // Otherwise, append before this child.
                    if (i === 0) insertAfter = -1;
                    else insertAfter = children[i - 1] as HTMLElement;
                    break;
                }
            }
        }

        if (!foundFrom) return false;
        // It doesn't matter if we didn't find an "until"

        if (insertAfter === null) {
            // This might happen with until = []
            spaceElement.appendChild(element);
        } else if (insertAfter === -1) {
            // This might happen with from = []
            spaceElement.prepend(element);
        } else if (insertAfter instanceof HTMLElement) {
            // Works like insertAfter but using insertBefore API.
            // NextSibling cannot be null because insertAfter
            // Is always set to children[i-1], so it must exist
            spaceElement.insertBefore(element, insertAfter.nextSibling);
        }
        return true;
    }

    function xmlEscape (unsafe: string) {
        return unsafe.replace(/[<>&'"]/g, (c: string) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
            return '';
        });
    }

    // Make charlotte track Scratch's locale
    const originalGetLocale = addon.getLocale;
    addon.getLocale = function () {
        const vm = addon.instances.vm;
        if (vm) {
            return vm.getLocale() ?? originalGetLocale.call(addon);
        }
        return originalGetLocale.call(this);
    };
    getVM().then(vm => {
        const originalSetLocale = vm.setLocale;
        vm.setLocale = function (locale: string, messages: object, ...args: unknown[]) {
            const result = originalSetLocale.call(this);
            addon.settings.locale = locale;
            return result;
        };
    });

    addon.api = {
        getPlatform,
        getVM,
        getBlockly,
        createBlockContextMenu,
        pendingReduxState,
        waitForElementRender,
        appendToSharedSpace,
        xmlEscape
    } satisfies CharlotteAPI;
}
