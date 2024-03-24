import { defineConfig } from 'vitepress';
import docSidebar from '../doc/sidebar.json';

export default defineConfig({
    title: 'Charlotte',
    description: 'Enhance your favorite Scratch editors.',
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
        }
    }
});
