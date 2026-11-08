<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { onBeforeUnmount, ref, watch } from 'vue'
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, SphereGeometry, Vector3, Line, LineBasicMaterial, LineSegments, Mesh, MeshStandardMaterial, RingGeometry, MeshBasicMaterial, DoubleSide } from 'three'
import {arrivalPoint,clamp} from '../motion/motion'
import type { Play } from './plays'
const props = withDefaults(defineProps<{ paused: boolean; skip:number; play?: Play; sequence: number }>(), { play: undefined })
const emit = defineEmits<{ failed: []; arrival:[phase:'tunnel'|'pitch'] }>()
const pitch = new Group()
const resources: { dispose: () => void }[] = []
function box(width: number, height: number, depth: number, x: number, y: number, z: number, color: string, emissive = false) {
  const geometry = new BoxGeometry(width, height, depth)
  const material = new MeshStandardMaterial({ color, roughness: .55, metalness: .25, ...(emissive ? { emissive: color, emissiveIntensity: 3 } : {}) })
  const mesh = new Mesh(geometry, material); mesh.position.set(x, y, z); pitch.add(mesh); resources.push(geometry, material)
}
// Architectural model only: no measured positions or ball tracking.
box(12.6, .6, 8.9, 0, -.55, 0, '#132c32')
box(12.2, .13, 8.5, 0, -.2, 0, '#62e0f0', true)
box(12.3, .27, 8.6, 0, -.1, 0, '#243c41')
box(11.2, .15, 7.5, 0, .08, 0, '#235645')
for (let i = 0; i < 10; i++) box(1.05, .02, 6.8, -4.725 + i * 1.05, .17, 0, i % 2 ? '#295a43' : '#214c3c')
for (let tier = 0; tier < 3; tier++) {
  const y = .28 + tier * .2; const offset = 3.85 + tier * .21
  box(11.6, .18, .2, 0, y, offset, '#3b5357'); box(11.6, .18, .2, 0, y, -offset, '#3b5357')
  box(.2, .18, 7.4, 5.6 + tier * .2, y, 0, '#344b50'); box(.2, .18, 7.4, -5.6 - tier * .2, y, 0, '#344b50')
}
for (const x of [-5.6, 5.6]) for (const z of [-3.5, 3.5]) {
  box(.09, 2.3, .09, x, 1.2, z, '#59757a'); box(.7, .16, .25, x, 2.4, z, '#dcfff1', true)
}
const points: number[] = []
function line(x1: number, z1: number, x2: number, z2: number) { points.push(x1, .2, z1, x2, .2, z2) }
function rectangle(x: number, z: number, width: number, height: number) { line(x,z,x+width,z); line(x+width,z,x+width,z+height); line(x+width,z+height,x,z+height); line(x,z+height,x,z) }
rectangle(-5,-3.15,10,6.3); line(0,-3.15,0,3.15); rectangle(-5,-1.8,1.6,3.6); rectangle(3.4,-1.8,1.6,3.6); rectangle(-5,-.8,.6,1.6); rectangle(4.4,-.8,.6,1.6)
const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(points,3)); const material = new LineBasicMaterial({ color:'#e1ffd0' }); pitch.add(new LineSegments(geometry,material)); resources.push(geometry, material)
const circleGeometry = new RingGeometry(.88,.91,64); const circleMaterial = new MeshBasicMaterial({ color:'#e1ffd0', side:DoubleSide }); const circle = new Mesh(circleGeometry,circleMaterial); circle.rotation.x = -Math.PI/2; circle.position.y = .21; pitch.add(circle); resources.push(circleGeometry, circleMaterial)
// Open goal frames make the geometry read as a miniature stadium.
for (const x of [-5.2, 5.2]) { box(.035,.55,.035,x,.45,-.55,'#d9fbe8'); box(.035,.55,.035,x,.45,.55,'#d9fbe8'); box(.035,.035,1.13,x,.72,0,'#d9fbe8') }
// A full walkable entrance extends behind the west goal.
box(9,.12,2.8,-10.5,.13,0,'#15252c');box(9,.2,2.8,-10.5,2.5,0,'#142229')
for(const side of [-1,1]){
  box(9,2.4,.14,-10.5,1.3,side*1.42,'#213337')
  for(let index=0;index<7;index++){
    const x=-14+index*1.18
    box(.08,2.15,.09,x,1.35,side*1.31,'#52716f')
    box(.68,.045,.03,x,.43,side*1.29,'#62e0f0',true)
    box(.78,.05,.04,x,2.22,side*1.29,'#bcff63',true)
  }
}
for(let n=0;n<8;n++){
  box(15,.23,.32,0,1+n*.26,-4.5-n*.29,'#273b41')
  box(.32,.23,11,6.4+n*.29,1+n*.26,0,'#273b41')
}
box(15,.075,.11,0,3.3,-6.9,'#c4fff4',true)
box(.1,.075,11,8.8,3.3,0,'#c4fff4',true)
const ballGeometry = new SphereGeometry(.14, 12, 8)
const ballMaterial = new MeshBasicMaterial({ color: '#ffffff' })
const ball = new Mesh(ballGeometry, ballMaterial); pitch.add(ball); ball.visible = false
const routeMaterial = new LineBasicMaterial({ color: '#62e0f0' })
const playLine = new Line(new BufferGeometry(), routeMaterial); pitch.add(playLine)
resources.push(ballGeometry, ballMaterial, routeMaterial)
let playTime = 0
function renderPlay(progress: number) {
  const points = props.play?.points
  if (!points?.length) return
  const t = Math.min(progress, 1) * (points.length - 1)
  const i = Math.min(Math.floor(t), points.length - 2)
  const a = points[i]!, b = points[i + 1]!, f = t - i
  ball.position.set(a[0] + (b[0] - a[0]) * f, .42 + Math.sin(Math.PI * f) * .22, a[1] + (b[1] - a[1]) * f)
}
const rotation = ref<[number, number, number]>([0, -.15, 0])
function resetPlay() {
  playTime = 0
  ball.visible = !!props.play
  playLine.geometry.dispose()
  playLine.geometry = new BufferGeometry().setFromPoints((props.play?.points ?? []).map(([x,z]) => new Vector3(x,.29,z)))
  renderPlay(props.paused ? 1 : 0)
  // Invalidate the demand-driven scene even when motion is paused.
  rotation.value = [...rotation.value]
}
watch(() => props.sequence, resetPlay)
const camera=ref<[number,number,number]>([-12.8,.9,0]), aim=ref<[number,number,number]>([2,.55,0]), lamp=ref<[number,number,number]>([-2,5,3])
let frame=0,lastFrame=0,arrival=0,pointerX=0,pointerY=0,scroll=0,readyToDraw=false
function sceneFrame(now:number){
  if(props.paused||document.hidden||!readyToDraw)return
  if(now-lastFrame<32){frame=requestAnimationFrame(sceneFrame);return}
  const dt=Math.min(.08,(now-lastFrame)/1000);lastFrame=now
  arrival=Math.min(1,arrival+dt/2.6);emit('arrival',arrival<1?'tunnel':'pitch');playTime+=dt;renderPlay(playTime/2.5)
  const p=arrivalPoint(arrival)
  camera.value=[p[0]+pointerX*.4*arrival,p[1]+pointerY*.24*arrival+scroll*.4,p[2]+pointerX*.35*arrival]
  aim.value=[1.4-arrival,.4,0];lamp.value=[-2+pointerX*4,5+pointerY,3]
  if(arrival<1||(props.play&&playTime<2.65))frame=requestAnimationFrame(sceneFrame)
}
function updateTimer(){cancelAnimationFrame(frame);lastFrame=performance.now()-34;if(!props.paused&&!document.hidden)frame=requestAnimationFrame(sceneFrame)}
function scrollScene(){scroll=clamp(window.scrollY/650);updateTimer()}
function ready(){resetPlay();readyToDraw=true;try{if(sessionStorage.getItem('pitchpulse:tunnel-v1'))arrival=1;sessionStorage.setItem('pitchpulse:tunnel-v1','1')}catch{arrival=1}
  updateTimer();document.addEventListener('visibilitychange',updateTimer);window.addEventListener('scroll',scrollScene,{passive:true})}
