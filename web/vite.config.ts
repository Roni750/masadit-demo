/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy(),
    VitePWA({
      // A new version activates on the next load without prompting
      registerType: 'autoUpdate',
      // Registered from main.tsx, and only on the web: native builds load files from the device already
      injectRegister: false,
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        name: 'MyBiz – ניהול העסק',
        short_name: 'MyBiz',
        description: 'Bookkeeping for business owners and accountants',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        start_url: '/',
        theme_color: '#2f6fd0',
        background_color: '#eaf1f9',
      },
      workbox: {
        // Precache the app shell so it opens offline. API data isn't cached here: server state lives
        // in TanStack Query (DECISIONS.md #4). Legacy-browser bundles and the on-demand Excel library are skipped.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        globIgnores: ['**/*-legacy-*.js', '**/exceljs*.js'],
        navigateFallback: 'index.html',
      },
    }),
    // ANALYZE=1 npm run build -w web → stats.html (treemap of what's inside each chunk)
    process.env.ANALYZE && visualizer({ filename: 'stats.html', gzipSize: true, template: 'treemap' }),
    process.env.ANALYZE && visualizer({ filename: 'stats.json', gzipSize: true, template: 'raw-data' }),
  ],
  // Fixed port: the API's CORS allow-list expects it, so fail instead of silently moving to another one
  server: {
    port: 8100,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
