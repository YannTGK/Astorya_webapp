// src/router.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Home from './views/Home.vue'
import Login from './views/Login.vue'
import Sky from './views/Sky.vue'

const routes = [
  { path: '/',       name: 'Home',  component: Home },
  { path: '/login',  name: 'Login', component: Login, meta: { guestOnly: true } },

  // 👇 Beschermd scherm
  { path: '/sky',    name: 'Sky',   component: Sky,  meta: { requiresAuth: true } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  // 1️⃣  Blokkeer protected routes voor niet-ingelogden
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'Login' })
  }

  // 2️⃣  Houd inlog-/homepagina’s weg van reeds ingelogde gebruikers
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return next({ name: 'Sky' })
  }

  next()
})