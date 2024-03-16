import type { GlobalCtx } from './ctx';
import console, { createConsole } from '../util/console';

export interface Userscript {
    func: (ctx: AddonCtx) => (() => void) | void;
    runAtComplete: boolean;
}

export interface AddonCtx {
    addon: GlobalCtx,
    console: Console
}

export interface Addon {
    id: string;
    name: string;
    description: string;
    enabled?: boolean;
    enabledByDefault: boolean;
    userscripts: Userscript[];
    disposers?: (() => void)[];
}

let globalCtx: GlobalCtx | null = null;
const deferredScripts: Function[] = [];

export function attachCtx (ctx: GlobalCtx) {
    globalCtx = ctx;
}

export function activate (id: string) {
    if (!globalCtx) {
        throw new Error('Loader: globalCtx not attached');
    }

    const addon = globalCtx.addons[id];
    if (addon.enabled) {
        return console.warn(`cannot activate an enabled addon: ${id}`);
    }

    // apply userscripts
    addon.disposers = [];
    for (const script of addon.userscripts) {
        const wrappedScript = script.func.bind(
            script, {
                addon: globalCtx,
                console: createConsole(addon.name)
            });
        if (script.runAtComplete) {
            deferredScripts.push(wrappedScript);
            continue;
        }
        const disposer = wrappedScript();
        if (typeof disposer === 'function') {
            addon.disposers.push(disposer);
        }
    }
    // apply styles

    addon.enabled = true;
    console.log(`${addon.name}(id: ${id}) activated!`);
}

export function deactivate (id: string) {
    if (!globalCtx) {
        throw new Error('Loader: globalCtx not attached');
    }

    const addon = globalCtx.addons[id];
    if (!addon.enabled) {
        return console.warn(`cannot deactivate a disabled addon: ${id}`);
    }

    // execute disposers
    for (const disposer of addon.disposers) {
        disposer();
    }
    // remove styles

    addon.enabled = false;
    console.log(`${addon.name}(id: ${id}) deactivated!`);
}

function loadScriptAtComplete () {
    if (!globalCtx) {
        throw new Error('Loader: globalCtx not attached');
    }

    if (deferredScripts.length > 0) {
        for (const script of deferredScripts) {
            script();
        }
        console.log(`deferred userscripts loaded`);
    }

    window.removeEventListener('load', loadScriptAtComplete);
}

window.addEventListener('load', loadScriptAtComplete);