watch(()=>props.skip,()=>{arrival=1;camera.value=arrivalPoint(1);emit('arrival','pitch');updateTimer()});watch(()=>props.paused,updateTimer);watch(()=>props.sequence,updateTimer)
function move(event:PointerEvent){const bounds=(event.currentTarget as HTMLElement).getBoundingClientRect();pointerX=2*(event.clientX-bounds.left)/bounds.width-1;pointerY=1-2*(event.clientY-bounds.top)/bounds.height;updateTimer()}
function leave(){pointerX=0;pointerY=0;updateTimer()}
onBeforeUnmount(() => { cancelAnimationFrame(frame);window.removeEventListener('scroll',scrollScene); document.removeEventListener('visibilitychange', updateTimer); playLine.geometry.dispose(); for (const resource of resources) resource.dispose() })
</script>
<template><div class="stadium-canvas" @pointermove="move" @pointerleave="leave"><TresCanvas clear-color="#0c1b20" :alpha="true" :antialias="true" :dpr="[1, 1.5]" :fps-limit="30" render-mode="on-demand" @ready="ready" @error="emit('failed')"><TresPerspectiveCamera :position="camera" :look-at="aim" :fov="58" /><TresAmbientLight :intensity="2" /><TresDirectionalLight :position="lamp" color="#bcff63" :intensity="3" /><TresDirectionalLight :position="[5, 5, -3]" color="#62e0f0" :intensity="3" /><TresGroup :rotation="rotation"><primitive :object="pitch" /></TresGroup></TresCanvas></div></template>
