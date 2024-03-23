import type { GlobalCtx } from '../loader/ctx';
import {createIntl, createIntlCache} from '@formatjs/intl';
import type { IntlShape } from '@formatjs/intl';
import en from '../../../locales/en.json';

const cache = createIntlCache();
const messages = { en };
const intlHost: { intl?: IntlShape } = {};

export function setup (ctx: GlobalCtx) {
    intlHost.intl = createIntl({
        locale: ctx.getLocale(),
        messages: messages[ctx.getLocale()]
    }, cache);

    ctx.on('core.settings.changed', (name: string) => {
        if (name !== 'locale') return;

        intlHost.intl = createIntl({
            locale: ctx.getLocale(),
            messages: messages[ctx.getLocale()]
        }, cache);
    });
}

// Use proxy because intl will be created lazily but ESM exports it statically
const proxiedIntl = new Proxy(intlHost, {
    get (target, prop, receiver) {
        if (!target.intl) {
            throw new Error('intl not ready');
        }
        return Reflect.get(target.intl, prop, receiver);
    }
});

export default proxiedIntl as IntlShape;
