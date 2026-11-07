<script setup lang="ts">
import { computed } from 'vue'
import UiTable from '../../components/ui/UiTable.vue'
import { saved } from './preferences'
import { useCatalogue, provenance } from './catalogue'
const props = defineProps<{ section: string; title: string; link?: string; limit?: number }>()
const { data, error, loading, retry } = useCatalogue(() => props.section)
const isPointsTable = computed(() => props.section === 'clubs' && data.value?.mode === 'MOCK' && !!data.value.items.length && data.value.items.every(row => /^\d+ pts$/.test(row.value)))
const pointsTable = computed(() => [...(data.value?.items ?? [])].sort((a,b) => parseInt(b.value) - parseInt(a.value)).slice(0,5).map(row => [row.name, parseInt(row.value)]))
const follows = computed(() => saved.value.filter(row => row.section === 'clubs'))
</script>
<template><article class="catalogue-rail"><div class="mini-heading"><h3>{{ title }}</h3><RouterLink :to="link ?? '/' + section">Explore ↗</RouterLink></div><p v-if="loading" role="status">Loading {{ title.toLowerCase() }}…</p><div v-else-if="error" class="rail-error"><p>{{ error }}</p><button class="text-link" @click="retry">Try again</button></div><template v-else-if="data"><span class="demo-label">{{ provenance(data.mode) }}</span><UiTable v-if="isPointsTable" caption="Fictional club standings" :columns="['Club', 'Points']" :rows="pointsTable" /><ul v-else class="rail-items"><li v-for="row in data.items.slice(0, limit ?? 3)" :key="row.id"><RouterLink :to="{path: link ?? '/' + section, query: {record: row.id}}"><strong>{{ row.name }}</strong><span>{{ row.detail }}</span><small v-if="row.value">{{ section === 'players' && data.mode === 'DELAYED' ? row.value + ' goals' : row.value }}</small></RouterLink></li></ul><p v-if="section === 'clubs'" class="followed-summary">{{ follows.length ? 'Your followed clubs: ' + follows.map(item => item.record.name).join(', ') : 'Save a club from its directory to follow it here.' }}</p><p v-if="!data.items.length">The source returned no records for this selection.</p></template></article></template>
