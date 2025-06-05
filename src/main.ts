// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth'

const pinia = createPinia()
const app   = createApp(App)

app.use(pinia).use(router)

// 1) token (indien aanwezig) direct in Axios-headers zetten
const auth = useAuthStore(pinia)
await auth.restore()   // haalt /auth/me op als token geldig is

app.mount('#app')