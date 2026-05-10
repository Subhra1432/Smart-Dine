import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.API_URL || 'http://localhost:4000';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    sourcemap: false,
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['lucide-react', 'react-hot-toast'],
          store: ['zustand'],
        },
      },
    },
  },
  server: {
    port: 5173,
    watch: {
      ignored: ['**/.git/**'],
    },
    proxy: {
      '/api': apiTarget,
      '/socket.io': {
        target: apiTarget,
        ws: true
      }
    }
  },
});
