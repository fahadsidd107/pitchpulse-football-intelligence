<script setup lang="ts">
import { computed } from 'vue'
import { provenance, useCatalogue } from './catalogue'
const props = defineProps<{ query: string }>()
defineEmits<{ close: [] }>()
const feeds = ['clubs', 'players', 'competitions'].map(section => ({ section, ...useCatalogue(section) }))
const matches = computed(() => {
  const term = props.query.trim().toLowerCase()
  return feeds.flatMap(feed => (feed.data.value?.items ?? [])
    .filter(row => !term || (row.name + ' ' + row.detail).toLowerCase().includes(term))
    .slice(0, term ? 6 : 1)
    .map(row => ({ section: feed.section, row, mode: feed.data.value!.mode })))
})
</script>
<template><div class="catalogue-search"><p class="eyebrow">CATALOGUE RECORDS</p><ul v-if="matches.length" class="search-results"><li v-for="match in matches" :key="match.section + match.row.id"><RouterLink :to="{path:'/' + match.section,query:{record:match.row.id}}" @click="$emit('close')">{{ match.row.name }} <small>{{ provenance(match.mode) }}</small></RouterLink></li></ul><p v-else-if="feeds.some(feed => feed.loading.value)" role="status">Checking the catalogue…</p><p v-else-if="feeds.some(feed => feed.error.value)">Some catalogue sources could not be searched.</p><p v-else>No catalogue records match this search.</p></div></template>
