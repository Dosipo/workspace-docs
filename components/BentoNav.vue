<template>
  <nav class="page-nav" aria-label="Разделы базы знаний">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="page-nav__card"
    >
      <Icon :name="item.icon" class="page-nav__icon" aria-hidden="true" />
      <span class="page-nav__title">{{ item.title }}</span>
      <span class="page-nav__desc">{{ item.desc }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const items = [
  {
    title: 'Онбординг',
    desc: 'Введение в воркспейс, быстрый старт и ключевые концепции',
    icon: 'heroicons:rocket-launch',
    to: '/onboarding',
  },
  {
    title: 'ИИ-платформа',
    desc: 'Регистрация, агенты, модели, работа с файлами и каналами',
    icon: 'heroicons:chat-bubble-left-right',
    to: '/ii-platforma',
  },
  {
    title: 'Обзор ИИ-инструментов',
    desc: 'Корпоративные инструменты ИИ: платформа, VSCode, Excel, n8n',
    icon: 'heroicons:squares-2x2',
    to: '/obzor',
  },
  {
    title: 'Лучшие практики',
    desc: 'Как писать промпты, выбирать модели и работать с ИИ эффективно',
    icon: 'heroicons:light-bulb',
    to: '/luchshie-praktiki',
  },
  {
    title: 'Вайб-кодинг',
    desc: 'VSCode, Claude Code, Kilo Code, Git, SSH и работа с ИИ в IDE',
    icon: 'heroicons:code-bracket',
    to: '/vayb-koding',
  },
  {
    title: 'Excel + ИИ',
    desc: 'Надстройка для Excel: чат, функция LLM(), пакетная обработка',
    icon: 'heroicons:table-cells',
    to: '/excel',
  },
  {
    title: 'n8n',
    desc: 'Автоматизация: workflows, credentials, PostgreSQL, демо-сценарии',
    icon: 'heroicons:bolt',
    to: '/n8n',
  },
  {
    title: 'Частые вопросы',
    desc: 'Ответы на самые частые вопросы по всем инструментам',
    icon: 'heroicons:question-mark-circle',
    to: '/faq',
  },
  {
    title: 'Список моделей',
    desc: 'Доступные ИИ-модели для платформы, n8n и вайб-кодинга',
    icon: 'heroicons:cube',
    to: '/modeli',
  },
]
</script>

<style scoped>
.page-nav {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.625rem;
  margin: 1.5rem 0 2rem;
}

.page-nav__card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.125rem 1.125rem 0.875rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  text-decoration: none;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.page-nav__card:hover {
  background: var(--secondary);
  border-color: color-mix(in oklch, var(--border), black 8%);
}

.page-nav__card:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.page-nav__icon {
  width: 1.375rem;
  height: 1.375rem;
  margin-bottom: 0.5rem;
  display: block;
  color: var(--muted-foreground);
}

.page-nav__title {
  display: block;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--card-foreground);
  line-height: 1.3;
}

.page-nav__desc {
  display: block;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--muted-foreground);
  margin-top: 0.125rem;
}

@media (max-width: 900px) {
  .page-nav {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .page-nav {
    grid-template-columns: 1fr;
  }
}
</style>
