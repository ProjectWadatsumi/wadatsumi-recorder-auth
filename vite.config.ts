import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/wadatsumi-recorder-auth/',
  build: {
    chunkSizeWarningLimit: 1000,
  },
  plugins: [react()],
});
