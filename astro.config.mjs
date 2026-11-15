// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages:
// - This repo is named <user>.github.io, so the site is served from the root and BASE is "/".
// - If the repo is ever renamed (e.g. "portfolio"), set BASE_PATH=/portfolio in the deploy workflow.
//   Every internal link goes through `url()` in src/lib/url.ts, so nothing else needs to change.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site: process.env.SITE_URL || 'https://tyler-barr4.github.io',
  base,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  vite: {
    plugins: [tailwindcss()],
    // three.js is one lazy-loaded chunk (~170 KB gzipped) fetched after the page is idle.
    build: { chunkSizeWarningLimit: 800 },
  },
});
