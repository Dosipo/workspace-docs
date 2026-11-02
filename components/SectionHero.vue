<template>
  <div class="section-banner" role="banner">
    <Icon v-if="icon" :name="icon" class="section-banner__icon" aria-hidden="true" />
    <div class="section-banner__body">
      <p class="section-banner__title">{{ title }}</p>
      <p v-if="description" class="section-banner__desc">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
  title: string
  description?: string
  accent?: string
}>(), {
  icon: 'heroicons:document',
  accent: 'neutral',
})
</script>

<style scoped>
.section-banner {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 2rem 0 1.5rem;
  margin-bottom: 1.75rem;
  border-bottom: 1px solid var(--border);
}

.section-banner__icon {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  color: var(--muted-foreground);
}

.section-banner__body {
  min-width: 0;
}

.section-banner__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--foreground);
  margin: 0 0 0.375rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.section-banner__desc {
  font-size: 0.9375rem;
  color: var(--muted-foreground);
  margin: 0;
  line-height: 1.6;
}
</style>
