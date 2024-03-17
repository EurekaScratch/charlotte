import { version, inject, settings, openFrontend } from './eureka/dist/eureka-charlotte';

export default async function ({ addon, console }) {
    const vm = await addon.api.getVM();
    const blockly = await addon.api.getBlockly();
    console.log(`Eureka ${version} on Charlotte`);
    window.eureka = {
        version,
        registeredExtension: {},
        settings: settings,
        openFrontend: openFrontend.bind(null, open)
    };
    inject(vm, blockly);
}
