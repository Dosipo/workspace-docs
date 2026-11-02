<template>
  <div class="ws-home">
    <!-- Welcome header -->
    <header class="ws-home__header">
      <h1 class="ws-home__title">База знаний воркспейса</h1>
      <p class="ws-home__lead">
        Централизованная документация для команды и AI-агентов. Здесь собраны гайды,
        инструкции и справочники по всем корпоративным ИИ-инструментам.
      </p>
      <NuxtLink to="/onboarding" class="ws-home__cta">
        <Icon name="i-lucide-arrow-right" class="ws-home__cta-icon" />
        Начать работу
      </NuxtLink>
    </header>

    <!-- Sections grid -->
    <nav class="ws-home__sections" aria-label="Разделы базы знаний">
      <div
        v-for="group in groups"
        :key="group.label"
        class="ws-home__group"
      >
        <span class="ws-home__group-label">{{ group.label }}</span>
        <div class="ws-home__grid">
          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="ws-home__card"
          >
            <Icon :name="item.icon" class="ws-home__card-icon" aria-hidden="true" />
            <span class="ws-home__card-title">{{ item.title }}</span>
            <span class="ws-home__card-desc">{{ item.desc }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
const groups = [
  {
    label: 'Начало работы',
    items: [
      {
        title: 'Онбординг',
        desc: 'Первые шаги для новых участников команды и агентов',
        icon: 'i-lucide-rocket',
        to: '/onboarding',
      },
      {
        title: 'Обзор ИИ-инструментов',
        desc: 'Сравнение корпоративных инструментов: платформа, VSCode, Excel, n8n',
        icon: 'i-lucide-layout-grid',
        to: '/obzor',
      },
      {
        title: 'Лучшие практики',
        desc: 'Как писать промпты, выбирать модели и работать с ИИ эффективно',
        icon: 'i-lucide-lightbulb',
        to: '/luchshie-praktiki',
      },
    ],
  },
  {
    label: 'Инструменты',
    items: [
      {
        title: 'ИИ-платформа',
        desc: 'Регистрация, агенты, модели, работа с файлами и каналами',
        icon: 'i-lucide-message-square',
        to: '/ii-platforma',
      },
      {
        title: 'Вайб-кодинг',
        desc: 'VSCode, Claude Code, Kilo Code, Git, SSH и работа с ИИ в IDE',
        icon: 'i-lucide-code-2',
        to: '/vayb-koding',
      },
      {
        title: 'Excel + ИИ',
        desc: 'Надстройка для Excel: чат, функция LLM(), пакетная обработка',
        icon: 'i-lucide-table-2',
        to: '/excel',
      },
      {
        title: 'n8n',
        desc: 'Автоматизация: workflows, credentials, PostgreSQL, демо-сценарии',
        icon: 'i-lucide-workflow',
        to: '/n8n',
      },
    ],
  },
  {
    label: 'Справочники',
    items: [
      {
        title: 'Справочник',
        desc: 'Детальная документация по инструментам, процессам и скиллам',
        icon: 'i-lucide-book-open',
        to: '/reference',
      },
      {
        title: 'Частые вопросы',
        desc: 'Ответы на самые частые вопросы по всем инструментам',
        icon: 'i-lucide-help-circle',
        to: '/faq',
      },
      {
        title: 'Список моделей',
        desc: 'Доступные ИИ-модели для платформы, n8n и вайб-кодинга',
        icon: 'i-lucide-cpu',
        to: '/modeli',
      },
    ],
  },
]
</script>

<style scoped>
.ws-home {
  padding: 3rem 1.25rem 4rem;
  max-width: 960px;
  margin: 0 auto;
  box-sizing: border-box;
  width: 100%;
}

@media (min-width: 640px) {
  .ws-home {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

@media (min-width: 1024px) {
  .ws-home {
    padding-left: 3rem;
    padding-right: 3rem;
  }
}

/* Header */
.ws-home__header {
  margin-bottom: 3rem;
}

.ws-home__title {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: var(--foreground);
  margin: 0 0 0.75rem;
}

.ws-home__lead {
  font-size: 1rem;
  line-height: 1.65;
  color: var(--muted-foreground);
  margin: 0 0 1.25rem;
  max-width: 56ch;
}

.ws-home__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--foreground);
  text-decoration: none;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  transition: background 0.1s ease, border-color 0.1s ease;
}

.ws-home__cta:hover {
  background: var(--secondary);
  border-color: oklch(from var(--border) calc(l - 0.06) c h);
}

.ws-home__cta:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.ws-home__cta-icon {
  width: 0.9rem;
  height: 0.9rem;
  opacity: 0.7;
}

/* Groups */
.ws-home__sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.ws-home__group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.ws-home__group-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}

/* Grid — auto-fit fills rows without orphans:
   900px→4col, 600px→2col, <420px→1col */
.ws-home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

/* Cards */
.ws-home__card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1rem 0.875rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-decoration: none;
  transition: background 0.1s ease, border-color 0.1s ease;
}

.ws-home__card:hover {
  background: var(--secondary);
  border-color: oklch(from var(--border) calc(l - 0.07) c h);
}

.ws-home__card:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.ws-home__card-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: var(--muted-foreground);
  margin-bottom: 0.5rem;
  flex-shrink: 0;
}

.ws-home__card-title {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--card-foreground);
  line-height: 1.3;
}

.ws-home__card-desc {
  display: block;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--muted-foreground);
}

/* Responsive */
@media (max-width: 480px) {
  .ws-home__title {
    font-size: 1.625rem;
  }
}
</style>
