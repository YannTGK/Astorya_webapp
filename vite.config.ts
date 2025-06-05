// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'   // ⬅️ 1

export default defineConfig({
  plugins: [vue()],
  resolve: {                                    // ⬅️ 2
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // nu werkt "@/..."
    },
  },
})