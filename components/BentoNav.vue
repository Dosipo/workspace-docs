<template>
  <nav class="page-nav" aria-label="Разделы базы знаний">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="page-nav__card"
    >
      <span class="page-nav__icon" aria-hidden="true">{{ item.emoji }}</span>
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
    emoji: '🚀',
    to: '/onboarding',
  },
  {
    title: 'Справочник',
    desc: 'Детальная документация по инструментам, процессам и API',
    emoji: '📖',
    to: '/reference',
  },
  {
    title: 'ИИ-платформа',
    desc: 'Регистрация, агенты, модели, работа с файлами и каналами',
    emoji: '💬',
    to: '/ii-platforma',
  },
  {
    title: 'Обзор ИИ-инструментов',
    desc: 'Корпоративные инструменты ИИ: платформа, VSCode, Excel, n8n',
    emoji: '🤖',
    to: '/obzor',
  },
  {
    title: 'Лучшие практики',
    desc: 'Как писать промпты, выбирать модели и работать с ИИ эффективно',
    emoji: '💡',
    to: '/luchshie-praktiki',
  },
  {
    title: 'Вайб-кодинг',
    desc: 'VSCode, Claude Code, Kilo Code, Git, SSH и работа с ИИ в IDE',
    emoji: '💻',
    to: '/vayb-koding',
  },
  {
    title: 'Excel + ИИ',
    desc: 'Надстройка для Excel: чат, функция LLM(), пакетная обработка',
    emoji: '📊',
    to: '/excel',
  },
  {
    title: 'n8n',
    desc: 'Автоматизация: workflows, credentials, PostgreSQL, демо-сценарии',
    emoji: '⚡',
    to: '/n8n',
  },
  {
    title: 'Частые вопросы',
    desc: 'Ответы на самые частые вопросы по всем инструментам',
    emoji: '❓',
    to: '/faq',
  },
  {
    title: 'Список моделей',
    desc: 'Доступные ИИ-модели для платформы, n8n и вайб-кодинга',
    emoji: '🧩',
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
  border-color: var(--muted-foreground);
  border-color: oklch(from var(--border) calc(l - 0.08) c h);
}

.page-nav__card:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.page-nav__icon {
  font-size: 1.375rem;
  line-height: 1;
  margin-bottom: 0.5rem;
  display: block;
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
