<script setup lang="ts">
import SiteFooter from './components/SiteFooter.vue'
</script>

<template>
  <div class="app-shell">
    <main class="app-main">
      <router-view />
    </main>
    <SiteFooter />
  </div>
</template>
