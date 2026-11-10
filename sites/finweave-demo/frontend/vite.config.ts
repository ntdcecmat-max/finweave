import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/demo/',
  publicDir: false,
  plugins: [react()],
  define: {
    'import.meta.env.VITE_DATA_MODE': JSON.stringify('synthetic_mock'),
    'import.meta.env.VITE_DEMO_TRANSPORT': JSON.stringify('http'),
  },
  build: { outDir: '../public/demo', emptyOutDir: true, target: 'chrome120', chunkSizeWarningLimit: 2200 },
});
