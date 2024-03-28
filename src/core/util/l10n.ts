import type { GlobalCtx } from '../loader/ctx';
import {createIntl, createIntlCache} from '@formatjs/intl';
import type { IntlShape } from '@formatjs/intl';
import en from '../../../locales/en.json';
import zhCn from '../../../locales/zh-cn.json';

const cache = createIntlCache();
const messages = { en, 'zh-cn': zhCn };
const intlHost: { intl: IntlShape } = {
    intl: createIntl({
        locale: 'en',
        messages: messages.en
    }, cache)
};

export function setup (ctx: GlobalCtx) {
    intlHost.intl = createIntl({
        locale: ctx.getLocale(),
        messages: messages[ctx.getLocale()] ?? messages.en
    }, cache);

    ctx.on('core.settings.changed', (name: string) => {
        if (name !== 'locale') return;

        intlHost.intl = createIntl({
            locale: ctx.getLocale(),
            messages: messages[ctx.getLocale()]  ?? messages.en
        }, cache);
        ctx.reloadAddons();
    });
}

// Use proxy because intl will be created lazily but ESM exports it statically
const proxiedIntl = new Proxy(intlHost, {
    get (target, prop, receiver) {
        return Reflect.get(target.intl, prop, receiver);
    }
});

export type { IntlShape };
export { defineMessage, defineMessages } from '@formatjs/intl';
export default proxiedIntl as unknown as IntlShape;
