// src/stores/auth.ts
import { defineStore } from 'pinia'
import api from '../lib/axios'

interface User {
  _id: string
  email: string
  username: string
  // voeg extra velden toe
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') as string | null,
    user: null as User | null,
    loadingUser: false,
  }),

  getters: {
    /** `true` zodra token + user geladen is */
    isAuthenticated: (state) => !!state.token && !!state.user,
  },

  actions: {
    /** 1) Bewaar token + zet header  */
    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
      api.defaults.headers.common.Authorization = `Bearer ${token}`
    },

    /** 2) Bewaar user  */
    setUser(user: User) {
      this.user = user
    },

    /** 3) Login: krijg token, laad user */
    async login(email: string, password: string) {
      const { data } = await api.post('/auth/login', { email, password })
      this.setToken(data.token)
      await this.fetchCurrentUser()
    },

    /** 4) User data ophalen met token  */
    async fetchCurrentUser() {
      if (!this.token) return
      this.loadingUser = true
      try {
        const { data } = await api.get('/auth/me')
        this.setUser(data.user)
      } catch (err) {
        // token ongeldig → uitloggen
        this.logout()
        throw err
      } finally {
        this.loadingUser = false
      }
    },

    /** 5) Bij app-start token herstellen */
    async restore() {
      if (this.token) {
        api.defaults.headers.common.Authorization = `Bearer ${this.token}`
        try {
          await this.fetchCurrentUser()
        } catch {
          /* token verlopen → blijft uitgelogd */
        }
      }
    },

    /** 6) Logout  */
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      delete api.defaults.headers.common.Authorization
    },
  },
})