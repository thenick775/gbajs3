import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['/img/favicon.ico'],
      manifest: {
        name: 'Gbajs3',
        short_name: 'GJ3',
        description: 'GBA emulator fully in the Browser',
        theme_color: '#979597',
        background_color: '#212529',
        icons: [
          {
            src: '/img/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/img/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png',
          },
          {
            src: '/img/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: '/img/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/img/maskable-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/img/maskable-icon-256x256.png',
            sizes: '256x256',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/img/maskable-icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/img/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'src/emulator/mgba/wasm/mgba.wasm',
          dest: 'assets',
        },
      ],
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.indexOf('node_modules') > -1) {
            return id
              .toString()
              .split('node_modules/')[1]
              .split('/')[0]
              .toString();
          }
        },
      },
    },
  },
});
