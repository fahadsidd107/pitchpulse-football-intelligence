<script setup lang="ts">withDefaults(defineProps<{ src: string; alt: string; width: number; height: number; srcset?: string; sizes?: string; loading?: 'lazy' | 'eager' }>(), { loading: 'lazy', sizes: '100vw' })</script>
<template><img :src="src" :alt="alt" :width="width" :height="height" :srcset="srcset" :sizes="sizes" :loading="loading" decoding="async" class="responsive-image"></template>
