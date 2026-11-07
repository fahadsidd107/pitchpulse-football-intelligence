<script setup lang="ts">
import MatchdayBoard from '../matchday/MatchdayBoard.vue'
import PitchHero from './PitchHero.vue'
import CatalogueRail from '../catalogue/CatalogueRail.vue'
const intelligence = [
 { number: '01', title: 'Ask a better football question.', label: 'AI ANALYST', text: 'Match evidence. Clear explanations. A new perspective on the moments that matter.', path: '/ai-analyst', cta: 'Explore the analyst' },
 { number: '02', title: 'See the shape of the game.', label: 'TACTICAL LAB', text: 'Formations, patterns and tactical analyses — with evidence behind every insight.', path: '/tactical-lab', cta: 'Enter the tactical lab' },
 { number: '03', title: 'Different eras. Same pitch.', label: 'DREAM SIMULATOR', text: 'Your dream eleven, a hypothetical opponent. Try a seeded illustration and compare game plans.', path: '/simulator', cta: 'Explore the simulator' },
]
</script>
<template>
  <main id="main" class="page home-page" tabindex="-1">
    <div class="edition-line"><span><span class="status-dot"></span> YOUR FOOTBALL INTELLIGENCE HUB</span><span>DEMO EDITION / 01</span></div>
    <section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><p class="eyebrow">BEYOND THE SCORELINE</p><h1 id="hero-title">The game.<br><em>Decoded.</em></h1><p>Every match has a story.<br>Find the perspective that changes yours.</p><RouterLink class="ui-button ui-button--primary" to="/matches">Explore match centre <span aria-hidden="true">↗</span></RouterLink><span class="hero-footnote">A clearer view of the beautiful game.</span></div><PitchHero /><div class="hero-caption"><span>THE PITCH / A NEW PERSPECTIVE</span><span>SCHEMATIC · NOT TRACKING DATA</span></div></section>
    <div class="data-notice"><span class="demo-label">DEMO</span><p>Try a tactical play in the stadium or select a fixture below. Matchday lists its data source separately.</p><RouterLink to="/system">System status ↗</RouterLink></div>
    <MatchdayBoard />
    <section aria-labelledby="intelligence-heading" class="intelligence-section"><div class="section-heading"><div><p class="eyebrow">02 / A DEEPER UNDERSTANDING</p><h2 id="intelligence-heading">Football, with perspective.</h2></div><span class="demo-label">DEMO EXPERIENCES</span></div><div class="intelligence-grid"><article v-for="item in intelligence" :key="item.path" class="intelligence-card"><span class="feature-number" aria-hidden="true">{{ item.number }}</span><p class="eyebrow">{{ item.label }}</p><h3>{{ item.title }}</h3><p>{{ item.text }}</p><RouterLink :to="item.path" class="text-link">{{ item.cta }} ↗</RouterLink><small>Interactive demo</small></article></div></section>
    <section class="around-section" aria-labelledby="around-heading"><div class="section-heading"><div><p class="eyebrow">03 / AROUND THE GAME</p><h2 id="around-heading">Keep your finger on the pulse.</h2></div></div><div class="around-grid"><CatalogueRail section="competitions" title="Competition watch" /><CatalogueRail section="players" title="Scorers &amp; player spotlight" /><CatalogueRail section="rankings" title="Player rankings" /><CatalogueRail section="clubs" title="Club watch" /><CatalogueRail section="fantasy" title="Fantasy leaderboard" /></div></section>
    <section class="editorial-section" aria-labelledby="editorial-heading"><div class="section-heading"><div><p class="eyebrow">04 / THE CONVERSATION</p><h2 id="editorial-heading">Beyond the ninety.</h2></div></div><div class="editorial-links"><CatalogueRail section="news" title="News &amp; the archive" :limit="2" /><CatalogueRail section="transfers" title="Transfer desk" :limit="2" /><CatalogueRail section="tactical-lab" title="Tactical notebook" :limit="2" /></div></section>
  </main>
</template>
