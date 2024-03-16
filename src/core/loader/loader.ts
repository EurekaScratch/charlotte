import type { GlobalCtx } from './ctx';
import console, { createConsole } from '../util/console';
import { Graph } from '../util/graph';

export interface Userscript {
    func: (ctx: AddonCtx) => Promise<(() => void) | void>;
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
    required: string[];
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

export async function activateByOrder (ids: string[]) {
    const graph = new Graph();
    for (const id of ids) {
        _checkLoadingOrderById(id, [], graph);
    }
    const orderedIds = graph.topo();
    for (const id of orderedIds) {
        await activate(id);
    }
}

function _checkLoadingOrderById (id: string, requireStack: string[], graph: Graph) {
    if (!globalCtx) {
        throw new Error('Loader: globalCtx not attached');
    }

    requireStack.push(id);
    if (!graph.hasNode(id)) {
        graph.addNode(id);
    }
    for (const dependency of globalCtx.addons[id].required) {
        if (!globalCtx.addons[dependency]) {
            throw new Error(`unavailable dependency ${dependency} requested by ${id}`);
        }
        if (_findIdInList(dependency, requireStack) !== -1) {
            throw new Error(`circular requirement ${dependency} requested by ${id}`);
        }
        graph.addEdge(dependency, id);
        _checkLoadingOrderById(dependency, requireStack, graph);
    }
    requireStack.pop();
}

function _findIdInList (id: string, list: string[]) {
    for (const i in list) {
        if (list[i] === id) {
            return i;
        }
    }
    return -1;
}

export function deactivateByOrder (ids: string[]) {
    const graph = new Graph();
    for (const id of ids) {
        if (globalCtx.addons[id].enabled) {
            _checkUnloadingOrderById(id, graph);
        }
    }
    const orderedIds =  graph.topo();
    for (const id of orderedIds) {
        deactivate(id);
    }
}

function _checkUnloadingOrderById (id: string, graph: Graph, last?: string) {
    if (!graph.hasNode(id)) {
        graph.addNode(id);
    }
    for (const targetId in globalCtx.addons) {
        if (targetId === last) continue;
        if (globalCtx.addons[targetId]) {
            if (globalCtx.addons[targetId].required.includes(id)) {
                graph.addEdge(targetId, id);
                _checkUnloadingOrderById(targetId, graph, id);
            }
        }
    }
}

export async function activate (id: string) {
    if (!globalCtx) {
        throw new Error('Loader: globalCtx not attached');
    }

    const addon = globalCtx.addons[id];
    if (addon.enabled) {
        return console.warn(`cannot activate an enabled addon: ${id}`);
    }

    // Apply userscripts
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
        const disposer = await wrappedScript();
        if (typeof disposer === 'function') {
            addon.disposers.push(disposer);
        }
    }
    // Apply styles

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

    // Execute disposers
    for (const disposer of addon.disposers) {
        disposer();
    }
    // Remove styles

    addon.enabled = false;
    console.log(`${addon.name}(id: ${id}) deactivated!`);
}

async function loadScriptAtComplete () {
    if (!globalCtx) {
        throw new Error('Loader: globalCtx not attached');
    }

    if (deferredScripts.length > 0) {
        for (const script of deferredScripts) {
            await script();
        }
        console.log(`deferred userscripts loaded`);
    }

    window.removeEventListener('load', loadScriptAtComplete);
}

window.addEventListener('load', loadScriptAtComplete);
