export interface Fixture { id:string; home_team_id:string; away_team_id:string; home_team_name:string; away_team_name:string; competition_id:string; kickoff_utc:string; status:string; clock_seconds:number; home_score:number; away_score:number }
export interface Incident { id:string; fixture_id:string; sequence:number; clock_seconds:number; type:string; team_id:string|null; player_id:string|null; details:Record<string,unknown> }
export interface Sample { fixture_id:string; t_seconds:number; x:number; y:number }
export interface Squad { formation:string; starting_xi:string[]; substitutes:string[] }
export interface Lineups { fixture_id:string; home:Squad; away:Squad }
export interface Stats { fixture_id:string; home:Record<string,number>; away:Record<string,number> }
export interface Evidence { fixture:Fixture; events_so_far:Incident[]; source_is_synthetic:boolean }
export interface Competition { id:string; name:string }
const base=(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1').replace(/\/$/,'')
export async function football<T>(path:string, signal:AbortSignal) {
  const response=await fetch(base+'/football/'+path,{signal:AbortSignal.any([signal, AbortSignal.timeout(20000)])})
  if (!response.ok) throw new Error('Football service returned HTTP '+response.status+'.')
  const value=await response.json()
  if(value?.meta?.data_mode!=='simulated'||value.meta.is_real_live_data!==false||value.data==null) throw new Error('Unsupported football response or provenance.')
  return value as {data:T;pagination?:{page:number;pages:number;total:number}}
}
export function coordinates(samples:Sample[],seconds:number) {
  if(!samples.length || !Number.isFinite(seconds) || seconds<samples[0]!.t_seconds || seconds>samples[samples.length-1]!.t_seconds)return null
  let left=0,right=samples.length-1
  while(left<right){const mid=Math.floor((left+right+1)/2);if(samples[mid]!.t_seconds<=seconds)left=mid;else right=mid-1}
  const a=samples[left]!,b=samples[left+1]??a
  if (![a.x,a.y,b.x,b.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1) || (seconds!==a.t_seconds && b.t_seconds-a.t_seconds>5)) return null
  const t=a===b?0:(seconds-a.t_seconds)/(b.t_seconds-a.t_seconds)
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}
}
export function replayScore(fixture:Fixture,events:Incident[],seconds:number) {
  const score={home:0,away:0}
  for(const e of events)if(e.fixture_id===fixture.id && e.type==='goal'&&e.clock_seconds<=seconds){if(e.team_id===fixture.home_team_id)score.home++;else if(e.team_id===fixture.away_team_id)score.away++}
  return score
}
export function matchTime(seconds:number){const s=Math.max(0,Math.floor(seconds));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
