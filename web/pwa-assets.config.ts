import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Generates the favicon, Apple touch icon and PWA icons (including a padded "maskable" one) from one SVG
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/logo.svg'],
});
