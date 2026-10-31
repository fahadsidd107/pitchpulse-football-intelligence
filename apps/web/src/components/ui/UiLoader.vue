<script setup lang="ts">withDefaults(defineProps<{ label?: string }>(), { label: 'Loading…' })</script>
<template><p role="status" class="loader"><span aria-hidden="true"></span>{{ label }}</p></template>
