import console from '../util/console';

interface MatchObject {
    platform: string;
    scopes?: string[];
}

export type Match = string | MatchObject;

export const platformInfo = {
    ccw: {
        root: /https:\/\/www\.ccw\.site\/*/
    },
    twcn: {
        root: /https:\/\/editor\.turbowarp\.cn\/*/
    },
    gitblock: {
        root: /https:\/\/gitblock\.cn\/*/
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
        root: /https:\/\/scratch\.mit\.edu\/*/
    },
    acamp: {
        root: /https:\/\/aerfaying\.com\/*/
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
    }
} as const;

export function isMatchingCurrentURL (matches: Match[]) {
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
