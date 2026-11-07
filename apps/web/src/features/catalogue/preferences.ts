import { ref, watch } from 'vue'
import type { CatalogueItem } from './catalogue'
function stored<T>(key: string, fallback: T) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') as T ?? fallback } catch { return fallback }
}
export interface SavedRecord { section: string; record: CatalogueItem; mode: string }
export const saved = ref<SavedRecord[]>(stored('pitchpulse:saved:v1', []))
export const guestName = ref(stored('pitchpulse:guest:v1', 'Guest'))
export const alerts = ref(stored('pitchpulse:alerts:v1', { kickoff: true, results: false }))
for (const [key, value] of [['saved', saved], ['guest', guestName], ['alerts', alerts]] as const) {
  watch(value, updated => { try { localStorage.setItem('pitchpulse:' + key + ':v1', JSON.stringify(updated)) } catch { /* Private browsing: keep changes in memory. */ } }, { deep: true })
}
export function isSaved(section: string, id: string) { return saved.value.some(item => item.section === section && item.record.id === id) }
export function toggleSaved(section: string, record: CatalogueItem, mode: string) {
  saved.value = isSaved(section, record.id) ? saved.value.filter(item => item.section !== section || item.record.id !== record.id) : [...saved.value, { section, record, mode }]
}
