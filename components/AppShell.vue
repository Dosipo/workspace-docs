<script setup lang="ts">
// AREA-147: раскладка без верхнего хедера — сайдбар на всю высоту экрана со своим скроллом.
</script>

<template>
  <div class="lg:flex">
    <aside class="sticky top-0 hidden h-dvh w-72 shrink-0 border-e border-default lg:block">
      <AppSidebar />
    </aside>

    <UMain class="min-w-0 flex-1">
      <slot />
    </UMain>
  </div>
</template>
