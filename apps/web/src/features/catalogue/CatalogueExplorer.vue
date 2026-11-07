<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCatalogue, provenance } from './catalogue'
import { isSaved, toggleSaved } from './preferences'
const props = defineProps<{ section: string }>()
const route = useRoute()
const { data, error, loading, retry } = useCatalogue(() => props.section)
const query = ref(''); const selected = ref(''); const question = ref('Overview'); const variant = ref('Balanced'); const result = ref('')
const rows = computed(() => (data.value?.items ?? []).filter(row => (row.name + ' ' + row.detail + ' ' + row.value).toLowerCase().includes(query.value.trim().toLowerCase())))
const active = computed(() => rows.value.find(row => row.id === selected.value) ?? rows.value[0])
watch([data, () => route.query.record], () => { selected.value = typeof route.query.record === 'string' ? route.query.record : ''; query.value = ''; result.value = '' })
watch(active, () => { result.value = ''; question.value = 'Overview' })
const seed = ref(11)
function simulate() {
  // Small reproducible illustration. No predictions about actual teams.
  let n = Math.abs(Math.trunc(Number(seed.value) || 0)) >>> 0
  for (const char of (active.value?.id ?? '') + variant.value) n = (Math.imul(n, 31) + char.charCodeAt(0)) >>> 0
  const draw = () => { n = (Math.imul(1664525, n) + 1013904223) >>> 0; return n / 4294967296 }
  const home = [0,1,2,3,4].filter(() => draw() < (variant.value === 'Press high' ? .44 : .34)).length
  const away = [0,1,2,3,4].filter(() => draw() < (variant.value === 'Press high' ? .42 : .29)).length
  result.value = 'Illustrated score: ' + home + ' – ' + away + '. Seed ' + seed.value + ' · ' + variant.value + '.'
}
const assignment = ref('')
const labels: Record<string,string> = { clubs:'Club directory', players:'Player dossier', competitions:'Competition guide', rankings:'Ranking board', news:'The reading room', transfers:'Transfer desk', fantasy:'Fantasy leaderboard', simulator:'Scenario library', 'ai-analyst':'Evidence desk', 'tactical-lab':'Tactical notebook' }
</script>
<template>
  <section class="catalogue-explorer" :aria-label="labels[section]">
    <div class="catalogue-bar"><div><p class="eyebrow">SCOUTING DESK / CATALOGUE</p><h2>{{ labels[section] }}</h2></div><span v-if="data" class="demo-label">{{ provenance(data.mode) }}</span></div><div v-if="loading" role="status">Loading catalogue…</div><div v-else-if="error" role="alert"><p>{{ error }}</p><button class="ui-button ui-button--secondary" @click="retry">Try again</button></div><template v-else-if="data">
      <label class="search-label" for="catalogue-search">Filter records</label><input id="catalogue-search" v-model="query" type="search" class="search-input" placeholder="Search this collection"><div class="catalogue-layout">
        <div><p class="eyebrow">{{ rows.length }} RECORDS</p><div class="record-list"><button v-for="row in rows" :key="row.id" :aria-pressed="active?.id === row.id" @click="selected = row.id"><strong>{{ row.name }}</strong><span>{{ row.value }}</span></button></div><p v-if="!rows.length">{{ query ? 'No matching records.' : 'The source returned no records.' }}</p><button v-if="query && !rows.length" class="text-link" @click="query = ''">Clear filter</button></div><article v-if="active" class="record-detail">
          <p class="eyebrow">SELECTED RECORD</p><h3>{{ active.name }}</h3><p>{{ active.detail }}</p><strong class="record-value">{{ section === 'players' && data.mode === 'DELAYED' ? active.value + ' goals' : active.value }}</strong>
          <div v-if="section === 'ai-analyst'" class="demo-action"><label>Ask about this record<select v-model="question"><option>Overview</option><option>What evidence is available?</option><option>What is uncertain?</option></select></label><p aria-live="polite">{{ question === 'Overview' ? active.detail : question === 'What evidence is available?' ? 'The selected catalogue entry reports: ' + active.value + '. ' + active.detail : 'This record alone cannot establish positioning, causality or performance beyond its stated coverage.' }}</p><small>Scripted evidence walkthrough · no AI model call</small></div>
          <div v-else-if="section === 'simulator'" class="demo-action"><label>Game plan<select v-model="variant" @change="result = ''"><option>Balanced</option><option>Press high</option></select></label><label>Seed<input v-model.number="seed" type="number" min="0" max="999999" @input="result = ''"></label><button class="ui-button ui-button--primary" @click="simulate">Run illustration</button><p aria-live="polite">{{ result || 'Choose a game plan and seed to illustrate five chances per side.' }}</p><small>Hypothetical browser demo · no measured match or production engine</small></div>
          <div v-else-if="section === 'fantasy'" class="demo-action"><button class="ui-button ui-button--secondary" @click="assignment = active.id">Pick this entry to follow</button><p aria-live="polite">{{ assignment === active.id ? 'Following this leaderboard entry for this visit.' : 'Browse the sample league and choose an entry to follow.' }}</p></div>
          <RouterLink v-else-if="section === 'tactical-lab'" class="text-link" to="/#hero-title">Try the interactive stadium plays ↗</RouterLink>
          <button class="save-record" :aria-pressed="isSaved(section, active.id)" @click="toggleSaved(section, active, data.mode)">{{ isSaved(section, active.id) ? 'Remove from favourites' : 'Save to favourites' }}</button>
        </article>
      </div>
    </template>
  </section>
</template>
