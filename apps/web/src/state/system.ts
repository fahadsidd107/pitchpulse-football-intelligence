import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadSystem, loadReadiness, type SystemInfo } from '../data/api'
export const useSystemStore = defineStore('system', () => {
  const system = ref<SystemInfo | null>(null)
  const loading = ref(false)
  const error = ref('')
  const checkedAt = ref<string | null>(null)
  async function refresh() {
    if (loading.value) return
    loading.value = true
    error.value = ''
    system.value = null
    try {
      const [info] = await Promise.all([loadSystem(), loadReadiness()])
      system.value = info
      checkedAt.value = new Date().toLocaleTimeString()
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'The status check failed. Please retry.'
    } finally { loading.value = false }
  }
  return { system, loading, error, checkedAt, refresh }
})
