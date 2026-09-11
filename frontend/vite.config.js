import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5006',
        changeOrigin: true,
      },
      '/patients': {
        target: 'http://localhost:5006',
        changeOrigin: true,
      },
      '/appointments': {
        target: 'http://localhost:5006',
        changeOrigin: true,
      },
      '/dashboard/stats': {
        target: 'http://localhost:5006',
        changeOrigin: true,
      },
      '/dashboard/patient-data': {
        target: 'http://localhost:5006',
        changeOrigin: true,
      },
    },
  },
});
