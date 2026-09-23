import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '', // 👈 THIS IS THE CRITICAL LINE THAT FIXES THE WHITE SCREEN
  server: {
    proxy: {
      '/api': 'https://sobs-marketplace.zevenx3.workers.dev',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});