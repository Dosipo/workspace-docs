<template>
  <div class="section-hero" :class="`accent-${accent}`" aria-hidden="true">
    <svg class="section-hero__bg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" preserveAspectRatio="xMaxYMid meet">
      <circle cx="258" cy="-5" r="68" fill="var(--hero-accent-color, #7c3aed)" fill-opacity="0.14"/>
      <circle cx="208" cy="62" r="52" fill="var(--hero-accent-color, #7c3aed)" fill-opacity="0.09"/>
      <circle cx="292" cy="72" r="34" fill="var(--hero-accent-color, #7c3aed)" fill-opacity="0.12"/>
      <rect x="148" y="6" width="52" height="52" rx="10" transform="rotate(28 174 32)" fill="var(--hero-accent-color, #7c3aed)" fill-opacity="0.06"/>
      <polygon points="158,80 196,12 234,80" fill="var(--hero-accent-color, #7c3aed)" fill-opacity="0.05"/>
      <circle cx="170" cy="12" r="20" fill="var(--hero-accent-color, #7c3aed)" fill-opacity="0.09"/>
    </svg>
    <span class="section-hero__icon" aria-hidden="true">{{ icon }}</span>
    <div class="section-hero__body">
      <p class="section-hero__title">{{ title }}</p>
      <p v-if="description" class="section-hero__desc">{{ description }}</p>
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
  icon: '📄',
  accent: 'neutral',
})
</script>

<style scoped>
.section-hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.75rem 2rem;
  margin-bottom: 2rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--muted);
  overflow: hidden;
}

.section-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.07;
  border-radius: inherit;
  background: var(--hero-accent-color, transparent);
}

.section-hero__bg {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: auto;
  pointer-events: none;
}

.section-hero__icon {
  position: relative;
  font-size: 2.75rem;
  line-height: 1;
  flex-shrink: 0;
}

.section-hero__body {
  position: relative;
}

.section-hero__title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--foreground);
  margin: 0 0 0.2rem;
  line-height: 1.3;
}

.section-hero__desc {
  font-size: 0.9rem;
  color: var(--muted-foreground);
  margin: 0;
  line-height: 1.5;
}

/* Accent color tokens */
.accent-violet { --hero-accent-color: #7c3aed; }
.accent-blue   { --hero-accent-color: #2563eb; }
.accent-emerald{ --hero-accent-color: #059669; }
.accent-orange { --hero-accent-color: #ea580c; }
.accent-yellow { --hero-accent-color: #ca8a04; }
.accent-indigo { --hero-accent-color: #4f46e5; }
.accent-green  { --hero-accent-color: #16a34a; }
.accent-red    { --hero-accent-color: #dc2626; }
.accent-pink   { --hero-accent-color: #db2777; }
.accent-slate  { --hero-accent-color: #475569; }
</style>
