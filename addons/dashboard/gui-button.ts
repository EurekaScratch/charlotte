export default async function ({ addon, console, intl }) {
    const button = document.createElement('div');
    button.setAttribute('role', 'button');
    button.className = 'charlotteButton';
    button.innerHTML = `🌠&nbsp;&nbsp;${intl.formatMessage({id: '@dashboard/addons', defaultMessage: 'Addons'})}`;
    button.addEventListener('click', () => {
        addon.app.openFrontend();
    });
    
    addon.api.appendToSharedSpace(button, 'afterSoundTab');
    return () => {
        button.remove();
    };
}
