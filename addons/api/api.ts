import { platformInfo } from '../../src/core/loader/match';

interface BaseContextMenuOptions {
    workspace: boolean;
    blocks: boolean;
    flyout: boolean;
    comments: boolean;
}

type ContextMenuOptions = Partial<BaseContextMenuOptions>;

export interface ContextMenuItem {
    enabled: boolean;
    text: string;
    callback: () => void;
    separator: boolean;
}

interface StoredContextMenuCallback extends BaseContextMenuOptions {
    callback: ContextMenuCallback;
}

type ContextMenuCallback = (items: ContextMenuItem[], block: unknown, event: unknown) => ContextMenuItem[];

export default async function ({addon, console}) {
    addon.api = {};

    let cachedResult: keyof typeof platformInfo | 'unknown' | null = null;
    addon.api.getPlatform = function () {
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
    };

    let vmFailed = false;
    /**
     *  Get vm instance asynchronously.
     */
    addon.api.getVM = function () {
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
    };

    let blocklyFailed = false;
    /**
     *  Get Blockly instance asynchronously.
     */
    addon.api.getBlockly = function () {
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
    };

    let createdAnyBlockContextMenus = false;
    const contextMenuCallbacks: StoredContextMenuCallback[] = [];
    /**
     * Creates an item in the editor Blockly context menu.
     */
    addon.api.createBlockContextMenu = function (
        callback: ContextMenuCallback,
        { workspace = false, blocks = false, flyout = false, comments = false }: ContextMenuOptions = {}
    ) {
        contextMenuCallbacks.push({ callback, workspace, blocks, flyout, comments });

        if (createdAnyBlockContextMenus) return;
        createdAnyBlockContextMenus = true;

        const ScratchBlocks = addon.instances.Blockly;
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
    };
}
