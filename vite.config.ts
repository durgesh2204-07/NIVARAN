import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'zustand', '@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-export': ['jspdf', 'html2canvas', 'papaparse'],
          'vendor-maplibre': ['maplibre-gl'],
        },
      },
    },
  },
});
