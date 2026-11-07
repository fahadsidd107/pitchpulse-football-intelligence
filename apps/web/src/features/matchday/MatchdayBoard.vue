<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
interface Fixture { id:number; kickoff:string; status:string; competition:string|null; home:string|null; away:string|null; home_score:number|null; away_score:number|null }
interface Feed { source:string; mode:'MOCK'|'DELAYED'; stale:boolean; fetched_at:number|null; matches:Fixture[] }
const feed=ref<Feed|null>(null), warning=ref(''), busy=ref(false), filter=ref('All'), selected=ref<number|null>(null)
const filters=['All','In play','Upcoming','Results']
const rows=computed(()=>(feed.value?.matches??[]).filter(m=>filter.value==='All'||(filter.value==='Upcoming'?['SCHEDULED','TIMED']:filter.value==='Results'?['FINISHED','AWARDED']:['IN_PLAY','PAUSED','EXTRA_TIME','PENALTY_SHOOTOUT']).includes(m.status)))
const featured=computed(()=>rows.value.find(m=>m.id===selected.value)??rows.value[0])
const date=(iso:string)=>new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'}).format(new Date(iso))+' UTC'
let request:AbortController|undefined, timer:ReturnType<typeof setInterval>|undefined
async function refresh(){
 if(busy.value)return
 busy.value=true;warning.value='';request=new AbortController()
 const timeout=setTimeout(()=>request?.abort(),6000)
 try {
  const base=(import.meta.env.VITE_API_BASE_URL||'http://localhost:3000/api/v1').replace(/\/$/,'')
  const res=await fetch(base+'/matchday',{signal:request.signal})
  if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.error?.message||'The matchday feed is unavailable.')}
  const next=await res.json() as Feed
  if(!['MOCK','DELAYED'].includes(next.mode)||!Array.isArray(next.matches))throw new Error('Unrecognized matchday feed.')
  feed.value=next
 }catch(e){warning.value=e instanceof Error && e.name!=='AbortError' && !(e instanceof TypeError)?e.message:'Could not refresh the matchday feed. Try again.'}
 finally{clearTimeout(timeout);busy.value=false}
}
onMounted(()=>{void refresh();timer=setInterval(()=>{if(!document.hidden)void refresh()},60000)})
onBeforeUnmount(()=>{clearInterval(timer);request?.abort()})
</script>
<template>
  <section aria-labelledby="match-heading" class="match-section">
    <div class="section-heading"><div><p class="eyebrow">01 / THE MATCHDAY</p><h2 id="match-heading">Match centre.</h2></div><button class="ui-button ui-button--secondary" :disabled="busy" @click="refresh">{{ busy?'Refreshing…':'Refresh fixtures' }}</button></div>
    <p class="feed-source" aria-live="polite">
      <template v-if="feed?.mode==='DELAYED'">Football data provided by <a href="https://www.football-data.org/">football-data.org</a> · Delayed scores · Today in UTC<span v-if="feed.fetched_at"> · Fetched {{ date(new Date(feed.fetched_at*1000).toISOString()) }}</span></template>
      <template v-else-if="feed">DEMO · Fictional matchday · 31 October 2026</template>
      <template v-else-if="busy">Loading fixtures…</template>
      <strong v-if="feed && (feed.stale || warning)"> · Last known snapshot</strong>
    </p>
    <p v-if="warning" role="alert" class="feed-source">{{ warning }}</p>
    <div class="match-layout">
      <div class="fixture-list">
        <div class="tabs" role="group" aria-label="Filter matches"><button v-for="name in filters" :key="name" :aria-pressed="filter===name" @click="filter=name;selected=null">{{ name }}</button></div>
        <ul v-if="rows.length" class="fixture-rows"><li v-for="m in rows" :key="m.id"><button :aria-pressed="featured?.id===m.id" @click="selected=m.id"><span>{{ m.home??'To be confirmed' }} <small>v</small> {{ m.away??'To be confirmed' }}</span><strong>{{ m.home_score??'—' }} : {{ m.away_score??'—' }}</strong></button></li></ul>
        <p v-else-if="feed" class="match-empty">No {{ filter==='All'?'':filter.toLowerCase() }} fixtures in this matchday.</p>
      </div><aside class="featured-fixture" aria-live="polite"><p class="eyebrow">FIXTURE SPOTLIGHT</p><template v-if="featured"><h3>{{ featured.home??'TBC' }} v {{ featured.away??'TBC' }}</h3><p>{{ featured.competition??'Competition unavailable' }} · {{ featured.status.replaceAll('_',' ') }}</p><p>Kickoff: {{ date(featured.kickoff) }}</p></template><p v-else>No fixture selected.</p><RouterLink v-if="$route.path!=='/matches'" to="/matches" class="text-link">Open match centre ↗</RouterLink></aside>
    </div>
  </section>
</template>
<style scoped>
.feed-source{font-size:.8rem;color:var(--muted);margin:0 0 1rem}.feed-source a{color:var(--cyan);text-decoration:underline}.fixture-rows{list-style:none;padding:0;margin:0}.fixture-rows button{display:flex;width:100%;justify-content:space-between;align-items:center;gap:1rem;padding:1.2rem;text-align:left;border-bottom:1px solid var(--line);transition:background .18s}.fixture-rows button[aria-pressed=true]{background:var(--surface);box-shadow:inset 3px 0 var(--lime)}.fixture-rows strong{color:var(--lime);white-space:nowrap}.fixture-rows small{color:var(--muted)}.tabs button[aria-pressed=true]{color:var(--lime);box-shadow:inset 0 -2px var(--lime)}.featured-fixture h3{margin-top:1rem}
</style>
