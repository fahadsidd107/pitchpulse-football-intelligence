<script setup
  lang="ts">  import { computed } from 'vue'; import { useRoute } from 'vue-router'; import { sections } from '../../app/sections'; const route = useRoute(); const section = computed(() => sections.find(item => item.path === route.path))</script>
<template>
  <main id="main" class="page section-page" tabindex="-1">
    <p class="eyebrow">EXPLORE / {{ section?.label }}</p>
    <h1>{{ section?.label }}<span class="accent">.</span></h1>
    <p class="page-intro">{{ section?.description }}</p>
    <section class="empty-feature"><span class="demo-label">DEMO · NOT CONNECTED</span>
      <h2>A clear view starts with trusted data.</h2>
      <p>This section is part of the PitchPulse shell. There are no football records to display yet.</p>
      <RouterLink to="/" class="text-link">Back to your overview <span aria-hidden="true">↗</span></RouterLink>
      <RouterLink to="/system" class="subtle-link">Check system connection</RouterLink>
    </section>
  </main>
</template>
