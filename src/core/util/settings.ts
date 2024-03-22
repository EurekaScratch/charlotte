import type { GlobalCtx } from '../loader/ctx';

export interface BaseSettings {
    locale: string;
}

export interface Settings extends BaseSettings {
    [id: string]: any;
}

const puppet: Settings = {
    locale: 'en'
};

const SETTINGS_KEY = '$CHARLOTTE_SETTINGS';

if (!window.localStorage.getItem(SETTINGS_KEY)) {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(puppet));
}

let globalCtx: GlobalCtx | null = null;

export function attachCtx (ctx: GlobalCtx) {
    globalCtx = ctx;
}

export function getSettingsFromStorage (): Settings | null {
    try {
        const item = window.localStorage.getItem(SETTINGS_KEY);
        if (!item) return null;
        return JSON.parse(item);
    } catch (_: unknown) {
        return null;
    }
}

export const settings = new Proxy(puppet, {
    get (target, prop) {
        const storage = getSettingsFromStorage();
        if (!storage || !(prop in storage)) return Reflect.get(target, prop);
        return Reflect.get(storage, prop);
    },
    set (target, prop, value) {
        let storage = getSettingsFromStorage();
        if (!storage) {
            storage = Object.assign({}, puppet);
        }
        Reflect.set(storage, prop, value);
        if (globalCtx) {
            globalCtx.emit('core.settings.changed', prop, value);
        }
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(storage));
        return true;
    }
});
