import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: '../appinfo.json', dest: '.' },
        { src: '../icon.png', dest: '.' },
        { src: '../largeIcon.png', dest: '.' },
      ],
    }),
  ],
  build: {
    target: 'chrome79',
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 800,
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
})