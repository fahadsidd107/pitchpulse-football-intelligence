import demo from './demo.json'
import { onScopeDispose, ref, watch, toValue, type MaybeRefOrGetter } from 'vue'

export interface CatalogueItem { id: string; name: string; detail: string; value: string }
interface Catalogue { mode: string; items: CatalogueItem[]; source?: string }
const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '')

export function useCatalogue(section: MaybeRefOrGetter<string>) {
  const data = ref<Catalogue>()
  const error = ref('')
  const loading = ref(true)
  const attempt = ref(0)
  let controller: AbortController | undefined
  watch([() => toValue(section), attempt], async ([key]) => {
    controller?.abort()
    const current = new AbortController()
    controller = current
    const fallback = (demo as Record<string, CatalogueItem[]>)[key]
    data.value = fallback ? { mode: 'MOCK', source: 'Bundled fictional demo', items: fallback } : undefined; error.value = ''; loading.value = !fallback
    const timer = setTimeout(() => current.abort('timeout'), 8000)
    try {
      const response = await fetch(base + '/catalogue?section=' + encodeURIComponent(key), { signal: current.signal })
      if (!response.ok) throw new Error('The catalogue returned HTTP ' + response.status + '.')
      const result = await response.json()
      if (typeof result?.mode !== 'string' || !Array.isArray(result.items) || !result.items.every((row: CatalogueItem) => row && ['id', 'name', 'detail', 'value'].every(key => typeof row[key as keyof CatalogueItem] === 'string'))) throw new Error('Unsupported catalogue response.')
      if (controller === current) data.value = result
    } catch (e) {
      if (controller === current) {
        if (fallback) data.value = { mode: 'MOCK', source: 'Bundled fictional demo · API unavailable', items: fallback }
        else error.value = current.signal.aborted ? 'The catalogue request timed out.' : e instanceof Error ? e.message : 'Could not load this catalogue.'
      }
    } finally { clearTimeout(timer); if (controller === current) loading.value = false }
  }, { immediate: true })
  onScopeDispose(() => { const active = controller; controller = undefined; active?.abort() })
  return { data, error, loading, retry: () => { attempt.value++ } }
}
export function provenance(mode: string) { return mode === 'MOCK' ? 'DEMO · FICTIONAL' : mode + ' · PROVIDER RECORDS' }
