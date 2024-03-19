import type { ContextMenuItem } from '../api/api';

export default async function ({addon, console}) {
    const Blockly = await addon.api.getBlockly();
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
        (items: ContextMenuItem[], _: unknown, event: unknown) => {
            const ws = Blockly.getMainWorkspace();
            items.push({
                enabled: typeof navigator.clipboard === 'object',
                text: 'Paste Blocks From Clipboard',
                callback: () => {
                    navigator.clipboard.readText().then(data => {
                        Blockly.Events.disable();
                        let newBlock: any = null;
                        try {
                            const xml = Blockly.Xml.textToDom(data);
                            if (xml?.firstChild?.firstChild?.tagName.toLowerCase() === 'parsererror') {
                                return console.error('invalid xml');
                            }

                            newBlock = Blockly.Xml.domToBlock(xml.firstChild, ws);

                            const point = Blockly.utils.mouseToSvg(event, ws.getParentSvg(),  ws.getInverseScreenCTM());
                            const rel = ws.getOriginOffsetInPixels();
                            const x = (point.x - rel.x) / ws.scale;
                            const y = (point.y - rel.y) / ws.scale;

                            newBlock.moveBy(ws.RTL ? -x : x, y);
                            // Refresh toolbox to adapting new blocks
                            ws.refreshToolboxSelection_();
                        } finally {
                            Blockly.Events.enable();
                            if (Blockly.Events.isEnabled() && typeof newBlock === 'object') {
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
}
