import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

function removerModuleType() {
  return {
    name: 'remover-module-type',
    enforce: 'post' as const,
    transformIndexHtml(html: string) {
      return html
        .replace(/\s+type="module"/g, '')
        .replace(/\s+crossorigin/g, '');
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    removerModuleType(),
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
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})