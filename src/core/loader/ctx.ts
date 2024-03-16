import EventEmitter from 'eventemitter3';
import type { Addon } from './loader';
import type { Settings } from '../util/settings';
import addons from '../../addons';
import { settings } from '../util/settings';

class Ctx extends EventEmitter {
    version: string;
    addons: Record<string, Addon> = addons;
    settings = settings;

    constructor (version: string) {
        super();
        this.version = version;
    }
}

export type GlobalCtx = Ctx;

export function createCtx (version: string) {
    return new Ctx(version);
}
