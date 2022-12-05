import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createComponentPlugin } from 'components-plugin'
import inspect from 'vite-plugin-inspect'
import Components from 'unplugin-vue-components/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), inspect(), Components(), createComponentPlugin()]
})
