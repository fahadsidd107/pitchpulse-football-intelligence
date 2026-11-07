<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { onBeforeUnmount, ref, watch } from 'vue'
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, SphereGeometry, Vector3, Line, LineBasicMaterial, LineSegments, Mesh, MeshStandardMaterial, RingGeometry, MeshBasicMaterial, DoubleSide } from 'three'
import type { Play } from './plays'
const props = withDefaults(defineProps<{ paused: boolean; play?: Play; sequence: number }>(), { play: undefined })
const emit = defineEmits<{ failed: [] }>()
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
const ballGeometry = new SphereGeometry(.14, 12, 8)
const ballMaterial = new MeshBasicMaterial({ color: '#ffffff' })
const ball = new Mesh(ballGeometry, ballMaterial); pitch.add(ball); ball.visible = false
const routeMaterial = new LineBasicMaterial({ color: '#62e0f0' })
const playLine = new Line(new BufferGeometry(), routeMaterial); pitch.add(playLine)
resources.push(ballGeometry, ballMaterial, routeMaterial)
let playTime = 0; let lastTick = 0
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
  playTime = 0; lastTick = performance.now()
  ball.visible = !!props.play
  playLine.geometry.dispose()
  playLine.geometry = new BufferGeometry().setFromPoints((props.play?.points ?? []).map(([x,z]) => new Vector3(x,.29,z)))
  renderPlay(props.paused ? 1 : 0)
  // Invalidate the demand-driven scene even when motion is paused.
  rotation.value = [...rotation.value]
}
watch(() => props.sequence, resetPlay)
let timer: ReturnType<typeof setInterval> | undefined; let target = 0; let start = 0
function updateTimer() { lastTick = performance.now(); clearInterval(timer); if (props.paused || document.hidden) return; timer = setInterval(() => { const now = performance.now(); const t = (now - start) / 1000; playTime += (now - lastTick) / 1000; lastTick = now; renderPlay(playTime / 2.5); rotation.value = [Math.sin(t * .2) * .012, -.15 + Math.sin(t * .16) * .055 + target + (props.play ? Math.sin(Math.PI * Math.min(playTime / 2.5, 1)) * .12 : 0), 0] }, 1000 / 30) }
function ready() { resetPlay(); start = performance.now(); updateTimer(); document.addEventListener('visibilitychange', updateTimer) }
watch(() => props.paused, updateTimer)
function move(event: PointerEvent) { const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect(); target = ((event.clientX - bounds.left) / bounds.width - .5) * .14 }
onBeforeUnmount(() => { clearInterval(timer); document.removeEventListener('visibilitychange', updateTimer); playLine.geometry.dispose(); for (const resource of resources) resource.dispose() })
</script>
<template><div class="stadium-canvas" @pointermove="move" @pointerleave="target = 0"><TresCanvas clear-color="#0c1b20" :alpha="true" :antialias="true" :dpr="[1, 1.5]" :fps-limit="30" render-mode="on-demand" @ready="ready" @error="emit('failed')"><TresPerspectiveCamera :position="[11, 10, 12]" :look-at="[0, 0, 0]" :fov="42" /><TresAmbientLight :intensity="2" /><TresDirectionalLight :position="[-3, 8, 4]" color="#bcff63" :intensity="3" /><TresDirectionalLight :position="[5, 5, -3]" color="#62e0f0" :intensity="3" /><TresGroup :rotation="rotation"><primitive :object="pitch" /></TresGroup></TresCanvas></div></template>
