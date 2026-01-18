import { defineConfig } from 'vite';
import { createAngularPlugin } from '@analogjs/vite-plugin-angular';

export default defineConfig(({ command, mode }) => ({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5014',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  plugins: [createAngularPlugin()]
}));
