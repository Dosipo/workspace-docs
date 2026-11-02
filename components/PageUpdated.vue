<script setup lang="ts">
// Строка «Обновлено: … · автор». Данные передаются пропсами, а не текстом в markdown,
// поэтому строка не попадает в поисковый индекс Nuxt Content и сниппеты Ctrl+K.
const props = defineProps<{
  date: string
  author?: string
}>()
</script>

<template>
  <p class="not-prose my-4 text-sm text-muted">
    Обновлено: {{ props.date }}<template v-if="props.author">
      · {{ props.author }}
    </template>
  </p>
</template>
