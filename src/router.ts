import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'

import Home from './views/Home.vue'
import Login from './views/Login.vue'
import Sky   from './views/Sky.vue'
import Room  from './views/Room.vue'

const routes = [
  { path: '/',           name: 'Home', component: Home },
  { path: '/login',      name: 'Login', component: Login, meta: { guestOnly: true } },

  // 👇 Beschermd
  { path: '/sky',        name: 'Sky',   component: Sky,  meta: { requiresAuth: true } },
  { path: '/room/:starId', name: 'Room',  component: Room, meta: { requiresAuth: true } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// global guards
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated)
    return next({ name: 'Login' })
  if (to.meta.guestOnly && auth.isAuthenticated)
    return next({ name: 'Sky' })
  next()
})