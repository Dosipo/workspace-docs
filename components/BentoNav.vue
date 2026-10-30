<template>
  <nav class="bento-nav" aria-label="Разделы базы знаний">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      :class="['bento-card', item.size || 'size-1x1', `accent-${item.accent}`]"
    >
      <span class="bento-card__icon" aria-hidden="true">{{ item.emoji }}</span>
      <span class="bento-card__title">{{ item.title }}</span>
      <span class="bento-card__desc">{{ item.desc }}</span>
      <span class="bento-card__arrow" aria-hidden="true">→</span>
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
    size: 'size-2x1',
    accent: 'violet',
  },
  {
    title: 'Справочник',
    desc: 'Детальная документация по инструментам, процессам и API',
    emoji: '📖',
    to: '/reference',
    size: 'size-1x1',
    accent: 'blue',
  },
  {
    title: 'ИИ-платформа',
    desc: 'Регистрация, агенты, модели, работа с файлами и каналами',
    emoji: '💬',
    to: '/ii-platforma',
    size: 'size-1x1',
    accent: 'emerald',
  },
  {
    title: 'Обзор ИИ-инструментов',
    desc: 'Корпоративные инструменты ИИ: платформа, VSCode, Excel, n8n',
    emoji: '🤖',
    to: '/obzor',
    size: 'size-1x1',
    accent: 'orange',
  },
  {
    title: 'Лучшие практики',
    desc: 'Как писать промпты, выбирать модели и работать с ИИ эффективно',
    emoji: '💡',
    to: '/luchshie-praktiki',
    size: 'size-1x1',
    accent: 'yellow',
  },
  {
    title: 'Вайб-кодинг',
    desc: 'VSCode, Claude Code, Kilo Code, Git, SSH и работа с ИИ в IDE',
    emoji: '💻',
    to: '/vayb-koding',
    size: 'size-2x1',
    accent: 'indigo',
  },
  {
    title: 'Excel + ИИ',
    desc: 'Надстройка для Excel: чат, функция LLM(), пакетная обработка',
    emoji: '📊',
    to: '/excel',
    size: 'size-1x1',
    accent: 'green',
  },
  {
    title: 'n8n',
    desc: 'Автоматизация: workflows, credentials, PostgreSQL, демо-сценарии',
    emoji: '⚡',
    to: '/n8n',
    size: 'size-1x1',
    accent: 'red',
  },
  {
    title: 'Частые вопросы',
    desc: 'Ответы на самые частые вопросы по всем инструментам',
    emoji: '❓',
    to: '/faq',
    size: 'size-1x1',
    accent: 'pink',
  },
  {
    title: 'Список моделей',
    desc: 'Доступные ИИ-модели для платформы, n8n и вайб-кодинга',
    emoji: '🧩',
    to: '/modeli',
    size: 'size-1x1',
    accent: 'slate',
  },
]
</script>

<style scoped>
.bento-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 180px;
  gap: 12px;
  margin: 2rem 0;
}

/* Sizing variants */
.size-2x1 {
  grid-column: span 2;
}
.size-1x1 {
  grid-column: span 1;
}

/* Base card */
.bento-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.25rem 1.25rem 1rem;
  border-radius: 16px;
  border: 1px solid var(--border, #e5e7eb);
  background: var(--card, #ffffff);
  text-decoration: none;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  cursor: pointer;
}

.bento-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px oklch(0 0 0 / 10%);
}

.bento-card:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* Icon */
.bento-card__icon {
  font-size: 2rem;
  line-height: 1;
  margin-bottom: auto;
  display: block;
}

/* Title */
.bento-card__title {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: var(--card-foreground, #111827);
  margin-top: 0.75rem;
  margin-bottom: 0.2rem;
  line-height: 1.25;
}

/* Description */
.bento-card__desc {
  display: block;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--muted-foreground, #6b7280);
}

/* Arrow */
.bento-card__arrow {
  position: absolute;
  top: 1.1rem;
  right: 1.1rem;
  font-size: 1rem;
  color: var(--border, #d1d5db);
  transition: color 0.15s ease, transform 0.15s ease;
}
.bento-card:hover .bento-card__arrow {
  color: var(--muted-foreground);
  transform: translate(2px, -2px);
}

/* Accent backgrounds — subtle tint on the card */
.bento-card::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.06;
  border-radius: inherit;
  transition: opacity 0.18s ease;
}
.bento-card:hover::before {
  opacity: 0.1;
}

.accent-violet::before { background: #7c3aed; }
.accent-blue::before   { background: #2563eb; }
.accent-emerald::before{ background: #059669; }
.accent-orange::before { background: #ea580c; }
.accent-yellow::before { background: #ca8a04; }
.accent-indigo::before { background: #4f46e5; }
.accent-green::before  { background: #16a34a; }
.accent-red::before    { background: #dc2626; }
.accent-pink::before   { background: #db2777; }
.accent-slate::before  { background: #475569; }

/* Accent left border stripe */
.bento-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  border-radius: 16px 0 0 16px;
  opacity: 0.7;
}
.accent-violet::after { background: #7c3aed; }
.accent-blue::after   { background: #2563eb; }
.accent-emerald::after{ background: #059669; }
.accent-orange::after { background: #ea580c; }
.accent-yellow::after { background: #ca8a04; }
.accent-indigo::after { background: #4f46e5; }
.accent-green::after  { background: #16a34a; }
.accent-red::after    { background: #dc2626; }
.accent-pink::after   { background: #db2777; }
.accent-slate::after  { background: #475569; }

/* Dark mode via CSS variable (Docus uses .dark class) */
:root.dark .bento-card,
html.dark .bento-card,
.dark .bento-card {
  background: var(--card, #1f2937);
  border-color: var(--border, #374151);
}
:root.dark .bento-card__title,
html.dark .bento-card__title,
.dark .bento-card__title {
  color: var(--card-foreground, #f9fafb);
}
:root.dark .bento-card__desc,
html.dark .bento-card__desc,
.dark .bento-card__desc {
  color: var(--muted-foreground, #9ca3af);
}
:root.dark .bento-card::before,
html.dark .bento-card::before,
.dark .bento-card::before {
  opacity: 0.12;
}
:root.dark .bento-card:hover::before,
html.dark .bento-card:hover::before,
.dark .bento-card:hover::before {
  opacity: 0.18;
}
:root.dark .bento-card:hover,
html.dark .bento-card:hover,
.dark .bento-card:hover {
  box-shadow: 0 8px 32px oklch(0 0 0 / 40%);
}

/* Responsive */
@media (max-width: 900px) {
  .bento-nav {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 160px;
  }
}

@media (max-width: 480px) {
  .bento-nav {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }
  .size-2x1,
  .size-2x2 {
    grid-column: span 1;
  }
  .bento-card {
    padding: 1rem;
    min-height: 120px;
  }
}
</style>
