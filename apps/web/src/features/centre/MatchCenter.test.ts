import { flushPromises,mount } from '@vue/test-utils'
import { expect,it,vi } from 'vitest'
import MatchCenter from './MatchCenter.vue'
it('renders source scores, resolves squad names, and rewinds events and score together',async()=>{
  vi.stubGlobal('WebSocket', undefined)
  const fixture={id:'sample',home_team_id:'h',away_team_id:'a',competition_id:'cup',home_team_name:'Home XI',away_team_name:'Away XI',status:'live_demo',home_score:1,away_score:0,clock_seconds:120}
  const incident={id:'goal1',fixture_id:'sample',team_id:'h',player_id:'h-9',clock_seconds:100,type:'goal',sequence:1,details:{}}
  const side={formation:'4-3-3',starting_xi:['h-9'],substitutes:[]}
  const bodies:Record<string,unknown>={live:[fixture],'live-state':fixture,events:[incident],lineups:{fixture_id:'sample',home:side,away:side},statistics:{fixture_id:'sample',home:{shots:9},away:{shots:4}},tracking:[{fixture_id:'sample',t_seconds:0,x:.1,y:.1}], 'ai-context':{fixture,events_so_far:[incident],source_is_synthetic:true},squad:[{id:'h-9',name:'Demo Forward'}]}
  vi.stubGlobal('fetch',vi.fn((url:string)=>Promise.resolve(Response.json({data:bodies[new URL(url).pathname.split('/').pop()!],meta:{data_mode:'simulated',is_real_live_data:false}}))))
  const wrapper=mount(MatchCenter,{global:{stubs:{TrackingPitch:true,FixtureCalendar:true}}})
  try {
    await flushPromises()
    expect(wrapper.text()).toContain('SIMULATED DEMO')
    expect(wrapper.get('.match-workspace h3').text()).toContain('1 : 0')
    expect(wrapper.get('.incident-list').text()).toContain('Demo Forward')
    await wrapper.get('input[type=range]').setValue('50')
    expect(wrapper.get('.match-workspace h3').text()).toContain('0 : 0')
    expect(wrapper.get('.incident-list').text()).not.toContain('Demo Forward')
    await wrapper.findAll('button').find(b=>b.text()==='Statistics')!.trigger('click')
    expect(wrapper.text()).toContain('Full-fixture simulated statistics')
  } finally {wrapper.unmount();vi.unstubAllGlobals()}
})
