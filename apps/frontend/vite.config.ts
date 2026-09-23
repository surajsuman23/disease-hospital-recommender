import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  build: { outDir: '../../dist/client', emptyOutDir: true, sourcemap: false },
  server: {
    host: '127.0.0.1',
    port: 8201,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8200',
        changeOrigin: true,
        configure: (proxy) =>
          proxy.on('proxyReq', (request) => {
            if (request.getHeader('origin'))
              request.setHeader('origin', 'http://127.0.0.1:8200');
          }),
      },
    },
  },
});
