<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { onBeforeUnmount, ref, watch } from 'vue'
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, SphereGeometry, Vector3, Line, LineBasicMaterial, LineSegments, Mesh, MeshStandardMaterial, RingGeometry, MeshBasicMaterial, DoubleSide, IcosahedronGeometry, EdgesGeometry } from 'three'
import {clamp} from '../motion/motion'
import type { Play } from './plays'
const props = withDefaults(defineProps<{ paused: boolean; skip:number; play?: Play; sequence: number; hovered:boolean }>(), { play: undefined })
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
// One procedural truncated icosahedron: twelve pentagons and twenty hexagons.
// Separated face plates expose dark seams, retaining a recognisable football silhouette.
const orb = new Group()
const raw = new IcosahedronGeometry(1, 0), attribute = raw.getAttribute('position')
const vertices: Vector3[] = [], faces: number[][] = []
for (let offset=0; offset<attribute.count; offset+=3) {
  const face:number[]=[]
  for(let n=0;n<3;n++) {
    const v=new Vector3().fromBufferAttribute(attribute,offset+n).normalize()
    let index=vertices.findIndex(other=>other.distanceTo(v)<.001)
    if(index<0){index=vertices.length;vertices.push(v)}face.push(index)
  }faces.push(face)
}
raw.dispose()
const dark = new MeshStandardMaterial({color:'#13292c',roughness:.35,metalness:.5})
const ivory = new MeshStandardMaterial({color:'#f5fff5',roughness:.3,metalness:.12})
const seam = new MeshStandardMaterial({color:'#1a3d3d',roughness:.5,metalness:.7})
const coreGeometry=new SphereGeometry(1.7,32,24);orb.add(new Mesh(coreGeometry,seam));resources.push(coreGeometry,dark,ivory,seam)
const cut=(a:number,b:number)=>vertices[a]!.clone().multiplyScalar(2).add(vertices[b]!).normalize().multiplyScalar(2)
function plate(points:Vector3[],black=false) {
  const centre=points.reduce((sum,p)=>sum.add(p),new Vector3()).divideScalar(points.length)
  const inset=points.map(p=>p.clone().sub(centre).multiplyScalar(.965).add(centre))
  const data:number[]=[]
  for(let n=0;n<inset.length;n++)data.push(...centre.toArray(),...inset[n]!.toArray(),...inset[(n+1)%inset.length]!.toArray())
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(data,3));geometry.computeVertexNormals()
  // Triangle winding comes from the source hull; double-sided material keeps caps robust.
  const mesh=new Mesh(geometry,black?dark:ivory);orb.add(mesh);resources.push(geometry)
}
dark.side=DoubleSide;ivory.side=DoubleSide
vertices.forEach((v,i)=>{
  const neighbors=[...new Set(faces.filter(f=>f.includes(i)).flat().filter(n=>n!==i))]
  const axis=vertices[neighbors[0]!]!.clone().sub(v.clone().multiplyScalar(vertices[neighbors[0]!]!.dot(v))).normalize()
  const second=new Vector3().crossVectors(v,axis)
  neighbors.sort((a,b)=>Math.atan2(vertices[a]!.dot(second),vertices[a]!.dot(axis))-Math.atan2(vertices[b]!.dot(second),vertices[b]!.dot(axis)))
  plate(neighbors.map(n=>cut(i,n)),true)
})
for(const [a,b,c] of faces as [number,number,number][])plate([cut(a,b),cut(b,a),cut(b,c),cut(c,b),cut(c,a),cut(a,c)])
orb.scale.setScalar(.085)
// An architectural outline carries the scene down into the page environment.
const outlineBox=new BoxGeometry(12.7,.55,9);const outlineGeometry=new EdgesGeometry(outlineBox);outlineBox.dispose();const outlineMaterial=new LineBasicMaterial({color:'#62e0f0',transparent:true,opacity:.5});pitch.add(new LineSegments(outlineGeometry,outlineMaterial));resources.push(outlineGeometry,outlineMaterial)
const rotation = ref<[number, number, number]>([0, -.15, 0])
const ballRotation = ref<[number, number, number]>([.2, .25, -.2])
const ballPosition = ref<[number, number, number]>([0,.36,0])
function resetPlay() {
  playTime = 0;ball.visible = !!props.play
  playLine.geometry.dispose()
  playLine.geometry = new BufferGeometry().setFromPoints((props.play?.points ?? []).map(([x,z]) => new Vector3(x,.29,z)))
  renderPlay(props.paused ? 1 : 0);rotation.value = [...rotation.value]
}
watch(() => props.sequence, resetPlay)
const keyIntensity=ref(2)
const camera=ref<[number,number,number]>([8.8,7.8,13]), aim=ref<[number,number,number]>([0,.6,0]), lamp=ref<[number,number,number]>([-2,8,5])
let frame=0,lastFrame=0,pointerX=0,pointerY=0,scroll=0,readyToDraw=false,elapsed=0,hoverMix=0
function sceneFrame(now:number){
  if(props.paused||document.hidden||!readyToDraw)return
  if(now-lastFrame<32){frame=requestAnimationFrame(sceneFrame);return}
  const dt=Math.min(.08,(now-lastFrame)/1000);lastFrame=now;elapsed+=dt
  playTime+=dt;renderPlay(playTime/2.5);hoverMix+=(Number(props.hovered)-hoverMix)*Math.min(1,dt*5);orb.scale.setScalar(.085+hoverMix*.006);keyIntensity.value=2+hoverMix*.8
  camera.value=[8.8+pointerX*.85,7.8+pointerY*.65+scroll*.45,13+pointerX*.4]
  aim.value=[pointerX*.18,.6,0];lamp.value=[-2+pointerX*4,8+pointerY,5]
  ballRotation.value=[.2+Math.sin(elapsed*.22)*.13+pointerY*.17,elapsed*.16+hoverMix*.35+pointerX*.35,-.2+Math.cos(elapsed*.2)*.1]
  ballPosition.value=[0,.36,0]
  frame=requestAnimationFrame(sceneFrame)
}
function updateTimer(){cancelAnimationFrame(frame);lastFrame=performance.now()-34;if(!props.paused&&!document.hidden)frame=requestAnimationFrame(sceneFrame)}
function scrollScene(){scroll=clamp(window.scrollY/650);updateTimer()}
function ready(){resetPlay();readyToDraw=true;emit('arrival','pitch');updateTimer();document.addEventListener('visibilitychange',updateTimer);window.addEventListener('scroll',scrollScene,{passive:true})}
watch(()=>props.skip,()=>emit('arrival','pitch'));watch(()=>props.paused,updateTimer);watch(()=>props.sequence,updateTimer)
function move(event:PointerEvent){if(event.pointerType!=='mouse'||!matchMedia('(hover: hover) and (pointer: fine)').matches)return;const bounds=(event.currentTarget as HTMLElement).getBoundingClientRect();pointerX=2*(event.clientX-bounds.left)/bounds.width-1;pointerY=1-2*(event.clientY-bounds.top)/bounds.height;updateTimer()}
function leave(){pointerX=0;pointerY=0;updateTimer()}
onBeforeUnmount(() => { cancelAnimationFrame(frame);window.removeEventListener('scroll',scrollScene); document.removeEventListener('visibilitychange', updateTimer); playLine.geometry.dispose(); for (const resource of resources) resource.dispose() })
</script>
<template><div class="stadium-canvas" @pointermove="move" @pointerleave="leave"><TresCanvas clear-color="#0c1b20" :alpha="true" :antialias="true" :dpr="[1, 1.5]" :fps-limit="30" render-mode="on-demand" @ready="ready" @error="emit('failed')"><TresPerspectiveCamera :position="camera" :look-at="aim" :fov="43" /><TresAmbientLight :intensity=".8" /><TresDirectionalLight :position="lamp" color="#f5fff5" :intensity="keyIntensity" /><TresDirectionalLight :position="[5, 5, -3]" color="#62e0f0" :intensity="2.5" /><TresPointLight :position="[-4,4,2]" color="#bcff63" :intensity="22" /><TresGroup :rotation="rotation"><primitive :object="pitch" /></TresGroup><TresGroup :position="ballPosition"><primitive :object="orb" :rotation="ballRotation" /></TresGroup></TresCanvas></div></template>
