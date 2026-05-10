import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.API_URL || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  base: '/staff/',
  build: {
    sourcemap: false,
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['lucide-react', 'react-hot-toast'],
          charts: ['recharts'],
          socket: ['socket.io-client'],
          store: ['zustand'],
        },
      },
    },
  },
  server: {
    port: 5174,
    watch: {
      ignored: ['**/.git/**'],
    },
    proxy: { 
      '/api': apiTarget,
      '/socket.io': {
        target: apiTarget,
        ws: true
      }
    },
  },
});
