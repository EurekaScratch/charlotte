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
     * @return XML-escaped string, for use within an XML tag.
     */
    xmlEscape (unsafe: string): string;
}

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

export default async function ({addon, console}) {
    addon.api = {};

    const originalGetLocale = addon.getLocale;
    addon.getLocale = function () {
        const vm = addon.instances.vm;
        if (vm) {
            return vm.getLocale.call(vm) ?? originalGetLocale.call(this);
        }
        return originalGetLocale.call(this);
    };

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

    addon.api = {
        getPlatform,
        getVM,
        getBlockly,
        createBlockContextMenu,
        xmlEscape
    } satisfies CharlotteAPI;
}
