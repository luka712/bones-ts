// vite.config.js
import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import typescript from 'rollup-plugin-typescript2'


export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BonesFramework',
      // the proper extensions will be added
      fileName: 'index',
    },
  },
})