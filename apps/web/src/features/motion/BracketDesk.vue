<script setup lang="ts">
import {computed,onBeforeUnmount,ref,watch} from 'vue'
import {football} from '../centre/football'
const props=defineProps<{competition:string}>()
interface Club{id:string;name:string}
const clubs=ref<Club[]>([]),winners=ref<string[]>(['','']),champion=ref(''),error=ref(''),busy=ref(true);let controller:AbortController|undefined
async function load(){controller?.abort();const active=new AbortController();controller=active;busy.value=true;error.value='';clubs.value=[];winners.value=['',''];champion.value=''
try{const result=await football<Club[]>('competitions/'+encodeURIComponent(props.competition)+'/clubs',active.signal);if(active===controller)clubs.value=result.data.slice(0,4)}catch{if(active===controller)error.value='No club list is available for this competition.'}finally{if(active===controller)busy.value=false}}
watch(()=>props.competition,load,{immediate:true});onBeforeUnmount(()=>{controller?.abort();controller=undefined})
const pairs=computed(()=>[clubs.value.slice(0,2),clubs.value.slice(2,4)])
</script>
<template><section class="bracket"><p class="eyebrow">HYPOTHETICAL / BRACKET SCRATCHPAD</p><p>Pick winners from four returned club records. This is your bracket, not the official draw.</p><p v-if="busy">Loading clubs…</p><p v-else-if="error">{{ error }}</p><template v-else-if="clubs.length===4"><div class="bracket-round"><fieldset v-for="(pair,i) in pairs" :key="i"><legend>Semifinal {{ i+1 }}</legend><button v-for="team in pair" :key="team.id" :aria-pressed="winners[i]===team.name" @click="winners[i]=team.name;champion=''">{{ team.name }}</button></fieldset></div><fieldset v-if="winners.every(Boolean)"><legend>Final</legend><button v-for="team in winners" :key="team" :aria-pressed="champion===team" @click="champion=team">{{ team }}</button></fieldset><p v-if="champion" role="status">Your champion: {{ champion }}</p></template><p v-else>Four clubs are required to fill this bracket.</p></section></template>
