import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSystemStore } from './system'
import { loadSystem } from '../data/api'
const info = { name: 'PitchPulse', version: '0.1.0', data_mode: 'MOCK', football_data_available: false }
function mockFetch(ready = true) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(url.endsWith('/system') ? info : { status: 'ready', dependencies: { postgresql: 'up' } }), { status: url.endsWith('/system') || ready ? 200 : 503 })))
}
beforeEach(() => { setActivePinia(createPinia()); vi.unstubAllGlobals() })
describe('system connection', () => {
  it('loads real contract and readiness together', async () => {
    mockFetch()
    const store = useSystemStore()
    await store.refresh()
    expect(store.system).toEqual(info)
    expect(store.error).toBe('')
    expect(store.checkedAt).not.toBeNull()
  })
  it('clears stale success when database fails, then recovers', async () => {
    mockFetch()
    const store = useSystemStore()
    await store.refresh()
    mockFetch(false)
    await store.refresh()
    expect(store.system).toBeNull()
    expect(store.error).toContain('database is unavailable')
    mockFetch()
    await store.refresh()
    expect(store.error).toBe('')
    expect(store.system).not.toBeNull()
  })
  it('shows a helpful offline failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const store = useSystemStore()
    await store.refresh()
    expect(store.error).toContain('Cannot reach the API')
    expect(store.loading).toBe(false)
  })
  it('rejects empty or unexpected contracts', async () => {
    for (const value of [null, {}, { ...info, data_mode: 'LIVE_OBSERVED' }]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(value))))
      await expect(loadSystem()).rejects.toThrow('unsupported system response')
    }
  })
  it('prevents duplicate in-flight requests', async () => {
    const resolvers: Array<(value: Response) => void> = []
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { resolvers.push(resolve) })))
    const store = useSystemStore()
    const first = store.refresh()
    await store.refresh()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(store.loading).toBe(true)
    resolvers[0]!(new Response(JSON.stringify(info)))
    resolvers[1]!(new Response(JSON.stringify({ status: 'ready', dependencies: { postgresql: 'up' } })))
    await first
    expect(store.loading).toBe(false)
  })
})
