<script setup
  lang="ts"
>  import EvidenceStudio from '../motion/EvidenceStudio.vue'; import VoiceMeter from '../motion/VoiceMeter.vue'; import FormationBoard from '../motion/FormationBoard.vue'; import FantasyTable from '../motion/FantasyTable.vue'; import ScoutComparison from '../motion/ScoutComparison.vue'; import MatchCenter from '../centre/MatchCenter.vue'; import CatalogueExplorer from '../catalogue/CatalogueExplorer.vue'; import { computed } from 'vue'; import { useRoute } from 'vue-router'; import { sections } from '../../app/sections'; const route = useRoute(); const section = computed(() => sections.find(item => item.path === route.path))</script>
<template>
  <main id="main" class="page section-page" :data-section="route.path.slice(1)" tabindex="-1">
    <p class="eyebrow">EXPLORE / {{ section?.label }}</p>
    <h1>{{ section?.label }}<span class="accent">.</span></h1>
    <p class="page-intro">{{ section?.description }}</p>
    <VoiceMeter v-if="route.path==='/ai-analyst'" /><EvidenceStudio v-if="route.path==='/ai-analyst'" /><FormationBoard v-if="route.path==='/tactical-lab'" /><ScoutComparison v-if="route.path==='/players'||route.path==='/rankings'" /><FantasyTable v-if="route.path==='/fantasy'" />
    <template v-if="route.path === '/matches'"><MatchCenter /></template><CatalogueExplorer v-else :section="route.path.slice(1)" />
  </main>
</template>
