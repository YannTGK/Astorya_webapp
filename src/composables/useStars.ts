import { ref, computed } from 'vue'
import api from '../lib/axios'
import type { StarData } from '../types'

export function useStars() {
  const raw = ref<StarData[]>([])
  const loading   = ref(true)
  const errorMsg  = ref<string | null>(null)

  async function load() {
    loading.value = true
    errorMsg.value = null
    try {
      const res = await api.get('/stars/public')
      raw.value = (res.data.stars ?? []) as StarData[]
    } catch (err: any) {
      errorMsg.value =
        err.response?.data?.message || err.message || 'Unknown error'
      console.error('[useStars] fetch error →', errorMsg.value)
    } finally {
      loading.value = false
    }
  }

  // init
  load()

  return { stars: computed(() => raw.value), loading, errorMsg, reload: load }
}