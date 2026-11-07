import { expect,it,vi } from 'vitest'
import { subscribeFixture } from './socket'
it('restores a fresh projection after disconnect and rejects stale revisions and unrelated fixtures',()=>{
  vi.useFakeTimers()
  const sockets: Socket[]=[]
  class Socket{
    onmessage?: (event:{data:string})=>void;onclose?:()=>void
    constructor(public url:string){sockets.push(this)}
    close(){this.onclose?.()}
    send(revision:number,id='current'){
      this.onmessage?.({data:JSON.stringify({type:'snapshot',mode:'SIMULATED',revision,data:{id,home_team_id:'h',away_team_id:'a',home_team_name:'H',away_team_name:'A',competition_id:'c',status:'live_demo',kickoff_utc:'2026-11-07T00:00:00Z',clock_seconds:120,home_score:1,away_score:0}})})
    }
  }
  vi.stubGlobal('WebSocket',Socket)
  const receive=vi.fn(),status=vi.fn()
  const stop=subscribeFixture('current',receive,status)
  try{
    const first=sockets[0]!
    expect(first.url).toMatch(/^wss?:.*\/football\/ws\/current$/)
    first.send(2);first.send(2);first.send(1);first.send(5,'other')
    expect(receive).toHaveBeenCalledTimes(1)
    first.close();expect(status).toHaveBeenLastCalledWith('HTTP polling fallback')
    vi.advanceTimersByTime(1000);expect(sockets).toHaveLength(2)
    sockets[1]!.send(1);first.send(10);sockets[1]!.send(3)
    expect(receive).toHaveBeenCalledTimes(2);expect(status).toHaveBeenLastCalledWith('WebSocket')
    stop();sockets[1]!.send(4);vi.advanceTimersByTime(60000)
    expect(sockets).toHaveLength(2);expect(receive).toHaveBeenCalledTimes(2)
  }finally{stop();vi.unstubAllGlobals();vi.useRealTimers()}
})
