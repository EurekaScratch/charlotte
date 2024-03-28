import { defineConfig } from 'vitepress';
import docSidebar from '../doc/sidebar.json';

export default defineConfig({
    title: 'Charlotte',
    description: 'Enhance your favorite Scratch editors.',
    locales: {
        root: {
            label: 'English',
            lang: 'en'
        },
        'zh-cn': {
            label: '简体中文',
            lang: 'zh-cn',
            description: '自由装潢你所喜爱的 Scratch 编辑器'
        }
    },
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Documentation', link: '/doc/README' },
            { text: 'Guide', link: '/guide/intro' }
        ],
        sidebar: {
            '/doc': docSidebar,
            '/guide': [
                { text: 'Introduction', link: '/guide/intro' },
                { text: 'Installation', link: '/guide/installation' },
                { text: 'Develop with Charlotte', link: '/guide/develop-charlotte' },
                { text: 'Creating your first addon', link: '/guide/creating-addon' },
                { text: 'Userscripts', link: '/guide/userscripts' },
                { text: 'Userstyles', link: '/guide/userstyles' },
            ],
            '/zh-cn/guide': [
                { text: '介绍', link: '/zh-cn/guide/intro' },
                { text: '安装', link: '/zh-cn/guide/installation' },
                { text: '调试 Charlotte', link: '/zh-cn/guide/develop-charlotte' },
                { text: '创建你的第一个插件', link: '/zh-cn/guide/creating-addon' },
                { text: '用户脚本', link: '/zh-cn/guide/userscripts' },
                { text: '用户样式', link: '/zh-cn/guide/userstyles' },
            ],
            '/addons': [
                { text: 'API', link: '/addons/api' },
                { text: 'Eureka', link: '/addons/eureka' },
            ]
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/EurekaScratch/charlotte'}
        ],
        footer: {
            message: 'Powered by TypeDoc & VitePress.'
        },
        search: {
            provider: 'local'
        }
    }
});
