<script setup lang="ts">defineProps<{ title: string; summary: string }>()</script>
<template><figure class="chart"><figcaption><strong>{{ title }}</strong><p>{{ summary }}</p></figcaption><div aria-hidden="true"><slot /></div></figure></template>
