<script setup
  lang="ts">  defineProps<{ items: { path: string; label: string }[]; label: string }>(); defineEmits<{ navigate: [] }>()</script>
<template>
  <nav :aria-label="label">
    <RouterLink v-for="item in items" :key="item.path" :to="item.path" :class="{ active: $route.path === item.path }"
      @click="$emit('navigate')">{{ item.label }}</RouterLink>
  </nav>
</template>
