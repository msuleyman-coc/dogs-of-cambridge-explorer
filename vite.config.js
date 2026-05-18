import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` is set at build time for GitHub Pages project sites
// (e.g. https://USER.github.io/REPO/ — needs base = '/REPO/').
// The deploy workflow passes VITE_BASE; locally it defaults to '/'.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: { port: 5173, open: true }
});
