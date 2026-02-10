import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  server: {
    host: 'localhost',
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 3000,
    strictPort: false,
    open: true,
  },
})