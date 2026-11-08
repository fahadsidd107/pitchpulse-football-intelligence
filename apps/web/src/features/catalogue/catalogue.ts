import { onScopeDispose, ref, watch, toValue, type MaybeRefOrGetter } from 'vue'

export interface CatalogueItem { id: string; name: string; detail: string; value: string }
interface Catalogue { mode: string; items: CatalogueItem[]; source?: string }
const demos = import.meta.glob<CatalogueItem[]>('./demo/*.json', { import: 'default' })
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
    data.value = undefined; error.value = ''; loading.value = true
    let fallback: CatalogueItem[] | undefined
    try { fallback = await demos['./demo/' + key + '.json']?.() } catch { /* API can still supply data. */ }
    if (controller !== current) return
    data.value = fallback ? { mode: 'MOCK', source: 'pitchpulse-data · synthetic dataset', items: fallback } : undefined; error.value = ''; loading.value = !fallback
    const timer = setTimeout(() => current.abort('timeout'), 8000)
    try {
      const response = await fetch(base + '/catalogue?section=' + encodeURIComponent(key), { signal: current.signal })
      if (!response.ok) throw new Error('The catalogue returned HTTP ' + response.status + '.')
      const result = await response.json()
      if (typeof result?.mode !== 'string' || !Array.isArray(result.items) || !result.items.every((row: CatalogueItem) => row && ['id', 'name', 'detail', 'value'].every(key => typeof row[key as keyof CatalogueItem] === 'string'))) throw new Error('Unsupported catalogue response.')
      if (result.mode === 'MOCK' && result.source !== 'pitchpulse-data') throw new Error('Legacy demo catalogue ignored.')
      if (controller === current) data.value = result
    } catch (e) {
      if (controller === current) {
        if (fallback) data.value = { mode: 'MOCK', source: 'pitchpulse-data · API unavailable', items: fallback }
        else error.value = current.signal.aborted ? 'The catalogue request timed out.' : e instanceof Error ? e.message : 'Could not load this catalogue.'
      }
    } finally { clearTimeout(timer); if (controller === current) loading.value = false }
  }, { immediate: true })
  onScopeDispose(() => { const active = controller; controller = undefined; active?.abort() })
  return { data, error, loading, retry: () => { attempt.value++ } }
}
export function provenance(mode: string) { return ['MOCK', 'SIMULATED'].includes(mode) ? 'SIMULATED DEMO · FICTIONAL · pitchpulse-data' : mode + ' · PROVIDER RECORDS' }
