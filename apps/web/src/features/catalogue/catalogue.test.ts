import { afterEach, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { useCatalogue, provenance } from './catalogue'
afterEach(() => vi.unstubAllGlobals())
it('shows labeled demo on API failure and replaces it on provider recovery', async () => {
  const request = vi.fn().mockResolvedValueOnce(new Response('',{status:503})).mockResolvedValueOnce(Response.json({ mode:'DELAYED',items:[{id:'p-1',name:'A provider record',detail:'Coverage',value:'Observed'}] }))
  vi.stubGlobal('fetch',request)
  const scope = effectScope()
  const catalogue = scope.run(() => useCatalogue(ref('players')))!
  await vi.waitFor(() => expect(catalogue.loading.value).toBe(false))
  expect(catalogue.error.value).toBe('')
  expect(catalogue.data.value?.mode).toBe('MOCK')
  expect(catalogue.data.value?.items.length).toBeGreaterThan(0)
  catalogue.retry()
  await vi.waitFor(() => expect(catalogue.data.value?.mode).toBe('DELAYED'))
  expect(catalogue.data.value?.items[0]?.id).toBe('p-1')
  expect(provenance(catalogue.data.value!.mode)).toContain('PROVIDER')
  expect(provenance('MOCK')).toContain('FICTIONAL')
  scope.stop()
})

it('shows seeded records immediately even when the API route returns 404', async () => {
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('',{status:404})))
 const scope=effectScope()
 const catalogue=scope.run(()=>useCatalogue(ref('clubs')))!
 await vi.waitFor(() => expect(catalogue.loading.value).toBe(false))
 expect(catalogue.data.value?.items.length).toBeGreaterThan(0)
 expect(catalogue.error.value).toBe('')
 expect(catalogue.data.value?.source).toContain('API unavailable')
 scope.stop()
})
