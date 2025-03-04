import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5003,
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
  plugins: [react(), tailwindcss()],
});
