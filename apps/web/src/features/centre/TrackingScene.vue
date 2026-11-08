<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { onBeforeUnmount,shallowRef,watch } from 'vue'
const props=defineProps<{point:{x:number;y:number}|null;trail:{x:number;y:number}[];zone:{x:number;y:number}|null}>()
const emit=defineEmits<{failed:[]}>()
const lines:number[]=[]
function line(x:number,z:number,a:number,b:number){lines.push(x,.03,z,a,.03,b)}
function rect(x:number,z:number,w:number,h:number){line(x,z,x+w,z);line(x+w,z,x+w,z+h);line(x+w,z+h,x,z+h);line(x,z+h,x,z)}
rect(-5,-3.2,10,6.4);line(0,-3.2,0,3.2);rect(-5,-1.5,1.4,3);rect(3.6,-1.5,1.4,3)
for(let i=0;i<48;i++){const a=i*Math.PI/24,b=(i+1)*Math.PI/24;line(.85*Math.cos(a),.85*Math.sin(a),.85*Math.cos(b),.85*Math.sin(b))}
const geometry=new BufferGeometry(); geometry.setAttribute('position',new Float32BufferAttribute(lines,3))
const trailGeometry=shallowRef(new BufferGeometry())
watch(()=>props.trail,pts=>{const next=new BufferGeometry(),positions=pts.flatMap(p=>[(p.x-.5)*10,.09,(p.y-.5)*6.4]);next.setAttribute('position',new Float32BufferAttribute(positions,3));trailGeometry.value.dispose();trailGeometry.value=next},{immediate:true})
onBeforeUnmount(()=>trailGeometry.value.dispose())
onBeforeUnmount(()=>geometry.dispose())
</script>
<template><TresCanvas clear-color="#102328" render-mode="on-demand" :dpr="[1,1.5]" :fps-limit="20" @error="emit('failed')"><TresPerspectiveCamera :position="[1,10,8]" :look-at="[0,0,0]" :fov="46" /><TresMesh :position="[0,-.12,0]"><TresBoxGeometry :args="[10.6,.24,6.8]" /><TresMeshBasicMaterial color="#326354" /></TresMesh><TresLineSegments :geometry="geometry"><TresLineBasicMaterial color="#d6fcec" /></TresLineSegments><TresLine v-if="trail.length>1" :geometry="trailGeometry"><TresLineBasicMaterial color="#62e0f0" /></TresLine><TresMesh v-if="zone" :position="[(zone.x-.5)*10,.04,(zone.y-.5)*6.4]" :rotation="[-Math.PI/2,0,0]"><TresRingGeometry :args="[.32,.39,28]" /><TresMeshBasicMaterial color="#ff9786" /></TresMesh><TresMesh v-if="point" :position="[(point.x-.5)*10,.18,(point.y-.5)*6.4]"><TresSphereGeometry :args="[.16,16,12]" /><TresMeshBasicMaterial color="#bcff63" /></TresMesh></TresCanvas></template>
