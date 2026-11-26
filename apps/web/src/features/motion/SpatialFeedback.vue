<script setup lang="ts">
import {onBeforeUnmount,onMounted,ref,watch} from 'vue'
import {useRoute} from 'vue-router'
const route=useRoute()
const pulses=ref<{id:number;x:number;y:number}[]>([])
let count=0,frame=0,active:HTMLElement|null=null,surface:HTMLElement|null=null,media:MediaQueryList|undefined,fine:MediaQueryList|undefined,surfaceRect:DOMRect|undefined
const timers=new Set<ReturnType<typeof setTimeout>>()
function eligible(target:EventTarget|null){return target instanceof Element?target.closest<HTMLElement>('a[href],button:not(:disabled),summary'):null}
function resetElement(element:HTMLElement|null){if(!element)return;for(const key of ['--hover-x','--hover-y','--tilt-x','--tilt-y'])element.style.removeProperty(key);delete element.dataset.spatialActive}
function clear(){resetElement(active);resetElement(surface);active=null;surface=null;surfaceRect=undefined}
function reset(){clear();cancelAnimationFrame(frame);document.documentElement.style.removeProperty('--scene-x');document.documentElement.style.removeProperty('--scene-y')}
function outside(event:PointerEvent){if(!event.relatedTarget)reset()}
function hidden(){if(document.hidden)reset()}
function pointer(event:PointerEvent){
 if(media?.matches||!fine?.matches||event.pointerType!=='mouse'){reset();return}
 const target=eligible(event.target)
 const nextSurface=event.target instanceof Element?event.target.closest<HTMLElement>('.intelligence-card,.catalogue-rail,.record-detail'):null
 if(nextSurface!==surface){resetElement(surface);surface=nextSurface;surfaceRect=surface?.getBoundingClientRect()}
 if(target!==active){resetElement(active);active=target}
 cancelAnimationFrame(frame)
 frame=requestAnimationFrame(()=>{
  const x=event.clientX/window.innerWidth,y=event.clientY/window.innerHeight
  document.documentElement.style.setProperty('--scene-x',`${(x-.5)*24}px`)
  document.documentElement.style.setProperty('--scene-y',`${(y-.5)*18}px`)
  for(const element of new Set([active,surface]))if(element){const box=element===surface&&surfaceRect?surfaceRect:element.getBoundingClientRect();const x=Math.max(0,Math.min(1,(event.clientX-box.left)/box.width)),y=Math.max(0,Math.min(1,(event.clientY-box.top)/box.height));element.style.setProperty('--hover-x',`${x*100}%`);element.style.setProperty('--hover-y',`${y*100}%`);element.dataset.spatialActive='true';if(element.matches('.intelligence-card')){element.style.setProperty('--tilt-x',`${(0.5-y)*7}deg`);element.style.setProperty('--tilt-y',`${(x-0.5)*7}deg`)}}
 })
}
function click(event:MouseEvent){const target=eligible(event.target);if(!target||media?.matches)return
 const box=target.getBoundingClientRect(),id=++count
 pulses.value=[...pulses.value.slice(-4),{id,x:event.detail?event.clientX:box.left+box.width/2,y:event.detail?event.clientY:box.top+box.height/2}]
 const timer=setTimeout(()=>{pulses.value=pulses.value.filter(p=>p.id!==id);timers.delete(timer)},650);timers.add(timer)
}
function preference(){reset();pulses.value=[]}
watch(()=>route.path,reset)
onMounted(()=>{media=matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener('change',preference);fine=matchMedia('(hover: hover) and (pointer: fine)');fine.addEventListener('change',preference);window.addEventListener('blur',reset);window.addEventListener('scroll',reset,{passive:true});document.addEventListener('visibilitychange',hidden);document.addEventListener('pointerout',outside);document.addEventListener('pointermove',pointer,{passive:true});document.addEventListener('click',click)})
onBeforeUnmount(()=>{document.removeEventListener('pointermove',pointer);document.removeEventListener('click',click);media?.removeEventListener('change',preference);fine?.removeEventListener('change',preference);window.removeEventListener('blur',reset);window.removeEventListener('scroll',reset);document.removeEventListener('visibilitychange',hidden);document.removeEventListener('pointerout',outside);cancelAnimationFrame(frame);timers.forEach(clearTimeout);clear();document.documentElement.style.removeProperty('--scene-x');document.documentElement.style.removeProperty('--scene-y')})
</script>
<template><div class="football-atmosphere" aria-hidden="true"><div class="atmosphere-pitch"></div><div class="atmosphere-orbit orbit-one"></div><div class="atmosphere-orbit orbit-two"></div><div class="atmosphere-light"></div></div><Teleport to="body"><div class="interaction-pulses" aria-hidden="true"><span v-for="pulse in pulses" :key="pulse.id" class="interaction-pulse" :style="{left:pulse.x+'px',top:pulse.y+'px'}"><i></i></span></div></Teleport></template>
