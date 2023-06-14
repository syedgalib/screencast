import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import projectConfig from './vite.project-config'
import mkcert from 'vite-plugin-mkcert'
const path = require('path');

// https://vitejs.dev/config/
export default defineConfig( ( { command, mode } ) => {
  const config = projectConfig( mode );

  console.log( { command, mode } );

  return {
    plugins: [ react(), mkcert() ],
    build: {
      outDir: '',
      assetsDir: 'assets',
      emptyOutDir: false,
      polyfillModulePreload: false,
      sourcemap: true,
      minify: config.minify,
      rollupOptions: {
        input: {
          main: '/src/js/main.js',
        },
        output: {
          entryFileNames: config.entryFileNames,
          chunkFileNames: config.entryFileNames,
          assetFileNames: config.assetFileNames,
        }
      },
    },
    server: config.server,
    resolve: {
      alias: {
        ASSETS: path.resolve( __dirname, 'src/assets/' ),
        SCSS: path.resolve( __dirname, 'src/sass/' ),
      }
    }
  }
})