import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        // target: 'http://89.111.169.7:8000',
        // target: 'http://80.78.242.132/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Убедитесь, что путь соответствует серверу
      },
    },
  },
});