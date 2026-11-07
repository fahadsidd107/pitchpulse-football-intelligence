<script setup lang="ts">
import { ref } from 'vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiTooltip from '../../components/ui/UiTooltip.vue'
import UiChart from '../../components/ui/UiChart.vue'
import UiTable from '../../components/ui/UiTable.vue'
import UiLoader from '../../components/ui/UiLoader.vue'
import UiError from '../../components/ui/UiError.vue'
import MatchScore from '../../components/ui/MatchScore.vue'
const compact = ref(false)
const open = ref(false); const retried = ref(false)
const tokens = ['background', 'surface', 'lime', 'cyan', 'coral', 'ice']
</script>
<template><main id="main" tabindex="-1" class="page design-page"><p class="eyebrow">THE VISUAL LANGUAGE</p><h1>Stadium Noir<span class="accent">.</span></h1><p class="page-intro">Reusable foundations for a clearer view of football.</p><div class="token-grid"><div v-for="token in tokens" :key="token"><span :style="{ background: `var(--${token})` }"></span>{{ token }}</div></div><div class="design-grid"><UiCard title="Actions & information" eyebrow="INTERACTION"><div class="button-row"><UiButton @click="open = true">Open example dialog</UiButton><UiButton variant="secondary" :aria-pressed="compact" @click="compact = !compact">{{ compact ? 'Show full table' : 'Show compact table' }}</UiButton><UiButton disabled>Unavailable</UiButton><UiTooltip label="About demo data" text="These component examples use invented clubs and figures." /></div></UiCard><UiCard title="Match score" eyebrow="DATA HONESTY"><MatchScore home="Beacon Athletic" away="Cinder Vale" :home-score="2" :away-score="1" /><p>Fictional final score · component example.</p></UiCard><UiCard title="Loading & recovery"><UiLoader label="Loading example…" /><UiError v-if="!retried" message="Example unavailable state. Retry demonstrates recovery." @retry="retried = true" /><p v-else role="status">Example recovered.</p></UiCard><UiCard title="Accessible data"><UiChart title="Performance overview" summary="Illustrative possession: Beacon Athletic 58%, Cinder Vale 42%."><div class="sample-bars"><span style="width:58%">58%</span><span style="width:42%">42%</span></div></UiChart><UiTable caption="Fictional standings example" :columns="['Club', 'Played', 'Points']" :rows="[['Beacon Athletic', 3, 7], ['Cinder Vale', 3, 5], ['Ferry Rovers', 3, 4]].slice(0, compact ? 1 : 3)" /></UiCard></div><UiModal :open="open" title="A focused conversation" @close="open = false"><p>This dialog keeps keyboard focus inside. Press Escape or use the close button to return to your previous position.</p><UiButton @click="open = false">Done</UiButton></UiModal></main></template>
