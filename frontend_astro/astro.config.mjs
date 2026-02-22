// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://fuelwatch.es',
  output: 'server',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [react(), sitemap()],
  adapter: cloudflare()
});
