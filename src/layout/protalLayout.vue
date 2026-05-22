<script setup lang="ts">
import protailHeader from '../components/protailHeader.vue'
import protailFooter from '../components/protailFooter.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-base-200">
    <protailHeader />
    <main class="flex flex-1 flex-col min-h-0">
      <router-view />
    </main>
    <protailFooter />
  </div>
</template>

<style scoped></style>
