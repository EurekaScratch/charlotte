import type { GlobalCtx } from './ctx';
import type { Match } from './match';
import intl, { defineMessage } from '../util/l10n';
import { isMatchingCurrentURL } from './match';
import console, { createConsole } from '../util/console';
import { Graph } from '../util/graph';
import EventEmitter from 'eventemitter3';

export interface Userscript {
    func: (ctx: AddonCtx) => Promise<(() => void) | void>;
    matches: readonly Match[];
    runAtComplete: boolean;
}

export interface Userstyle {
    stylesheet: string;
    matches: readonly Match[];
}

interface DeferredScript {
    belongs: string;
    func: () => Promise<(() => void) | void>;
}

export interface AddonCtx {
    addon: GlobalCtx;
    console: Console;
    intl: typeof intl;
    settings: AddonSettings;
}

export interface AddonSettingBoolean {
    name: string;
    type: 'boolean';
    default: boolean;
}

export interface AddonSettingInt {
    name: string;
    type: 'integer' | 'positive_integer';
    default: number;
    min?: number;
    max?: number;
}

export interface AddonSettingString {
    name: string;
    type: 'string';
    default: string;
}

export interface AddonSettingColor {
    name: string;
    type: 'color';
    default: `#${string}`;
    allowTransparency?: boolean;
}

export interface AddonSelectorItem {
    id: string;
    name: string;
    value: string;
}

export interface AddonSettingSelect {
    name: string;
    type: 'select';
    default: string;
    items: readonly AddonSelectorItem[];
}

export type AddonSetting = AddonSettingBoolean | AddonSettingSelect | AddonSettingColor | AddonSettingString | AddonSettingInt;

export interface AddonManifest {
    id: string;
    name: string;
    description: string;
    required: readonly string[];
    enabledByDefault: boolean;
    dynamicEnable: boolean;
    dynamicDisable: boolean;
    userscripts: readonly Userscript[];
    userstyles: readonly Userstyle[];
    settings: Record<string, AddonSetting>;
}

export interface Addon extends AddonManifest {
    enabled?: boolean;
    disposers?: (() => void)[];
}

const activatedMessage = defineMessage({
    id: '@core/addonActivated',
    defaultMessage: '{name} (id: {id}) activated!'
});

let globalCtx: GlobalCtx | null = null;
let pageLoaded = false;
const deferredScripts: DeferredScript[] = [];

export function attachCtx (ctx: GlobalCtx) {
    globalCtx = ctx;
}

class AddonSettings extends EventEmitter {
    id: string;
    constructor (addonId: string) {
        super();
        this.id = addonId;
        globalCtx!.on('core.settings.changed', this.#filter);
    }

    #filter (name: string, value: string) {
        if (name.startsWith(`@${this.id}/`)) {
            this.emit('change', name.slice(`@${this.id}/`.length - 1), value);
        }
    }

    get (name: string) {
        return globalCtx!.settings[`@${this.id}/${name}`]
            ?? globalCtx!.addons[this.id].settings[name].default;
    }

    dispose () {
        globalCtx!.off('core.settings.changed', this.#filter);
    }
}

function wrapAddonSettings (id: string) {
    return new AddonSettings(id);
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
            console.log(intl.formatMessage({
                id: '@core/activatingAddon',
                defaultMessage: 'Activating {id}...'
            }, {id}));
            // Ensure required addons activated ahead
            if (requireStack.has(id)) {
                await activate(id);
            } else {
                activate(id);
            }
        } catch (e) {
            console.error(intl.formatMessage({
                id: '@core/errorOccuredWhileActivating',
                defaultMessage: 'Loader: Error occured while activating {id}\n'
            }, {id}), e);
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
            console.error(intl.formatMessage({
                id: '@core/errorOccuredWhileDeactivating',
                defaultMessage: 'Loader: Error occured while deactivating {id}\n'
            }, {id}), e);
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
        return console.warn(intl.formatMessage({
            id: '@core/cannotActivateEnabledAddon',
            defaultMessage: 'cannot activate an enabled addon: {id}'
        }, {id}));
    }

    // Apply userscripts
    const addonSettings = wrapAddonSettings(id);
    addon.disposers = [];
    addon.disposers.push(() => {
        addonSettings.dispose();
    });
    let hasDeferredScripts = false;
    for (const script of addon.userscripts) {
        if (!isMatchingCurrentURL(script.matches)) continue;

        const wrappedScript = script.func.bind(
            script, {
                addon: globalCtx,
                console: createConsole(addon.name),
                intl: intl,
                settings: addonSettings
            });
        if (script.runAtComplete && !pageLoaded) {
            hasDeferredScripts = true;
            deferredScripts.push({
                belongs: id,
                func: wrappedScript
            });
            continue;
        }
        const disposer = await wrappedScript().catch(e => {
            console.error(`(${id}) ${script.func.name.toString()}: `, e);
        });
        if (typeof disposer === 'function') {
            addon.disposers.push(disposer);
        }
    }

    // Apply styles
    if (addon.userstyles.length > 0) {
        const styleElement = document.createElement('style');
        styleElement.id = `charlotte-addon-styles-${id}`;
        for (const style of addon.userstyles) {
            if (!isMatchingCurrentURL(style.matches)) continue;
            styleElement.innerHTML += `${style.stylesheet}\n`;
        }
        document.body.append(styleElement);
    }

    if (!hasDeferredScripts) {
        addon.enabled = true;
        globalCtx.emit('core.addon.activated', id);
        console.log(intl.formatMessage(activatedMessage, {name: addon.name, id}));
    } else {
        window.addEventListener('load', loadScriptAtComplete);
    }
}

export async function deactivate (id: string) {
    if (!globalCtx) {
        throw new Error('Loader: globalCtx not attached');
    }

    const addon = globalCtx.addons[id];
    if (!addon.enabled) {
        return console.warn(intl.formatMessage({
            id: '@core/cannotDeactivateDisabledAddon',
            defaultMessage: 'cannot deactivate a disabled addon: {id}'
        }, {id}));
    }

    // Execute disposers
    for (const disposer of addon.disposers) {
        await disposer();
    }

    // Remove styles
    if (addon.userstyles.length > 0) {
        const styleElem = document.querySelector(`#charlotte-addon-styles-${id}`);
        if (styleElem) {
            styleElem.remove();
        }
    }

    addon.enabled = false;
    globalCtx.emit('core.addon.deactivated', id);
    console.log(intl.formatMessage({
        id: '@core/addonDeactivated',
        defaultMessage: '{name} (id: {id}) deactivated!'
    }, {name: addon.name, id}));
}

async function loadScriptAtComplete () {
    if (!globalCtx) {
        throw new Error('Loader: globalCtx not attached');
    }

    const activatedAddons = new Set<string>();
    if (deferredScripts.length > 0) {
        for (const script of deferredScripts) {
            const addon = globalCtx.addons[script.belongs];
            const disposer = await script.func().catch(e => {
                console.error(`(${script.belongs}) ${script.func.name.toString()}: `, e);
            });
            if (typeof disposer === 'function') {
                addon.disposers.push(disposer);
            }
            activatedAddons.add(script.belongs);
        }

        for (const id of activatedAddons) {
            const addon = globalCtx.addons[id];
            addon.enabled = true;
            globalCtx.emit('core.addon.activated', id);
            console.log(intl.formatMessage(activatedMessage, {name: addon.name, id}));
        }
    }

    pageLoaded = true;
    window.removeEventListener('load', loadScriptAtComplete);
}
