import './meta.js?userscript-metadata';
import console from './util/console';
import * as loader from './loader/loader';
import { createCtx } from './loader/ctx';
import { version } from '../../package.json' with { type: 'json' };

console.log(`Charlotte ${version}`);

const globalCtx = createCtx(version);
console.log(`Loading addons...`);
loader.attachCtx(globalCtx);
for (const addonId in globalCtx.addons) {
    if (typeof globalCtx.settings[addonId] === 'object') {
        if (globalCtx.settings[addonId].enabled) {
            loader.activate(addonId);
        }
    } else if (globalCtx.addons[addonId].enabledByDefault) {
        loader.activate(addonId);
    }
}
