<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { serializeOkfFields } from '../lib/okf-yaml.js'
import { groupActors, parseActor, ACTOR_LABELS } from '../lib/okf-actor.js'
import {
  typeLabel, statusView, parseOkfDate, formatOkfDate, todayUtc, timeAgo, staleView, sourceViews,
} from '../lib/okf-view.js'

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

const yamlContent = computed(() => serializeOkfFields(okfFields.value))

// Относительное время («вчера», «осталось N дней») — только в браузере.
// На сервере и при гидрации выводится абсолютная дата, иначе на сгенерированном сайте она застынет.
const today = ref<number | null>(null)
onMounted(() => {
  today.value = todayUtc()
})

type Actor = { id: string, name: string }
const asActor = (value: unknown): Actor | null =>
  value && typeof value === 'object' && typeof (value as Actor).id === 'string' ? value as Actor : null

function actorView(actor: Actor | null) {
  if (!actor) return null
  const id = actor.id.trim()
  return { id, name: actor.name?.trim() || id, ...parseActor(id) }
}

const view = computed(() => {
  const m = okfFields.value as Record<string, any>
  const created = parseOkfDate(m.created)
  const updated = parseOkfDate(m.updated)
  const staleAfter = parseOkfDate(m.stale_after)
  const createdBy = actorView(asActor(m.created_by))
  const updatedBy = actorView(asActor(m.updated_by))
  const sameAsCreated = created !== null && updated === created && createdBy?.id === updatedBy?.id

  return {
    type: typeLabel(m.type),
    status: statusView(m.status),
    created: created !== null || createdBy ? { day: created, by: createdBy } : null,
    updated: !sameAsCreated && (updated !== null || updatedBy) ? { day: updated, by: updatedBy } : null,
    staleAfter,
    sources: sourceViews(m.sources),
    tags: (Array.isArray(m.tags) ? m.tags : []).filter((t: unknown) => typeof t === 'string' && t.trim()),
    groups: groupActors(m.contributors, m.created_by, m.updated_by),
    resource: typeof m.resource === 'string' && m.resource.trim() ? m.resource.trim() : null,
  }
})

const stale = computed(() =>
  view.value.staleAfter !== null && today.value !== null ? staleView(view.value.staleAfter, today.value) : null
)

const STATUS_TEXT: Record<string, string> = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  neutral: 'text-highlighted',
}
const TONE_TEXT: Record<string, string> = {
  muted: 'text-muted',
  warning: 'text-warning',
  error: 'text-error',
}

// < 480px подпись стоит над значением; шире — две колонки «подпись | значение»
const ROW = 'grid grid-cols-1 items-start gap-1 min-[480px]:grid-cols-[10rem_minmax(0,1fr)] min-[480px]:gap-3'
const LABEL = 'flex items-center gap-2 text-muted'
const LABEL_ICON = 'size-4 shrink-0'
const VALUE = 'm-0 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 pl-6 text-highlighted min-[480px]:pl-0'

const yamlOpen = ref(false)
const { copy, copied, isSupported } = useClipboard({ copiedDuring: 1500 })
</script>

