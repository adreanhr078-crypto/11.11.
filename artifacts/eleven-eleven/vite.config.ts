import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 23344,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': new URL('src', import.meta.url),
    },
  },
});