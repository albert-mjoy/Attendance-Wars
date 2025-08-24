import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [],
  root: resolve(__dirname, 'client'),
  server: {
    host: '0.0.0.0',
    port: 5000
  },
  preview: {
    host: '0.0.0.0',
    port: 5000
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  // Support for various asset types including game assets
  assetsInclude: [
    '**/*.gltf', 
    '**/*.glb', 
    '**/*.mp3', 
    '**/*.ogg', 
    '**/*.wav',
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg'
  ],
});