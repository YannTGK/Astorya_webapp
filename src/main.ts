// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth'

;(async () => {
  const pinia = createPinia()
  const app   = createApp(App)

  app.use(pinia).use(router)

  // ── sessie herstellen vóór mount ──
  const auth = useAuthStore(pinia)
  await auth.restore()

  app.mount('#app')
})()