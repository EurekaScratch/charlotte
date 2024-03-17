/**
 * Based on https://github.com/scratchfoundation/scratch-blocks/compare/hotfix/totally-normal-2021 (Apache 2.0)
 * It has been modified to work properly in our environment and fix some bugs.
 */

export default async function ({ addon, console }) {
    const Blockly = await addon.api.getBlockly();
    const originalProcedureCallback = Blockly.getMainWorkspace()?.toolboxCategoryCallbacks_?.PROCEDURE;
    if (!originalProcedureCallback) {
        return console.error('Procedure callback not found');
    }

    Blockly.getMainWorkspace().toolboxCategoryCallbacks_.PROCEDURE = function (
        workspace: any,
        ...args: unknown[]
    ) {
        const xmlList = originalProcedureCallback.call(
            this,
            workspace,
            ...args
        ) as HTMLElement[];
        // Add separator and label
        const sep = document.createElement('sep');
        sep.setAttribute('gap', '36');
        xmlList.push(sep);
        const label = document.createElement('label');
        label.setAttribute('text', '🌠 Charlotte');
        xmlList.push(label);

        // Add dashboard button
        const dashboardButton = document.createElement('button');
        dashboardButton.setAttribute('text', 'Manage Addons');
        dashboardButton.setAttribute('callbackKey', 'CHARLOTTE_FRONTEND');
        workspace.registerButtonCallback('CHARLOTTE_FRONTEND', () => {
            addon.app.openFrontend();
        });
        xmlList.push(dashboardButton);
        return xmlList;
    };
    const workspace = Blockly.getMainWorkspace();
    workspace.getToolbox().refreshSelection();
    workspace.toolboxRefreshEnabled_ = true;

    return () => {
        Blockly.getMainWorkspace().toolboxCategoryCallbacks_.PROCEDURE = originalProcedureCallback;
        const workspace = Blockly.getMainWorkspace();
        workspace.getToolbox().refreshSelection();
        workspace.toolboxRefreshEnabled_ = true;
    };
}
