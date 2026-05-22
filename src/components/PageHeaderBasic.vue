<script setup lang="ts">
import type { StyleValue } from 'vue'

defineProps<{
  title: string
  description?: string
  bgImage?: string
  bgStyle?: StyleValue
}>()
</script>

<template>
  <div
    class="page-header-basic"
    :style="[
      bgStyle,
      bgImage ? { backgroundImage: `url(${bgImage})` } : undefined,
    ]"
  >
    <div class="page-header-basic__content">
      <h1 class="page-header-basic__title">{{ title }}</h1>
      <p v-if="description" class="page-header-basic__description">{{ description }}</p>
    </div>
  </div>
</template>
