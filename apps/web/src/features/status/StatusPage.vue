<script setup lang="ts">
import { onMounted } from 'vue'
import { useSystemStore } from '../../state/system'
const status = useSystemStore()
onMounted(() => { void status.refresh() })
</script>
<template>
  <main id="main" class="mx-auto max-w-5xl px-6 py-12">
    <p class="eyebrow">01 / FOUNDATION</p>
    <h1 class="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">A clear view.<br><span class="text-lime-200">From the ground up.</span></h1>
    <p class="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">The foundation for football intelligence. Verify the connection between this app, the API and its database.</p>
    <section aria-labelledby="connection-heading" class="panel mt-12 p-6 sm:p-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h2 id="connection-heading" class="text-xl font-semibold">System connection</h2>
        <button :disabled="status.loading" class="check-button" @click="status.refresh">{{ status.loading ? 'Checking…' : 'Check again' }}</button>
      </div>
      <div class="mt-8" aria-live="polite" :aria-busy="status.loading">
        <p v-if="status.loading" class="text-slate-300">Checking API and database availability…</p>
        <div v-else-if="status.error" role="alert">
          <p class="text-xl text-orange-200">Connection needs attention</p>
          <p class="mt-2 text-slate-300">{{ status.error }}</p>
        </div>
        <div v-else-if="status.system">
          <p class="text-2xl text-lime-200">Connected and ready</p>
          <dl class="mt-6 grid gap-6 sm:grid-cols-3">
            <div><dt>API</dt><dd>{{ status.system.name }} {{ status.system.version }}</dd></div>
            <div><dt>Database</dt><dd>PostgreSQL connected</dd></div>
            <div><dt>Last checked</dt><dd>{{ status.checkedAt }}</dd></div>
          </dl>
        </div>
        <p v-else>No connection check has completed.</p>
      </div>
    </section>
    <section class="mt-8 border-l-2 border-slate-600 pl-5">
      <h2 class="font-semibold">Football data comes next</h2>
      <p class="mt-2 max-w-2xl leading-relaxed text-slate-400">No fixtures or live scores are available yet. Future demo matches will use clearly labeled fictional data. This check confirms the development foundation only.</p>
    </section>
  </main>
</template>
