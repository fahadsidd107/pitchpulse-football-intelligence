import type { Fixture } from './football'

export type Transport = 'Connecting · HTTP polling' | 'WebSocket' | 'HTTP polling fallback'

/** Each connection starts by receiving a complete projection, not deltas. */
export function subscribeFixture(id: string, receive: (fixture: Fixture) => void, status: (transport: Transport) => void) {
  const api = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
  const url = new URL(api.replace(/\/$/, '') + '/football/ws/' + encodeURIComponent(id), window.location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  let active: WebSocket | undefined
  let closed = false
  let lastRevision = -1
  let retries = 0
  let retry: ReturnType<typeof setTimeout>
  let watchdog: ReturnType<typeof setTimeout>
  const arm = (socket: WebSocket) => {
    clearTimeout(watchdog)
    watchdog = setTimeout(() => { if (active === socket) socket.close() }, 20000)
  }
  function recover() {
    if (closed) return
    status('HTTP polling fallback')
    retry = setTimeout(connect, Math.min(30000, 1000 * 2 ** Math.min(retries++,5)))
  }
  function connect() {
    if (closed) return
    if (typeof WebSocket === 'undefined') {status('HTTP polling fallback'); return}
    let socket: WebSocket
    try { socket = new WebSocket(url.href) } catch {recover();return}
    active = socket
    arm(socket)
    socket.onmessage = event => {
      if (closed || active !== socket || typeof event.data !== 'string') return
      let message
      try {message = JSON.parse(event.data)} catch {return}
      const f = message?.data
      if (message?.type !== 'snapshot' || message.mode !== 'SIMULATED' || !Number.isSafeInteger(message.revision) || message.revision < 0 || !f || f.id !== id
          || !['home_team_id','away_team_id','home_team_name','away_team_name','competition_id','status','kickoff_utc'].every(key => typeof f[key] === 'string')
          || ![f.home_score,f.away_score,f.clock_seconds].every(n=>Number.isSafeInteger(n)&&n>=0) || f.clock_seconds>5400) return
      arm(socket)
      if (message.revision <= lastRevision) return
      lastRevision = message.revision
      retries = 0
      status('WebSocket')
      receive(f)
    }
    socket.onerror = () => {if(active===socket)socket.close()}
    socket.onclose = () => {
      if(active !== socket)return
      active = undefined;clearTimeout(watchdog); recover()
    }
  }
  status('Connecting · HTTP polling')
  connect()
  return () => {closed=true;clearTimeout(retry);clearTimeout(watchdog);const socket=active;active=undefined;socket?.close()}
}
