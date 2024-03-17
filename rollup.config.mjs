import { definePlugins } from '@gera2ld/plaid-rollup';
import { defineConfig } from 'rollup';
import userscript from 'rollup-plugin-userscript';
import serve from 'rollup-plugin-serve';
import image from '@rollup/plugin-image';
import pkg from './package.json' assert { type: 'json' };

export default defineConfig(Object.entries({
  'charlotte': 'src/core/index.ts',
}).map(([name, entry]) => ({
  input: entry,
  plugins: [
    ...definePlugins({
      esm: true,
      minimize: false,
      postcss: {
        inject: false,
        minimize: true,
      },
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx'],
    }),
    image(),
    userscript((meta) => 
        meta.replace('process.env.AUTHOR', pkg.author)
            .replace('process.env.VERSION', pkg.version)
    ),
    process.env.ROLLUP_WATCH ? serve('dist') : undefined
  ],
  output: {
    format: 'iife',
    file: `dist/${name}.user.js`,
    banner: `(async () => {`,
    footer: `})();`,
    indent: false,
  },
})));
