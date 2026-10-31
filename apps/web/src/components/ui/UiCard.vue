<script setup lang="ts">defineProps<{ title: string; eyebrow?: string }>()</script>
<template><section class="ui-card"><p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p><h2>{{ title }}</h2><slot /></section></template>
