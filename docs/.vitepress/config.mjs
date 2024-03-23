import { defineConfig } from 'vitepress';
import docSidebar from '../doc/sidebar.json';

export default defineConfig({
    title: 'Charlotte',
    description: 'Enhance your favorite Scratch editors.',
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Documentation', link: '/doc/interfaces/CharlotteAPI' },
            { text: 'Guide', link: '/guide' }
        ],
        sidebar: {
            '/doc': docSidebar
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/EurekaScratch/charlotte'}
        ],
        footer: {
            message: 'Powered by TypeDoc & VitePress.'
        }
    }
});
