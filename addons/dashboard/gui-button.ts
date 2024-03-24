export default async function ({ addon, console }) {
    const button = document.createElement('div');
    button.setAttribute('role', 'button');
    button.className = 'charlotteButton';
    button.innerHTML = '🌠&nbsp;Charlotte';
    button.addEventListener('click', () => {
        addon.app.openFrontend();
    });

    addon.api.appendToSharedSpace(button, 'afterSoundTab');
    return () => {
        button.remove();
    };
}