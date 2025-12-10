import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import monkey, { cdn } from 'vite-plugin-monkey';
import { fileURLToPath, URL } from "node:url"

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    preact(),
    monkey({
      entry: 'src/main.tsx',
      userscript: {
        name: '【哔哩哔哩】一些任务',
        description: '可以一键执行一系列操作。',
        icon: 'https://static.hdslb.com/images/favicon.ico',
        namespace: 'https://github.com/AkagiYui/UserScript',
        match: [
          'https://space.bilibili.com/*/favlist*',
          'https://www.bilibili.com/list/ml*',
          'https://www.bilibili.com/list/watchlater*',
        ],
        supportURL: 'https://github.com/AkagiYui/UserScript/issues',
        homepage: 'https://github.com/AkagiYui',
        author: 'AkagiYui',
        license: 'MIT',
        version: '0.0.9',
      },

      build: {
        externalGlobals: {
          preact: cdn.jsdelivr('preact', 'dist/preact.min.js'),
        },
      },
    }),
  ],
  build: {
    minify: false,
  },
});
