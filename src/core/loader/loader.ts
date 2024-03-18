import type { GlobalCtx } from './ctx';
import type { Match } from './match';
import { isMatchingCurrentURL } from './match';
import console, { createConsole } from '../util/console';
import { Graph } from '../util/graph';

export interface Userscript {
    func: (ctx: AddonCtx) => Promise<(() => void) | void>;
    matches: Match[];
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
    const requireStack = new Set<string>();
    for (const id of ids) {
        _checkLoadingOrderById(id, [], graph, requireStack);
    }
    const orderedIds = graph.topo();
    for (const id of orderedIds) {
        try {
            console.log(`activating ${id}`);
            // Ensure required addons activated ahead
            if (requireStack.has(id)) {
                await activate(id);
            } else {
                activate(id);
            }
        } catch (e) {
            console.error(`Loader: Error occured while activating ${id}\n`, e);
        }
    }
}

function _checkLoadingOrderById (id: string, requireStack: string[], graph: Graph, allRequired: Set<string> = new Set()) {
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
        allRequired.add(dependency);
        _checkLoadingOrderById(dependency, requireStack, graph, allRequired);
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

export async function deactivateByOrder (ids: string[]) {
    const graph = new Graph();
    for (const id of ids) {
        if (globalCtx.addons[id].enabled) {
            _checkUnloadingOrderById(id, graph);
        }
    }
    const orderedIds =  graph.topo();
    for (const id of orderedIds) {
        try {
            await deactivate(id);
        } catch (e) {
            console.error(`Loader: Error occured while deactivating ${id}\n`, e);
        }
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
        if (!isMatchingCurrentURL(script.matches)) continue;

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

export async function deactivate (id: string) {
    if (!globalCtx) {
        throw new Error('Loader: globalCtx not attached');
    }

    const addon = globalCtx.addons[id];
    if (!addon.enabled) {
        return console.warn(`cannot deactivate a disabled addon: ${id}`);
    }

    // Execute disposers
    for (const disposer of addon.disposers) {
        await disposer();
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
