import type { Addon } from './loader';
import type { Settings } from '../util/settings';
import addons from '../../addons';
import { settings } from '../util/settings';

export interface GlobalCtx {
    readonly version: string;
    readonly addons: Record<string, Addon>;
    settings: Settings;
}

export function createCtx (version: string): GlobalCtx {
    return {version, addons, settings};
}
