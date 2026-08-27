import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: process.env.VERCEL_PROJECT_PRODUCTION_URL 
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
    : 'https://freetools.vercel.app',
  output: 'static',
  adapter: vercel(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});
