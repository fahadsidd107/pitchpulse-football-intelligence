export interface SystemInfo { name: string; version: string; data_mode: 'MOCK'; football_data_available: false }
export interface ReadyInfo { status: 'ready'; dependencies: { postgresql: 'up' } }
const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '')
async function get(path: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    const response = await fetch(`${base}${path}`, { signal: controller.signal })
    if (!response.ok) throw new Error(response.status === 503 ? 'The API is reachable, but its database is unavailable.' : `The API returned HTTP ${response.status}.`)
    return await response.json()
  } catch (error) {
    if (error instanceof TypeError) throw new Error('Cannot reach the API. Check your connection and start the local API.')
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('The status check timed out. Please retry.')
    throw error
  } finally { clearTimeout(timer) }
}
export async function loadSystem(): Promise<SystemInfo> {
  const value = await get('/system') as Partial<SystemInfo> | null
  if (!value || typeof value.name !== 'string' || typeof value.version !== 'string' || value.data_mode !== 'MOCK' || value.football_data_available !== false) throw new Error('The API returned an unsupported system response.')
  return value as SystemInfo
}
export async function loadReadiness(): Promise<ReadyInfo> {
  const value = await get('/health/ready') as Partial<ReadyInfo> | null
  if (value?.status !== 'ready' || value.dependencies?.postgresql !== 'up') throw new Error('The API returned an unsupported readiness response.')
  return value as ReadyInfo
}
