import { version, injectVM, injectBlockly, settings, openFrontend } from './eureka/dist/eureka-charlotte';

export default async function ({ addon, console }) {
    const vm = await addon.api.getVM();
    console.log(`Eureka ${version} on Charlotte`);
    (window as any).eureka = {
        version,
        registeredExtension: {},
        settings: settings,
        openFrontend: openFrontend.bind(null, open)
    };
    injectVM(vm);
    addon.api.getBlockly().then(blockly => {
        injectBlockly(blockly);
    });
}
