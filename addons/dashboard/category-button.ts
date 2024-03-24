export default async function ({ addon, console }) {
    const Blockly = await addon.api.getBlockly();
    const originalAddCreateButton_ = Blockly.Procedures.addCreateButton_;
    if (!originalAddCreateButton_) {
        return console.error('addCreateButton_ not found');
    }

    Blockly.Procedures.addCreateButton_ = function (
        workspace: any,
        xmlList: HTMLElement[],
        ...args: unknown[]
    ) {
        originalAddCreateButton_.call(this, workspace, xmlList, ...args);
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
        Blockly.Procedures.addCreateButton_ = originalAddCreateButton_;
        const workspace = Blockly.getMainWorkspace();
        workspace.getToolbox().refreshSelection();
        workspace.toolboxRefreshEnabled_ = true;
    };
}
