<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { searchSections, sections } from './app/sections'
import UiModal from './components/ui/UiModal.vue'
import UiNav from './components/ui/UiNav.vue'
import CatalogueSearch from './features/catalogue/CatalogueSearch.vue'
import UtilityDesk from './features/catalogue/UtilityDesk.vue'
import { guestName } from './features/catalogue/preferences'
const route = useRoute(); const menuOpen = ref(false); const dialog = ref(''); const query = ref('')
const results = computed(() => searchSections(query.value))
function searchShortcut(event: KeyboardEvent) { const target = event.target as HTMLElement; if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) && !target.isContentEditable && !dialog.value) { event.preventDefault(); dialog.value = 'Search' } }
onMounted(() => window.addEventListener('keydown', searchShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', searchShortcut))
const mobileItems = [sections[0]!, sections[1]!, sections[6]!, sections[9]!]
watch(() => route.path, async () => { menuOpen.value = false; dialog.value = ''; document.title = `${sections.find(item => item.path === route.path)?.label ?? 'PitchPulse'} · PitchPulse`; await nextTick(); document.querySelector<HTMLElement>('#main')?.focus() })
</script>
<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="header-top page-width">
      <RouterLink to="/" class="brand" aria-label="PitchPulse home"><span class="brand-mark" aria-hidden="true">P</span>PitchPulse<span class="accent">.</span></RouterLink>
      <span class="brand-tagline">THE GAME, DECODED.</span>
      <div class="header-actions">
        <button class="search-button" aria-label="Search" @click="dialog = 'Search'">⌕ <span>Search PitchPulse</span><kbd>/</kbd></button>
        <button class="icon-button" aria-label="Favourites" @click="dialog = 'Favourites'">☆</button>
        <button class="icon-button" aria-label="Alerts" @click="dialog = 'Alerts'">♧</button>
        <button class="account-button" aria-label="Account" @click="dialog = 'Account'">{{ guestName }} <span aria-hidden="true">↗</span></button>
        <button class="icon-button menu-button" :aria-expanded="menuOpen" aria-controls="primary-navigation" aria-label="Open menu" @click="menuOpen = !menuOpen">☰</button>
      </div>
    </div>
    <div id="primary-navigation" class="nav-container" :class="{ 'is-open': menuOpen }"><UiNav class="primary-nav page-width" :items="sections" label="Main navigation" /><div class="mobile-utilities"><button v-for="utility in ['Favourites', 'Alerts', 'Account']" :key="utility" @click="dialog = utility">{{ utility }}</button></div></div>
  </header>
  <RouterView v-slot="{ Component }"><Transition name="page" mode="out-in"><component :is="Component" :key="route.path" /></Transition></RouterView>
  <footer class="site-footer page-width"><div><RouterLink to="/" class="brand">PitchPulse<span class="accent">.</span></RouterLink><p>Football. In perspective.</p></div><p class="footer-note">PITCHPULSE · Matchday sources are labeled.<br>Stadium plays are tactical demonstrations.</p><div class="footer-links"><RouterLink to="/system">System status</RouterLink><RouterLink to="/design-system">Design system</RouterLink></div></footer>
  <UiNav class="mobile-nav" :items="mobileItems" label="Mobile navigation" />
  <UiModal :open="!!dialog" :title="dialog === 'Search' ? 'Search PitchPulse' : dialog" @close="dialog = ''">
    <template v-if="dialog === 'Search'"><label class="search-label" for="global-search">Find a section or football record</label><input id="global-search" v-model="query" class="search-input" placeholder="Try matches or players" type="search"><p class="muted">Search site sections and the available club, player and competition records.</p><ul class="search-results"><li v-for="item in results" :key="item.path"><RouterLink :to="item.path" @click="dialog = ''">{{ item.label }} <span aria-hidden="true">↗</span></RouterLink></li></ul><p v-if="!results.length">No sections match “{{ query }}”.</p><CatalogueSearch :query="query" @close="dialog = ''" /></template>
    <UtilityDesk v-else-if="['Favourites', 'Alerts', 'Account'].includes(dialog)" :key="dialog" :section="dialog.toLowerCase()" @close="dialog = ''" />
  </UiModal>
</template>
