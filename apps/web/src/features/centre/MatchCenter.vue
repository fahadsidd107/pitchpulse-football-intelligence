<script setup lang="ts">
import { computed,onBeforeUnmount,onMounted,ref,shallowRef,watch } from 'vue'
import { football, coordinates, matchTime, replayScore, type Fixture,type Incident,type Lineups,type Stats,type Sample,type Evidence } from './football'
import {subscribeFixture,type Transport} from './socket'
import TrackingPitch from './TrackingPitch.vue'
import FixtureCalendar from './FixtureCalendar.vue'
const fixtures=shallowRef<Fixture[]>([]), active=shallowRef<Fixture>(), state=shallowRef<Fixture>(), events=shallowRef<Incident[]>([]),stats=shallowRef<Stats>(),lineups=shallowRef<Lineups>(),tracking=shallowRef<Sample[]>([]),evidence=shallowRef<Evidence>()
const names=shallowRef<Record<string,string>>({})
function player(id:unknown){return typeof id==='string' ? names.value[id] ?? id : 'Player not recorded'}
const transport=ref<Transport>('Connecting · HTTP polling');let unsubscribe:(()=>void)|undefined
const providerError=ref(''),detailError=ref(''),pollError=ref(''),loaded=ref(false),calendar=ref(false),tab=ref('Timeline'),question=ref('Who scored?')
const mode=ref<'clock'|'replay'>('clock'),playing=ref(false),seconds=ref(0),speed=ref(1),speeds=[1,5,20,60]
const lifetime=new AbortController(); let request:AbortController|undefined;let tick:ReturnType<typeof setInterval>;let poll:ReturnType<typeof setInterval>;let rotation:ReturnType<typeof setInterval>;let anchor=0,serverAt=0,last=0;let listPending=false,refreshController:AbortController|undefined
const base=(f:Fixture)=>'fixtures/'+encodeURIComponent(f.id)+'/'
async function showLive(){if(listPending)return;listPending=true;try{const {data}=await football<Fixture[]>('live',lifetime.signal);fixtures.value=data;providerError.value='';if(!active.value||(!calendar.value && active.value.status==='live_demo'&&!data.some(f=>f.id===active.value?.id)))select(data[0])}catch{if(!lifetime.signal.aborted)providerError.value='Cannot reach the simulated live fixtures.'}finally{listPending=false}}
function select(f?:Fixture){if(f)active.value=f}
function sampleClock(f:Fixture){state.value=f;serverAt=f.clock_seconds;anchor=performance.now();if(mode.value==='clock')seconds.value=serverAt}
async function details(){const f=active.value;if(!f)return;unsubscribe?.();transport.value='Connecting · HTTP polling';request?.abort();const controller=new AbortController();request=controller;loaded.value=false;detailError.value='';pollError.value='';events.value=[];lineups.value=undefined;stats.value=undefined;tracking.value=[];evidence.value=undefined;mode.value='clock';playing.value=false;sampleClock(f)
names.value={}
const path=base(f),sig=controller.signal
void Promise.allSettled([f.home_team_id,f.away_team_id].map(id=>football<{id:string;name:string}[]>('clubs/'+encodeURIComponent(id)+'/squad',sig))).then(results=>{
  if(request===controller) names.value=Object.fromEntries(results.flatMap(result=>result.status==='fulfilled'?result.value.data.map(row=>[row.id,row.name]):[]))
})
try{const [s,e,l,t,p,a]=await Promise.all([football<Fixture>(path+'live-state',sig),football<Incident[]>(path+'events',sig),football<Lineups>(path+'lineups',sig),football<Stats>(path+'statistics',sig),football<Sample[]>(path+'tracking?start=0&end=5400&step=5',sig),football<Evidence>(path+'ai-context',sig)])
if(request!==controller)return
if([s.data.id,l.data.fixture_id,t.data.fixture_id,a.data.fixture.id].some(id=>id!==f.id)||!a.data.source_is_synthetic||!e.data.every(row=>row.fixture_id===f.id)||!p.data.every(row=>row.fixture_id===f.id))throw Error('Fixture mismatch')
events.value=[...e.data].sort((a,b)=>a.clock_seconds-b.clock_seconds||a.sequence-b.sequence);lineups.value=l.data;stats.value=t.data;tracking.value=[...p.data].sort((a,b)=>a.t_seconds-b.t_seconds);evidence.value=a.data;sampleClock(s.data);loaded.value=true
unsubscribe=subscribeFixture(f.id,snapshot=>{if(request===controller){pollError.value='';sampleClock(snapshot)}},next=>{if(request===controller){transport.value=next;if(next==='HTTP polling fallback')void sync()}})
}catch{if(request===controller&&!controller.signal.aborted)detailError.value='The fixture details could not be loaded. No substitute data is shown.'}}
watch(()=>active.value?.id,details)
const usingSocket=()=>transport.value==='WebSocket'
async function sync(){const f=active.value,controller=request;if(!f||!controller||!loaded.value||usingSocket()||refreshController===controller||document.hidden)return;refreshController=controller
try{const {data}=await football<Fixture>(base(f)+'live-state',controller.signal);if(controller===request&&data.id===f.id&&!usingSocket()){sampleClock(data);pollError.value=''}}catch{if(controller===request&&!controller.signal.aborted&&!usingSocket())pollError.value='Clock sync interrupted; showing the last confirmed state.'}finally{if(refreshController===controller)refreshController=undefined}}
function advance(){const now=performance.now(),delta=(now-last)/1000;last=now;if(!loaded.value||document.hidden)return;if(mode.value==='clock'){seconds.value=serverAt+(state.value?.status==='live_demo'&&!pollError.value?Math.min(8,(now-anchor)/1000):0)}else if(playing.value){seconds.value+=delta*speed.value;if(seconds.value>=5400)playing.value=false}seconds.value=Math.max(0,Math.min(5400,seconds.value))}
function replay(at:number){mode.value='replay';seconds.value=Math.max(0,Math.min(5400,at));playing.value=false}
function play(){if(mode.value!=='replay'||seconds.value>=5400)replay(0);last=performance.now();playing.value=!playing.value}
function follow(){mode.value='clock';playing.value=false;seconds.value=serverAt;void sync()}
function visibility(){last=performance.now();if(!document.hidden)void sync()}
onMounted(()=>{void showLive();last=performance.now();tick=setInterval(advance,100);poll=setInterval(sync,5000);rotation=setInterval(showLive,45000);document.addEventListener('visibilitychange',visibility)})
onBeforeUnmount(()=>{unsubscribe?.();lifetime.abort();request?.abort();request=undefined;clearInterval(tick);clearInterval(poll);clearInterval(rotation);document.removeEventListener('visibilitychange',visibility)})
const point=computed(()=>coordinates(tracking.value,seconds.value))
const shown=computed(()=>events.value.filter(e=>e.clock_seconds<=seconds.value).slice().reverse())
const score=computed(()=>{
  const fixture=state.value
  if(!fixture)return undefined
  if(mode.value==='replay')return replayScore(fixture,events.value,seconds.value)
  const since=events.value.filter(e=>e.clock_seconds>fixture.clock_seconds)
  const goals=replayScore(fixture,since,seconds.value)
  return {home:fixture.home_score+goals.home,away:fixture.away_score+goals.away}
})
const teams=['home','away'] as const
const evidenceAnswer=computed(()=>{const a=evidence.value;if(!a)return '';const kind=question.value==='Who scored?'?'goal':question.value==='Who was booked?'?'yellow_card':'penalty_awarded';const matches=a.events_so_far.filter(e=>e.type===kind&&e.clock_seconds<=seconds.value);return matches.length?matches.map(e=>matchTime(e.clock_seconds)+' · '+(kind==='penalty_awarded'?player(e.details.fouling_player_id):player(e.player_id))).join('; '):'No matching incident in the available evidence.'})
</script>
<template>
  <section class="match-centre" aria-labelledby="centre-title">
    <div class="catalogue-bar"><div><p class="eyebrow">MATCH INTELLIGENCE / ROLLING FIXTURES</p><h2 id="centre-title">Match Center</h2></div><span class="demo-label">SIMULATED DEMO</span></div><p>Always-on fictional fixtures, rosters and ball movement. These are not real live matches.</p><div class="fixture-picker" role="group" aria-label="Active simulated fixtures"><button v-for="f in fixtures" :key="f.id" :aria-pressed="active?.id===f.id" @click="select(f)">{{ f.home_team_name }} v {{ f.away_team_name }}</button></div><p v-if="providerError" role="alert">{{ providerError }} <button @click="showLive">Retry fixtures</button></p><button class="text-link" :aria-expanded="calendar" @click="calendar=!calendar">{{ calendar?'Hide fixture calendar':'Browse fixture calendar' }}</button><FixtureCalendar v-if="calendar" @select="select" />
    <p v-if="detailError" role="alert">{{ detailError }} <button @click="details">Retry fixture</button></p><p v-else-if="!loaded && !providerError" role="status">Loading simulated fixture…</p><article v-else-if="loaded && state && score" class="match-workspace">
      <p class="eyebrow">{{ state.competition_id }} / {{ mode==='clock' ? state.status.replaceAll('_',' ') : 'REPLAY' }}</p><h3>{{ state.home_team_name }} <strong>{{ score.home }} : {{ score.away }}</strong> {{ state.away_team_name }}</h3><p>{{ mode==='clock'?'Fixture clock':'Replay clock' }} · <strong>{{ matchTime(seconds) }}</strong></p><p>Update transport: {{ transport }}</p><p v-if="pollError" role="status">{{ pollError }}</p><TrackingPitch :point="point" /><div class="centre-controls"><button @click="play">{{ playing?'Pause replay':mode==='clock'?'Replay from kickoff':'Play replay' }}</button><button @click="follow">Follow fixture clock</button><label>Speed<select v-model.number="speed"><option v-for="rate in speeds" :key="rate" :value="rate">{{ rate }}×</option></select></label></div><label class="replay-seek">Seek replay · {{ matchTime(seconds) }}<input type="range" min="0" max="5400" step="1" :value="seconds" :aria-valuetext="matchTime(seconds)" @input="replay(Number(($event.target as HTMLInputElement).value))"></label>
      <div class="centre-controls" role="group" aria-label="Fixture detail"><button v-for="name in ['Timeline','Statistics','Lineups','Evidence']" :key="name" :aria-pressed="tab===name" @click="tab=name">{{ name }}</button></div>
      <section v-if="tab==='Timeline'"><h4>Event timeline</h4><ol class="incident-list"><li v-for="e in shown" :key="e.id"><button @click="replay(e.clock_seconds)">{{ matchTime(e.clock_seconds) }}</button><strong>{{ e.type.replaceAll('_',' ') }}</strong><span>{{ e.team_id===state.home_team_id?state.home_team_name:e.team_id===state.away_team_id?state.away_team_name:'' }} {{ e.player_id ? player(e.player_id) : '' }}</span><small v-if="e.details.out_player_id">Off: {{ player(e.details.out_player_id) }}</small></li></ol></section>
      <section v-if="tab==='Statistics' && stats"><h4>Full-fixture simulated statistics</h4><p>Generated match totals; these are not minute-by-minute measurements.</p><table><caption>Simulated fixture totals</caption><thead><tr><th scope="col">Metric</th><th scope="col">{{ state.home_team_name }}</th><th scope="col">{{ state.away_team_name }}</th></tr></thead><tbody><tr v-for="(v,key) in stats.home" :key="key"><th scope="row">{{ key.replaceAll('_',' ') }}</th><td>{{ v }}</td><td>{{ stats.away[key] ?? '—' }}</td></tr></tbody></table></section>
      <section v-if="tab==='Lineups' && lineups"><h4>Illustrative squads</h4><div class="lineup-grid"><article v-for="side in teams" :key="side"><h5>{{ side==='home'?state.home_team_name:state.away_team_name }} · {{ lineups[side].formation }}</h5><p>Starting XI · illustrative roster</p><ol><li v-for="id in lineups[side].starting_xi" :key="id">{{ player(id) }}</li></ol><details><summary>Bench ({{ lineups[side].substitutes.length }})</summary><ul><li v-for="id in lineups[side].substitutes" :key="id">{{ player(id) }}</li></ul></details></article></div></section>
      <section v-if="tab==='Evidence' && evidence"><h4>Fixture evidence lookup</h4><p>Deterministic lookup, not an AI model. Context snapshot at {{ matchTime(evidence.fixture.clock_seconds) }}; later events are excluded.</p><label>Question<select v-model="question"><option>Who scored?</option><option>Who was booked?</option><option>Who committed the penalty foul?</option></select></label><p aria-live="polite">{{ evidenceAnswer }}</p></section>
    </article>
  </section>
</template>
