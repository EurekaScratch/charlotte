import type { ContextMenuItem } from '../api/api';

export default async function ({addon, console}) {
    addon.once('API.instance.Blockly.initialized', () => {
        const Blockly = addon.instances.Blockly;
        // Copy Option
        addon.api.createBlockContextMenu(
            (items: ContextMenuItem[], block: any) => {
                items.push({
                    enabled: typeof navigator.clipboard === 'object',
                    text: 'Copy Blocks To Clipboard',
                    callback: () => {
                        const xml = document.createElement('xml');
                        xml.appendChild(Blockly.Xml.blockToDom(block, true));
                        navigator.clipboard.writeText(Blockly.Xml.domToText(xml));
                    },
                    separator: false
                });
                return items;
            },
            {blocks: true}
        );
        // Paste Option
        addon.api.createBlockContextMenu(
            (items: ContextMenuItem[]) => {
                const ws = Blockly.getMainWorkspace();
                items.push({
                    enabled: typeof navigator.clipboard === 'object',
                    text: 'Paste Blocks From Clipboard',
                    callback: () => {
                        navigator.clipboard.readText().then(data => {
                            Blockly.Events.disable();
                            try {
                                const xml = Blockly.Xml.textToDom(data);
                                var newBlock = Blockly.Xml.domToBlock(xml.firstChild, ws);

                                const point = Blockly.utils.mouseToSvg(event, ws.getParentSvg(),  ws.getInverseScreenCTM());
                                const rel = ws.getOriginOffsetInPixels();
                                const x = (point.x - rel.x) / ws.scale;
                                const y = (point.y - rel.y) / ws.scale;

                                newBlock.moveBy(ws.RTL ? -x : x, y);
                            } finally {
                                Blockly.Events.enable();
                                if (Blockly.Events.isEnabled() && newBlock) {
                                    Blockly.Events.fire(new Blockly.Events.BlockCreate(newBlock));
                                }
                            }
                        });
                    },
                    separator: false,
                });
                return items;
            },
            {workspace: true}
        );
    });
}
