// src/composables/useStars.ts
import { ref, computed } from 'vue'
import api from '../lib/axios'          // let op alias ( @/ ) i.p.v. ../../

export function useStars() {
  const raw = ref<any[]>([])
  const loading = ref(true)
  const errorMsg = ref<string | null>(null)

  async function load() {
    loading.value = true
    errorMsg.value = null
    try {
      const res = await api.get('/stars/public')

      //  verwacht { stars: [...] }
      raw.value = res.data.stars ?? []
    } catch (err: any) {
      errorMsg.value =
        err.response?.data?.message || err.message || 'Unknown error'
      console.error('[useStars] fetch error →', errorMsg.value)
    } finally {
      loading.value = false
    }
  }

  // laad meteen
  load()

  const stars = computed(() => raw.value)

  return { stars, loading, errorMsg, reload: load }
}