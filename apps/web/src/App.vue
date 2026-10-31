<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
    <RouterLink to="/" class="brand">PitchPulse<span aria-hidden="true">.</span></RouterLink>
    <span class="badge">DEVELOPMENT · MOCK MODE</span>
  </header>
  <RouterView />
  <footer class="mx-auto max-w-5xl px-6 py-8 text-sm text-slate-400">The Game, Decoded. · Local development environment</footer>
</template>
