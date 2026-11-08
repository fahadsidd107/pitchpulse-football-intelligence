<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BracketDesk from '../motion/BracketDesk.vue'
import SimulationDesk from '../motion/SimulationDesk.vue'
import { useRoute } from 'vue-router'
import { useCatalogue, provenance } from './catalogue'
import { isSaved, toggleSaved } from './preferences'
const props = defineProps<{ section: string }>()
const route = useRoute()
const { data, error, loading, retry } = useCatalogue(() => props.section)
const query = ref(''); const selected = ref(''); const question = ref('Overview'); const result = ref('')
const rows = computed(() => (data.value?.items ?? []).filter(row => (row.name + ' ' + row.detail + ' ' + row.value).toLowerCase().includes(query.value.trim().toLowerCase())))
const visibleCount=ref(50)
watch(query,()=>{visibleCount.value=50})
const active = computed(() => rows.value.find(row => row.id === selected.value) ?? rows.value[0])
watch([data, () => route.query.record], () => { selected.value = typeof route.query.record === 'string' ? route.query.record : ''; query.value = ''; result.value = '' })
watch(active, () => { result.value = ''; question.value = 'Overview' })
const assignment = ref('')
const labels: Record<string,string> = { clubs:'Club directory', players:'Player dossier', competitions:'Competition guide', rankings:'Ranking board', news:'The reading room', transfers:'Transfer desk', fantasy:'Fantasy leaderboard', simulator:'Scenario library', 'ai-analyst':'Evidence desk', 'tactical-lab':'Tactical notebook' }
</script>
<template>
  <section class="catalogue-explorer" :aria-label="labels[section]">
    <div class="catalogue-bar"><div><p class="eyebrow">SCOUTING DESK / CATALOGUE</p><h2>{{ labels[section] }}</h2></div><span v-if="data" class="demo-label">{{ provenance(data.mode) }}</span></div><div v-if="loading" role="status">Loading catalogue…</div><div v-else-if="error" role="alert"><p>{{ error }}</p><button class="ui-button ui-button--secondary" @click="retry">Try again</button></div><template v-else-if="data">
      <label class="search-label" for="catalogue-search">Filter records</label><input id="catalogue-search" v-model="query" type="search" class="search-input" placeholder="Search this collection"><div class="catalogue-layout">
        <div><p class="eyebrow">{{ rows.length }} RECORDS</p><div class="record-list"><button v-for="row in rows.slice(0,visibleCount)" :key="row.id" :aria-pressed="active?.id === row.id" @click="selected = row.id"><strong>{{ row.name }}</strong><span>{{ row.value }}</span></button></div><button v-if="rows.length>visibleCount" class="text-link" @click="visibleCount+=50">Show 50 more</button><p v-if="!rows.length">{{ query ? 'No matching records.' : 'The source returned no records.' }}</p><button v-if="query && !rows.length" class="text-link" @click="query = ''">Clear filter</button></div><article v-if="active" class="record-detail">
          <p class="eyebrow">SELECTED RECORD</p><h3>{{ active.name }}</h3><p>{{ active.detail }}</p><strong class="record-value">{{ section === 'players' && data.mode === 'DELAYED' ? active.value + ' goals' : active.value }}</strong>
          <div v-if="section === 'ai-analyst'" class="demo-action"><label>Ask about this record<select v-model="question"><option>Overview</option><option>What evidence is available?</option><option>What is uncertain?</option></select></label><p aria-live="polite">{{ question === 'Overview' ? active.detail : question === 'What evidence is available?' ? 'The selected catalogue entry reports: ' + active.value + '. ' + active.detail : 'This record alone cannot establish positioning, causality or performance beyond its stated coverage.' }}</p><small>Scripted evidence walkthrough · no AI model call</small></div>
          <SimulationDesk v-else-if="section === 'simulator'" :scenario="active.id" />
          <div v-else-if="section === 'fantasy'" class="demo-action"><button class="ui-button ui-button--secondary" @click="assignment = active.id">Pick this entry to follow</button><p aria-live="polite">{{ assignment === active.id ? 'Following this leaderboard entry for this visit.' : 'Browse the sample league and choose an entry to follow.' }}</p></div>
          <RouterLink v-else-if="section === 'tactical-lab'" class="text-link" to="/#hero-title">Try the interactive stadium plays ↗</RouterLink>
          <BracketDesk v-if="section==='competitions'" :competition="active.id" /><button class="save-record" :aria-pressed="isSaved(section, active.id)" @click="toggleSaved(section, active, data.mode)">{{ isSaved(section, active.id) ? 'Remove from favourites' : 'Save to favourites' }}</button>
        </article>
      </div>
    </template>
  </section>
</template>
