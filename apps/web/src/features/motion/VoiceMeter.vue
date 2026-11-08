<script setup lang="ts">
import {onBeforeUnmount,onMounted,ref,watch} from 'vue'
import {useMotionAllowed} from './motion'
const allowed=useMotionAllowed(),bars=ref<number[]>(Array(24).fill(2)),status=ref('Idle'),message=ref(''),level=ref(0)
let stream:MediaStream|undefined,ctx:AudioContext|undefined,frame=0,session=0
function stop(){session++;cancelAnimationFrame(frame);stream?.getTracks().forEach(t=>t.stop());stream=undefined;if(ctx)void ctx.close().catch(()=>{});ctx=undefined;status.value='Idle';bars.value=Array(24).fill(2);level.value=0}
async function start(){stop();const token=session;status.value='Requesting';message.value=''
try{const capture=await navigator.mediaDevices.getUserMedia({audio:true});if(token!==session){capture.getTracks().forEach(t=>t.stop());return}stream=capture;ctx=new AudioContext();const analyser=ctx.createAnalyser();analyser.fftSize=256;ctx.createMediaStreamSource(capture).connect(analyser);await ctx.resume();if(token!==session)return;const samples=new Uint8Array(analyser.frequencyBinCount);status.value='Listening';let previous=0
function draw(t:number){if(token!==session)return;if(t-previous>(allowed.value?70:500)){previous=t;analyser.getByteFrequencyData(samples);const values=Array.from({length:24},(_,i)=>samples[i*4]??0);bars.value=allowed.value?values.map(v=>2+v/7):Array(24).fill(3);level.value=Math.round(values.reduce((a,b)=>a+b,0)/values.length/255*100)}frame=requestAnimationFrame(draw)}frame=requestAnimationFrame(draw)
}catch{if(token===session){stop();message.value='Microphone unavailable or permission denied. Evidence lookup remains available.'}}}
function hidden(){if(document.hidden)stop()}
onMounted(()=>document.addEventListener('visibilitychange',hidden));onBeforeUnmount(()=>{stop();document.removeEventListener('visibilitychange',hidden)})
watch(allowed,()=>{if(document.hidden)stop()})
</script>
<template><section class="voice-panel"><p class="eyebrow">FIELD AUDIO / LOCAL INPUT</p><div class="wave" :class="{'wave-idle':status==='Idle' && allowed}" aria-hidden="true"><i v-for="(v,i) in bars" :key="i" :style="{height:v+'px'}"></i></div><p>{{ status }}<span v-if="status==='Listening'"> · Signal {{ level }}%</span></p><button class="ui-button ui-button--secondary" @click="status==='Idle'?start():stop()">{{ status==='Idle'?'Start microphone':'Stop microphone' }}</button><p role="status">{{ message || 'Audio stays on this device. This visualizer does not record or transcribe speech.' }}</p></section></template>
