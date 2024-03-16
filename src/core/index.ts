import './meta.js?userscript-metadata';
import console from './util/console';
import * as loader from './loader/loader';
import { createCtx } from './loader/ctx';
import { version } from '../../package.json' with { type: 'json' };

console.log(`Charlotte ${version}`);

const globalCtx = createCtx(version);
console.log(`Loading addons...`);

const ids: string[] = [];
loader.attachCtx(globalCtx);
for (const addonId in globalCtx.addons) {
    if (typeof globalCtx.settings[addonId] === 'object') {
        if (globalCtx.settings[addonId].enabled) {
            ids.push(addonId);
        }
    } else if (globalCtx.addons[addonId].enabledByDefault) {
        ids.push(addonId);
    }
}
loader.activateByOrder(ids);

window.__charlotte = globalCtx;
