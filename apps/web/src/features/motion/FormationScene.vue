<script setup lang="ts">
import {TresCanvas} from '@tresjs/core'
defineProps<{markers:{x:number;y:number}[];camera:number}>();defineEmits<{failed:[]}>()
</script>
<template><TresCanvas clear-color="#102328" render-mode="on-demand" :dpr="[1,1.25]" @error="$emit('failed')"><TresPerspectiveCamera :position="[camera,9,7]" :look-at="[0,0,0]" :fov="55" /><TresMesh><TresBoxGeometry :args="[10.2,.15,6.6]" /><TresMeshBasicMaterial color="#326354" /></TresMesh><TresMesh v-for="(p,i) in markers" :key="i" :position="[(p.x-50)/10,.22,(p.y-32)/10]"><TresCylinderGeometry :args="[.19,.24,.3,12]" /><TresMeshBasicMaterial color="#bcff63" /></TresMesh></TresCanvas></template>
