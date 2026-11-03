<script setup lang="ts">
// AREA-147: override of Docus AppHeader. Desktop has no header (everything is in AppSidebar);
// on mobile it is a compact bar: logo, search, assistant and a burger with the sidebar in a slideover.
const route = useRoute()
const { isEnabled: isAssistantEnabled } = useAssistant()

const open = ref(false)
watch(() => route.fullPath, () => {
  open.value = false
})
</script>

<template>
  <header class="sticky top-0 z-50 h-(--ui-header-height) border-b border-default bg-default/75 backdrop-blur-sm lg:hidden">
    <div class="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
      <AppHeaderLeft class="min-w-0" />

      <div class="flex items-center gap-1">
        <UContentSearchButton
          label="Поиск"
          :ui="{ leadingIcon: 'size-5' }"
        />

        <LazyAssistantChat v-if="isAssistantEnabled" />

        <USlideover
          v-model:open="open"
          side="left"
          title="Навигация"
          :ui="{ content: 'max-w-80' }"
        >
          <UButton
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            aria-label="Открыть меню"
            class="-me-1.5"
          />

          <template #content>
            <AppSidebar />
          </template>
        </USlideover>
      </div>
    </div>
  </header>
</template>
