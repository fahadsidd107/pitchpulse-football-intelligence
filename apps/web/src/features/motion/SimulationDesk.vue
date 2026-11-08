<script setup lang="ts">
import {computed,onBeforeUnmount,ref,watch} from 'vue'
import TrackingPitch from '../centre/TrackingPitch.vue'
import {simulateChances,type Chance} from './simulation'
import {useMotionAllowed} from './motion'
const props=defineProps<{scenario:string}>(),seed=ref(11),plan=ref('Balanced'),minute=ref(0),started=ref(false),events=ref<Chance[]>([])
const motion=useMotionAllowed();let timer:ReturnType<typeof setInterval>
function finish(){clearInterval(timer);minute.value=90}
function reset(){clearInterval(timer);started.value=false;minute.value=0;events.value=[]}
watch([()=>props.scenario,seed,plan],reset)
watch(motion,allowed=>{if(!allowed&&started.value)finish()})
function run(){clearInterval(timer);events.value=simulateChances(props.scenario,seed.value,plan.value);started.value=true;minute.value=0;if(!motion.value){finish();return}timer=setInterval(()=>{minute.value=Math.min(minute.value+1,90);if(minute.value===90)clearInterval(timer)},55)}
const seen=computed(()=>events.value.filter(e=>e.minute<=minute.value))
const score=computed(()=>['Home','Away'].map(side=>seen.value.filter(e=>e.side===side&&e.goal).length).join(' – '))
const ball=computed(()=>{const prev=seen.value.at(-1),next=events.value[seen.value.length];const x=prev?.x??50,y=prev?.y??32,t=next?(minute.value-(prev?.minute??0))/(next.minute-(prev?.minute??0)):0;return {x:x+((next?.x??x)-x)*t,y:y+((next?.y??y)-y)*t}})
onBeforeUnmount(()=>clearInterval(timer))
</script>
<template><div class="motion-desk simulation"><p class="eyebrow">DREAM MATCH / GENERATED ILLUSTRATION</p><h3>Write the match.</h3><div class="centre-controls"><label>Game plan<select v-model="plan"><option>Balanced</option><option>Press high</option></select></label><label>Seed<input v-model.number="seed" type="number" min="0" max="999999"></label><button class="ui-button ui-button--primary" @click="run">Run illustration</button><button v-if="started&&minute<90" @click="finish">Skip to final whistle</button></div><div v-if="started" class="sim-stage"><p class="eyebrow" role="status" data-testid="simulation-phase">{{ minute===90?'FINAL WHISTLE':minute<3?'KICKOFF':'MATCH IN PLAY' }}</p><strong>{{ score }}</strong> <span>{{ minute }}′</span><TrackingPitch :point="{x:ball.x/100,y:ball.y/64}" :trail="[]" :zone="null" caption="Generated path between this scenario’s chances · not tracking data" /><ol class="event-ledger"><li v-for="c in seen" :key="c.minute">{{ c.minute }}′ · {{ c.side }} · {{ c.goal?'Goal':'Chance missed' }}</li></ol></div><p>Five generated chances per side. The seed and plan reproduce the event ledger, score and illustrative path. No actual match is predicted.</p></div></template>
