import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './public', // Agar index.html public folder ke andar hai
  build: {
    outDir: '../dist',
  },
});