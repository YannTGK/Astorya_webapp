import { defineStore } from 'pinia'
import api from '../lib/axios'

type User = { id: string; name: string; email: string }

interface State {
  token: string | null
  user:  User   | null
  loading: boolean
}

const TOKEN_KEY = 'astorya_jwt'
const USER_KEY  = 'astorya_user'

export const useAuthStore = defineStore('auth', {
  state: (): State => ({
    token  : null,
    user   : null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (s) => !!s.token,
  },

  actions: {
    /** probeer bestaande sessie te herstellen; roept je in main.ts aan */
    async restore() {
      const t = localStorage.getItem(TOKEN_KEY)
      if (!t) return false

      this.token = t
      api.defaults.headers.common.Authorization = `Bearer ${t}`

      try {
        const { user } = (await api.get('/auth/me')).data
        this.user = user
        localStorage.setItem(USER_KEY, JSON.stringify(user))
        return true
      } catch {
        // token ongeldig → opschonen
        this.logout()
        return false
      }
    },

    async login(email: string, password: string) {
      this.loading = true
      try {
        const { token, user } = (await api.post('/auth/login', { email, password })).data
        this.token = token
        this.user  = user
        localStorage.setItem(TOKEN_KEY, token)
        localStorage.setItem(USER_KEY,  JSON.stringify(user))
        api.defaults.headers.common.Authorization = `Bearer ${token}`
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.token = null
      this.user  = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      delete api.defaults.headers.common.Authorization
    },
  },
})