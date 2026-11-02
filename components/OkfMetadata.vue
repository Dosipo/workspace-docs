<script setup lang="ts">
const props = defineProps<{
  page: Record<string, any>
}>()

// In Nuxt Content v3, non-standard frontmatter fields are moved into page.meta.
// Standard Docus fields (title, description, navigation, links, seo) stay at root level.
const okfFields = computed(() => {
  const meta = props.page?.meta
  if (!meta || typeof meta !== 'object') return {}
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(meta)) {
    if (value !== undefined && value !== null) {
      result[key] = value
    }
  }
  return result
})

const hasOkfFields = computed(() => Object.keys(okfFields.value).length > 0)

function serializeValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(v => String(v)).join(', ')}]`
  }
  if (typeof value === 'string') {
    // Quote strings that need it: colons, brackets, or ISO timestamps
    if (/[:{}\[\]#]/.test(value) || value === '') {
      return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
    }
    return value
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value)
  }
  return JSON.stringify(value)
}

const yamlContent = computed(() =>
  Object.entries(okfFields.value)
    .map(([key, value]) => `${key}: ${serializeValue(value)}`)
    .join('\n')
)
</script>

<template>
  <div
    v-if="hasOkfFields"
    class="okf-metadata not-prose"
  >
    <div class="okf-metadata__header">
      <UBadge
        label="OKF"
        color="neutral"
        variant="subtle"
        size="xs"
        class="okf-metadata__badge"
      />
      <span class="okf-metadata__title">Метаданные страницы</span>
    </div>
    <pre class="okf-metadata__code"><code>{{ yamlContent }}</code></pre>
  </div>
</template>

<style scoped>
.okf-metadata {
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--ui-border);
}

.okf-metadata__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.okf-metadata__title {
  font-size: 0.75rem;
  color: var(--ui-text-muted);
  font-weight: 500;
  letter-spacing: 0.01em;
}

.okf-metadata__code {
  background: var(--ui-bg-muted);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  padding: 0.875rem 1rem;
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--ui-text);
  overflow-x: auto;
  white-space: pre;
  margin: 0;
}
</style>
