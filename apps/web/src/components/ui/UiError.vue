<script setup lang="ts">import UiButton from './UiButton.vue'; defineProps<{ message: string }>(); defineEmits<{ retry: [] }>()</script>
<template><div role="alert" class="error-state"><h3>Something needs attention</h3><p>{{ message }}</p><UiButton variant="secondary" @click="$emit('retry')">Try again</UiButton></div></template>
