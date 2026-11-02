<script setup lang="ts">
// AREA-147: единый левый сайдбар вместо верхнего хедера.
// Используется на десктопе (layouts/*.vue) и в мобильном меню (AppHeader.vue).
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const appConfig = useAppConfig()
const { isEnabled: isAssistantEnabled, toggle: toggleAssistant } = useAssistant()

// Папки верхнего уровня — подписи групп, их дети — дерево навигации
const groups = computed(() => (navigation?.value || []).filter(item => item.children?.length))
const pages = computed(() => (navigation?.value || []).filter(item => !item.children?.length))

const links = computed(() => appConfig.github?.url
  ? [{ label: 'GitHub', icon: 'i-lucide-github', to: appConfig.github.url }]
  : [])

const assistantIcon = computed(() => appConfig.assistant?.icons?.trigger || 'i-custom-ai')
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex shrink-0 flex-col gap-4 px-4 pt-5 pb-4">
      <AppHeaderLeft class="self-start" />

      <UContentSearchButton
        :collapsed="false"
        label="Поиск"
        color="neutral"
        variant="outline"
        class="w-full"
        :ui="{ leadingIcon: 'size-4', label: 'text-muted' }"
      />

      <div class="flex flex-col">
        <UButton
          v-if="isAssistantEnabled"
          label="Спросить ИИ"
          :icon="assistantIcon"
          color="neutral"
          variant="ghost"
          class="-mx-2.5 text-muted hover:text-highlighted"
          :ui="{ leadingIcon: 'size-4' }"
          @click="toggleAssistant"
        >
          <template #trailing>
            <span class="ms-auto hidden items-center gap-0.5 lg:flex">
              <UKbd value="meta" variant="subtle" />
              <UKbd value="i" variant="subtle" />
            </span>
          </template>
        </UButton>

        <UButton
          v-for="link in links"
          :key="link.to"
          v-bind="link"
          target="_blank"
          trailing-icon="i-lucide-arrow-up-right"
          color="neutral"
          variant="ghost"
          class="-mx-2.5 text-muted hover:text-highlighted"
          :ui="{ leadingIcon: 'size-4', trailingIcon: 'size-3.5 text-dimmed' }"
        />
      </div>
    </div>

    <nav
      aria-label="Разделы базы знаний"
      class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6"
    >
      <UContentNavigation
        v-if="pages.length"
        :navigation="pages"
        variant="pill"
        color="neutral"
        :highlight="false"
        as="div"
        class="mb-6"
      />

      <section
        v-for="group in groups"
        :key="group.path"
        class="mb-6 last:mb-0"
      >
        <p class="mb-2 text-xs/5 font-semibold text-muted">
          {{ group.title }}
        </p>
        <UContentNavigation
          :navigation="group.children"
          variant="pill"
          color="neutral"
          :highlight="false"
          :default-open="true"
          as="div"
        />
      </section>
    </nav>

    <div class="flex shrink-0 items-center justify-end border-t border-default px-4 py-3">
      <UColorModeSelect
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Тема оформления"
        :content="{ side: 'top', align: 'end' }"
        :ui="{ content: 'min-w-36' }"
      />
    </div>
  </div>
</template>
