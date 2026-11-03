<script setup lang="ts">
// Участник в блоке «О странице»: иконка вида (человек / агент / модель / другие) + имя.
defineProps<{
  actor: {
    id: string
    name: string
    kind: string
    icon: string
    darkInvert: boolean
    vendorIcon: string | null
    vendorDarkInvert: boolean
  }
  title: string
}>()
</script>

<template>
  <span
    class="inline-flex min-w-0 items-center gap-1.5"
    :title="`${title} · ${actor.id}`"
  >
    <span
      class="inline-flex shrink-0 items-center"
      aria-hidden="true"
    >
      <UIcon
        :name="actor.icon"
        class="size-3.5"
        :class="[actor.kind === 'model' ? '' : 'text-muted', actor.darkInvert ? 'dark:invert' : '']"
      />
      <UIcon
        v-if="actor.vendorIcon"
        :name="actor.vendorIcon"
        class="-ml-0.5 size-2.5 self-end"
        :class="actor.vendorDarkInvert ? 'dark:invert' : ''"
      />
    </span>
    <span
      class="min-w-0 [overflow-wrap:anywhere]"
    >{{ actor.name }}</span>
    <span class="sr-only">({{ title }})</span>
  </span>
</template>
