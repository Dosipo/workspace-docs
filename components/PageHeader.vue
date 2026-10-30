<template>
  <div :class="['page-header', accent ? `page-header--${accent}` : '']" role="banner">
    <div v-if="icon" class="page-header__icon" aria-hidden="true">
      {{ icon }}
    </div>
    <div class="page-header__content">
      <p class="page-header__title" role="heading" aria-level="1">{{ title }}</p>
      <p v-if="description" class="page-header__description">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
  accent?: string
}>()
</script>
