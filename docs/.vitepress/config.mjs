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
                { text: 'Creating your addon', link: '/guide/develop-addon' },
                { text: 'Addon Structure', link: '/guide/addon-structure' },
            ],
            '/zh-cn/guide': [
                { text: '介绍', link: '/zh-cn/guide/intro' },
                { text: '安装', link: '/zh-cn/guide/installation' },
                { text: '创建属于你的插件', link: '/zh-cn/guide/develop-addon' },
                { text: '插件结构', link: '/zh-cn/guide/addon-structure' },
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
