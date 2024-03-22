import type { GlobalCtx } from '../loader/ctx';
import {createIntl, createIntlCache} from '@formatjs/intl';
import type { IntlShape } from '@formatjs/intl';
import en from '../../../locales/en.json';

const cache = createIntlCache();
const messages = { en };
let intl: IntlShape | null = null;

export function setup (ctx: GlobalCtx) {
    intl = createIntl({
        locale: ctx.getLocale(),
        messages: messages[ctx.getLocale()]
    });

    ctx.on('core.settings.changed', (name: string) => {
        if (name !== 'locale') return;

        intl = createIntl({
            locale: ctx.getLocale(),
            messages: messages[ctx.getLocale()]
        });
    });
}

function getIntl () {
    return intl;
}

export default getIntl as IntlShape;
