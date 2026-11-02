<script setup lang="ts">
// AREA-145: override of Docus DocsAsideRight (docus@5.15.0, layer/app/components/docs/DocsAsideRight.vue).
// Only change vs. upstream: an icon in the #leading slot before the "На этой странице" title.
// Typography and spacing live in app.config.ts → ui.contentToc.slots.
// Same loose type as pages/[[lang]]/[...slug].vue passes in.

const props = defineProps<{
  page?: Record<string, any> | null
}>()

const links = computed(() => props.page?.body?.toc?.links || [])

const { subNavigationMode } = useSubNavigation()
const appConfig = useAppConfig()
const { t } = useDocusI18n()

const contentTocVariants = useUIConfig('contentToc')
</script>

<template>
  <div>
    <UContentToc
      v-if="links.length"
      :highlight="contentTocVariants.highlight ?? true"
      :highlight-color="contentTocVariants.highlightColor"
      :highlight-variant="contentTocVariants.highlightVariant ?? 'circuit'"
      :color="contentTocVariants.color"
      :title="appConfig.toc?.title || t('docs.toc')"
      :links="links"
      :class="{ 'hidden lg:block': subNavigationMode }"
    >
      <template #leading>
        <UIcon
          name="i-lucide-list"
          class="size-4 shrink-0 text-muted"
          aria-hidden="true"
        />
      </template>

      <template #bottom>
        <DocsAsideRightBottom />
      </template>
    </UContentToc>

    <LazyDocsAsideMobileBar
      v-if="subNavigationMode"
      :links="links"
    />
  </div>
</template>
