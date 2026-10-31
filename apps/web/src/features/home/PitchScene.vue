<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { onBeforeUnmount } from 'vue'
import { BufferGeometry, Float32BufferAttribute, Group, LineBasicMaterial, LineSegments, Mesh, MeshStandardMaterial, PlaneGeometry, RingGeometry, MeshBasicMaterial, DoubleSide } from 'three'
const emit = defineEmits<{ failed: [] }>()
const pitch = new Group()
const surface = new Mesh(new PlaneGeometry(10.5, 6.8), new MeshStandardMaterial({ color: '#193e35', roughness: .95, side: DoubleSide })); surface.rotation.x = -Math.PI / 2; pitch.add(surface)
const points: number[] = []
function line(x1: number, z1: number, x2: number, z2: number) { points.push(x1, .015, z1, x2, .015, z2) }
function rectangle(x: number, z: number, width: number, height: number) { line(x,z,x+width,z); line(x+width,z,x+width,z+height); line(x+width,z+height,x,z+height); line(x,z+height,x,z) }
rectangle(-5,-3.15,10,6.3); line(0,-3.15,0,3.15); rectangle(-5,-1.8,1.6,3.6); rectangle(3.4,-1.8,1.6,3.6); rectangle(-5,-.8,.6,1.6); rectangle(4.4,-.8,.6,1.6)
const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(points,3)); const material = new LineBasicMaterial({ color:'#bcff63', transparent:true, opacity:.65 }); pitch.add(new LineSegments(geometry,material))
const circleGeometry = new RingGeometry(.88,.9,64); const circleMaterial = new MeshBasicMaterial({ color:'#bcff63', side:DoubleSide, transparent:true, opacity:.65 }); const circle = new Mesh(circleGeometry,circleMaterial); circle.rotation.x = -Math.PI/2; circle.position.y = .02; pitch.add(circle)
onBeforeUnmount(() => { geometry.dispose(); material.dispose(); surface.geometry.dispose(); surface.material.dispose(); circleGeometry.dispose(); circleMaterial.dispose() })
</script>
<template><TresCanvas clear-color="#0c1b20" :alpha="true" :antialias="true" :dpr="[1, 1.5]" render-mode="on-demand" @error="emit('failed')"><TresPerspectiveCamera :position="[10, 11, 12]" :look-at="[0, 0, 0]" :fov="38" /><TresAmbientLight :intensity="1.5" /><TresDirectionalLight :position="[-3, 8, 4]" color="#bcff63" :intensity="2" /><TresDirectionalLight :position="[5, 5, -3]" color="#62e0f0" :intensity="1" /><primitive :object="pitch" /></TresCanvas></template>
