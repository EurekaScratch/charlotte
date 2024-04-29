import console from '../util/console';

export interface MatchObject {
    /**
     * Platform name's alias.
     */
    platform: string;
    /**
     * Specify where on the website the script should take effect. Usually the options are `root`, `editor`, `projects`, etc.
     */
    scopes?: readonly string[];
}

/**
 * The accepted each match element.
 */
export type Match = keyof typeof platformInfo | 'all' | MatchObject;

/**
 * The accepted scopes
 */
export type Scope = 'root' | 'editor' | 'projects';

export const platformInfo = {
    ccw: {
        root: /https:\/\/www\.ccw\.site\/*/
    },
    twcn: {
        root: /https:\/\/editor\.turbowarp\.cn\/*/
    },
    gitblock: {
        root: /https:\/\/gitblock\.cn\/*/,
        editor: /https:\/\/gitblock\.cn\/Project\/*\/Editor/,
        projects: /https:\/\/gitblock\.cn\/Project\/*/
    },
    xmw: {
        root: /https:\/\/world\.xiaomawang\.com\/*/
    },
    cocrea: {
        root: /https:\/\/cocrea\.world\/*/
    },
    codelab: {
        root: /https:\/\/create\.codelab\.club\/*/
    },
    sccn: {
        root: /https:\/\/www\.scratch-cn\.cn\/*/
    },
    '40code': {
        root: /https:\/\/www\.40code\.com\/*/
    },
    tw: {
        root: /https:\/\/turbowarp\.org\/*/
    },
    rc: {
        root: /https:\/\/0832\.ink\/rc\/*/
    },
    cc: {
        root: /https:\/\/codingclip\.com\/*/,
        editor: /https:\/\/codingclip\.com\/editor\/*/,
        projects: /https:\/\/codingclip\.com\/project\/*/
    },
    sc: {
        root: /https:\/\/scratch\.mit\.edu\/*/,
        editor: /https:\/\/scratch\.mit\.edu\/projects\/*#editor/,
        projects: /https:\/\/scratch\.mit\.edu\/projects\/*/
    },
    acamp: {
        root: /https:\/\/aerfaying\.com\/*/,
        editor: /https:\/\/aerfaying\.com\/Project\/*\/Editor/,
        projects: /https:\/\/aerfaying\.com\/Project\/*/
    },
    xueersi: {
        root: /https:\/\/code\.xueersi\.com\/*/
    },
    creaticode: {
        root: /https:\/\/play\.creaticode\.com\/*/
    },
    ada: {
        root: /https:\/\/www\.adacraft\.org\/*/
    },
    pm: {
        root: /https:\/\/studio\.penguinmod\.com\/*/
    },
    electramod: {
        root: /https:\/\/electramod\.vercel\.app\/*/
    },
    xplab: {
        root: /https:\/\/xplab\.vercel\.app\/*/
    }
} as const;

export function isMatchingCurrentURL (matches: readonly Match[]) {
    // Always matched
    if (matches.includes('all')) {
        return true;
    }

    for (const match of matches) {
        if (typeof match === 'string') {
            if (!(match in platformInfo)) {
                console.warn(`Unknown platform alias: ${match}`);
                continue;
            }
            if (platformInfo[match].root.test(document.URL)) {
                return true;
            }
            continue;
        }

        if (!(match.platform in platformInfo)) {
            console.warn(`Unknown platform alias: ${match.platform}`);
            continue;
        }
        for (const scope of match.scopes) {
            if (!(scope in platformInfo[match.platform])) {
                console.warn(`Unknown scope alias: ${scope}`);
            }
            if (platformInfo[match.platform][scope].test(document.URL)) {
                return true;
            }
        }
    }
}
