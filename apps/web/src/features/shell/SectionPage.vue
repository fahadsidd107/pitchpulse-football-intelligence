<script setup
  lang="ts"
>  import CatalogueExplorer from '../catalogue/CatalogueExplorer.vue'; import MatchdayBoard from '../matchday/MatchdayBoard.vue'; import { computed } from 'vue'; import { useRoute } from 'vue-router'; import { sections } from '../../app/sections'; const route = useRoute(); const section = computed(() => sections.find(item => item.path === route.path))</script>
<template>
  <main id="main" class="page section-page" tabindex="-1">
    <p class="eyebrow">EXPLORE / {{ section?.label }}</p>
    <h1>{{ section?.label }}<span class="accent">.</span></h1>
    <p class="page-intro">{{ section?.description }}</p>
    <MatchdayBoard v-if="route.path === '/matches'" /><CatalogueExplorer v-else :section="route.path.slice(1)" />
  </main>
</template>
