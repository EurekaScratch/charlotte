import './meta.js?userscript-metadata';
import console from './util/console';
import { createCtx } from './loader/ctx';
import { version } from '../../package.json' with { type: 'json' };

console.log(`Charlotte ${version}`);

const globalCtx = createCtx(version);
console.log(`Loading addons...`);

const ids: string[] = [];
globalCtx.loader.attachCtx(globalCtx);
for (const addonId in globalCtx.addons) {
    if (globalCtx.settings[`${addonId}.enabled`]) {
        ids.push(addonId);
    } else if (globalCtx.addons[addonId].enabledByDefault) {
        ids.push(addonId);
    }
}
globalCtx.loader.activateByOrder(ids);

globalCtx.app.attachCtx(globalCtx);

window.__charlotte = globalCtx;
