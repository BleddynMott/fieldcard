import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// base './' so the built site works under any path (a GitHub Pages project URL included).
export default defineConfig({
  base: './',
  plugins: [svelte()],
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
