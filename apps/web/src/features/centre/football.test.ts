import {describe,it,expect,vi,afterEach} from 'vitest'
import {coordinates,replayScore,football,type Fixture,type Incident} from './football'
describe('provider-driven replay',()=>{
  const f={id:'f',home_team_id:'home',away_team_id:'away'} as Fixture
  const samples=[{fixture_id:'f',t_seconds:0,x:.1,y:.2},{fixture_id:'f',t_seconds:5,x:.9,y:.8}]
  it('interpolates the same point on every seek and never extrapolates',()=>{
    expect(coordinates(samples,2.5)).toEqual({x:.5,y:.5})
    expect(coordinates(samples,5)).toEqual({x:.9,y:.8})
    expect(coordinates(samples,6)).toBeNull()
    expect(coordinates([samples[0]!,{...samples[1]!,t_seconds:15}],3)).toBeNull()
    expect(coordinates([{...samples[0]!,x:2}],0)).toBeNull()
  })
  it('uses only goals for the selected fixture at or before the cursor',()=>{
    const e={type:'goal',fixture_id:'f',team_id:'home',clock_seconds:200} as Incident
    const events=[e,{...e,fixture_id:'other'},{...e,type:'shot'},{...e,team_id:'away',clock_seconds:500}]
    expect(replayScore(f,events,199)).toEqual({home:0,away:0});expect(replayScore(f,events,499)).toEqual({home:1,away:0});expect(replayScore(f,events,500)).toEqual({home:1,away:1})
  })
  afterEach(()=>vi.unstubAllGlobals())
  it('rejects unlabelled payloads instead of inventing provenance',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({data:[],meta:{}})))
    await expect(football('live',new AbortController().signal)).rejects.toThrow('provenance')
  })
})