<template>
  <section
    v-if="hasOkfFields"
    class="okf-meta not-prose mt-8 border-t border-default pt-4 text-sm"
    aria-label="О странице"
  >
    <h2
      class="mb-3 flex items-center gap-2 text-sm font-semibold text-muted"
    >
      <UIcon
        name="i-lucide-info"
        class="size-4 shrink-0"
      />
      О странице
    </h2>

    <dl class="grid gap-3 min-[480px]:gap-2">
      <div
        v-if="view.type"
        :class="ROW"
      >
        <dt :class="LABEL">
          <UIcon
            name="i-lucide-file-text"
            :class="LABEL_ICON"
          />Тип
        </dt>
        <dd :class="VALUE">
          {{ view.type }}
        </dd>
      </div>

      <div
        v-if="view.status"
        :class="ROW"
      >
        <dt :class="LABEL">
          <UIcon
            name="i-lucide-circle-check-big"
            :class="LABEL_ICON"
          />Статус
        </dt>
        <dd :class="VALUE">
          <span
            class="inline-flex items-center gap-2"
            :class="STATUS_TEXT[view.status.color]"
          >
            <span
              class="size-1.5 shrink-0 rounded-full bg-current"
              aria-hidden="true"
            />
            {{ view.status.label }}
          </span>
        </dd>
      </div>

      <div
        v-if="view.created"
        :class="ROW"
      >
        <dt :class="LABEL">
          <UIcon
            name="i-lucide-calendar-plus"
            :class="LABEL_ICON"
          />Создана
        </dt>
        <dd :class="VALUE">
          <time
            v-if="view.created.day !== null"
            :datetime="new Date(view.created.day).toISOString().slice(0, 10)"
          >{{ formatOkfDate(view.created.day) }}</time>
          <OkfActor
            v-if="view.created.by"
            :actor="view.created.by"
            :title="ACTOR_LABELS[view.created.by.kind].title"
          />
        </dd>
      </div>

      <div
        v-if="view.updated"
        :class="ROW"
      >
        <dt :class="LABEL">
          <UIcon
            name="i-lucide-pencil"
            :class="LABEL_ICON"
          />Изменена
        </dt>
        <dd :class="VALUE">
          <span v-if="view.updated.day !== null">
            <time :datetime="new Date(view.updated.day).toISOString().slice(0, 10)">{{ formatOkfDate(view.updated.day) }}</time>
            <span
              v-if="today !== null"
              class="text-muted"
            > ({{ timeAgo(view.updated.day, today) }})</span>
          </span>
          <OkfActor
            v-if="view.updated.by"
            :actor="view.updated.by"
            :title="ACTOR_LABELS[view.updated.by.kind].title"
          />
        </dd>
      </div>

      <div
        v-if="view.staleAfter !== null"
        :class="ROW"
      >
        <dt :class="LABEL">
          <UIcon
            name="i-lucide-calendar-clock"
            :class="LABEL_ICON"
          />Проверить до
        </dt>
        <dd :class="VALUE">
          <time :datetime="new Date(view.staleAfter).toISOString().slice(0, 10)">{{ formatOkfDate(view.staleAfter) }}</time>
          <span
            v-if="stale"
            :class="TONE_TEXT[stale.tone]"
          >{{ stale.text }}</span>
        </dd>
      </div>

      <div
        v-if="view.sources.length"
        :class="ROW"
      >
        <dt :class="LABEL">
          <UIcon
            name="i-lucide-paperclip"
            :class="LABEL_ICON"
          />Источники
        </dt>
        <dd :class="VALUE">
          <ul class="grid w-full gap-1">
            <li
              v-for="(source, i) in view.sources"
              :key="i"
              class="flex min-w-0 flex-wrap items-center gap-x-2"
            >
              <UIcon
                :name="source.icon"
                class="size-3.5 shrink-0"
                :class="[source.icon.startsWith('i-lucide') ? 'text-muted' : '', source.darkInvert ? 'dark:invert' : '']"
              />
              <a
                v-if="source.href"
                :href="source.href"
                target="_blank"
                rel="noopener noreferrer"
                class="min-w-0 rounded-sm text-highlighted underline decoration-accented underline-offset-4 [overflow-wrap:anywhere] transition-colors hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >{{ source.title }}</a>
              <span
                v-else
                class="min-w-0 [overflow-wrap:anywhere]"
              >{{ source.title }}</span>
              <span
                v-if="source.hint"
                class="text-muted"
              >{{ source.hint }}</span>
            </li>
          </ul>
        </dd>
      </div>

      <div
        v-if="view.tags.length"
        :class="ROW"
      >
        <dt :class="LABEL">
          <UIcon
            name="i-lucide-tag"
            :class="LABEL_ICON"
          />Теги
        </dt>
        <dd :class="[VALUE, 'text-default']">
          <span
            v-for="tag in view.tags"
            :key="tag"
            class="[overflow-wrap:anywhere]"
          ><span
            class="text-muted"
            aria-hidden="true"
          >#</span>{{ tag }}</span>
        </dd>
      </div>

      <div
        v-if="view.groups.length"
        :class="ROW"
      >
        <dt :class="LABEL">
          <UIcon
            name="i-lucide-users"
            :class="LABEL_ICON"
          />Участники
        </dt>
        <dd :class="VALUE">
          <div class="grid w-full gap-1">
            <div
              v-for="group in view.groups"
              :key="group.kind"
              class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1"
            >
              <span class="font-medium text-muted">{{ group.label }}:</span>
              <OkfActor
                v-for="actor in group.actors"
                :key="actor.id"
                :actor="actor"
                :title="ACTOR_LABELS[actor.kind].title"
              />
            </div>
          </div>
        </dd>
      </div>

      <div
        v-if="view.resource"
        :class="ROW"
      >
        <dt :class="LABEL">
          <UIcon
            name="i-lucide-link"
            :class="LABEL_ICON"
          />Адрес
        </dt>
        <dd :class="VALUE">
          <code class="font-mono text-xs [overflow-wrap:anywhere]">{{ view.resource }}</code>
        </dd>
      </div>
    </dl>

    <UCollapsible
      v-model:open="yamlOpen"
      class="mt-3"
    >
      <UButton
        variant="link"
        color="neutral"
        size="sm"
        icon="i-lucide-code"
        :label="yamlOpen ? 'Скрыть YAML' : 'Показать YAML'"
        class="px-0 text-muted hover:text-highlighted"
        :ui="{ leadingIcon: 'size-4' }"
      />

      <template #content>
        <div class="pt-2">
          <pre class="overflow-x-auto rounded-md border border-default bg-muted px-4 py-3 font-mono text-xs/relaxed text-default"><code>{{ yamlContent }}</code></pre>
          <UButton
            v-if="isSupported"
            class="mt-2"
            size="xs"
            color="neutral"
            variant="outline"
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            :label="copied ? 'Скопировано' : 'Копировать'"
            @click="copy(yamlContent)"
          />
        </div>
      </template>
    </UCollapsible>
  </section>
</template>

<style scoped>
/* Светлая тема: оттенки 500 у success/warning дают контраст < 4.5:1 на белом.
   Внутри блока берём 700 из той же шкалы темы; в тёмной теме остаются значения Nuxt UI (400). */
:global(:root:not(.dark)) .okf-meta {
  --ui-success: var(--ui-color-success-700);
  --ui-warning: var(--ui-color-warning-700);
  --ui-error: var(--ui-color-error-700);
}
</style>
