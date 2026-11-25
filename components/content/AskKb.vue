<script setup lang="ts">
// Welcome page: example questions that open the Docus assistant with the question prefilled.
const props = defineProps<{ questions?: string[] }>()

const { isEnabled, open } = useAssistant()

const items = computed(() => props.questions?.length
  ? props.questions
  : [
      'С чего начать новому сотруднику?',
      'Какую модель выбрать для работы с документами?',
      'Как подключить Claude Code в VSCode?',
      'Куда писать, если не могу войти на ИИ-платформу?'
    ])
</script>

<template>
  <div class="rounded-lg border border-default p-4 sm:p-5">
    <p class="text-sm text-highlighted">
      Спросите базу
    </p>
    <p class="mt-1 text-sm/6 text-muted">
      Ассистент отвечает по страницам этой базы и даёт ссылки на источники.
      Открыть его можно на любой странице сочетанием ⌘I или полем внизу экрана.
    </p>
    <div
      v-if="isEnabled"
      class="mt-3 flex flex-wrap gap-2"
    >
      <UButton
        v-for="q in items"
        :key="q"
        :label="q"
        color="neutral"
        variant="soft"
        size="sm"
        @click="open(q, true)"
      />
    </div>
    <p
      v-else
      class="mt-3 text-sm text-dimmed"
    >
      Ассистент сейчас отключён.
    </p>
  </div>
</template>
