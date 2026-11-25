---
title: База знаний ИИ Ареал
description: "Что такое База знаний ИИ Ареал: для кого она, что в ней есть, как искать, спрашивать ассистента и предлагать правки."
navigation: false
type: Overview
resource: /
tags: [index, documentation, knowledge-base, workspace]
generated: { by: human:dosipo, at: "2026-11-02T13:11:59Z" }
status: stable
created: "30.10.2026"
updated: "25.11.2026"
created_by: { id: human:dosipo, name: Даниил Осипов }
updated_by: { id: claude/opus-5-5, name: Claude Opus 5.5 }
contributors:
  - { id: human:dosipo, name: Даниил Осипов }
  - { id: Mika/multica, name: Mika }
  - { id: claude/sonnet-4-6, name: Claude Sonnet 4.6 }
  - { id: multica-agent/multica, name: multica-agent }
  - { id: kb-editor/claude-sonnet-5-5, name: Редактор базы знаний }
  - { id: claude/opus-5-5, name: Claude Opus 5.5 }
---

::u-page-hero
#title
База знаний ИИ Ареал

#description
Здесь собрано, как в компании работают с ИИ: какие инструменты доступны, как ими пользоваться, какие модели выбирать и куда обращаться за помощью. Базу читают и люди, и ИИ-агенты в Multica.

#links
  :::u-button{to="/nachalo-raboty/onboarding" size="lg" icon="i-lucide-arrow-right" color="neutral" variant="outline"}
  Начать работу
  :::
  :::u-button{to="/komanda/obrashchenie" size="lg" color="neutral" variant="ghost"}
  Куда обратиться
  :::
::

::u-page-section
#default
  :::ask-kb
  :::
::

::u-page-section
#title
Что здесь есть

#default
  :::u-page-grid
    ::::u-page-card{title="Инструкции" description="Пошаговые действия: регистрация, подключение, настройка. Начинаются с цели и заканчиваются проверкой результата." variant="outline"}
    ::::
    ::::u-page-card{title="Справочники" description="Списки моделей, ответы на частые вопросы, спецификации. Их просматривают, а не читают подряд." variant="outline"}
    ::::
    ::::u-page-card{title="Объяснения" description="Почему устроено так: сравнение инструментов, выбор модели, архитектура платформы." variant="outline"}
    ::::
  :::
::

::u-page-section
#title
Начало работы

#default
  :::u-page-grid
    ::::u-page-card{to="/nachalo-raboty/onboarding" icon="i-lucide-rocket" title="Онбординг" description="Первые шаги для новых участников команды и агентов" variant="outline"}
    ::::
    ::::u-page-card{to="/nachalo-raboty/obzor" icon="i-lucide-layout-grid" title="Обзор ИИ-инструментов" description="Сравнение корпоративных инструментов: платформа, VSCode, Excel, n8n" variant="outline"}
    ::::
    ::::u-page-card{to="/praktiki" icon="i-lucide-lightbulb" title="Лучшие практики" description="Как писать промпты, выбирать модели и снижать затраты на ИИ" variant="outline"}
    ::::
  :::
::

::u-page-section
#title
Инструменты

#default
  :::u-page-grid{class="lg:grid-cols-4"}
    ::::u-page-card{to="/instrumenty/ii-platforma" icon="i-lucide-message-square" title="ИИ-платформа" description="Регистрация, агенты, модели, работа с файлами и каналами" variant="outline"}
    ::::
    ::::u-page-card{to="/instrumenty/vayb-koding" icon="i-lucide-code-2" title="Вайб-кодинг" description="VSCode, Claude Code, Kilo Code, Git, SSH и работа с ИИ в IDE" variant="outline"}
    ::::
    ::::u-page-card{to="/instrumenty/excel" icon="i-lucide-table-2" title="Excel + ИИ" description="Надстройка для Excel: чат, функция LLM(), пакетная обработка" variant="outline"}
    ::::
    ::::u-page-card{to="/instrumenty/n8n" icon="i-lucide-workflow" title="n8n" description="Автоматизация: workflows, credentials, PostgreSQL, демо-сценарии" variant="outline"}
    ::::
    ::::u-page-card{to="/instrumenty/multica" icon="i-lucide-bot" title="Multica" description="Платформа, где люди и ИИ-агенты работают над задачами вместе" variant="outline"}
    ::::
    ::::u-page-card{to="/instrumenty/claude" icon="i-lucide-sparkles" title="Claude" description="Семейства моделей Claude и какую взять по умолчанию" variant="outline"}
    ::::
  :::
::

::u-page-section
#title
Справочники

#default
  :::u-page-grid
    ::::u-page-card{to="/spravochnik/faq" icon="i-lucide-help-circle" title="Частые вопросы" description="Ответы на частые вопросы по всем инструментам" variant="outline"}
    ::::
    ::::u-page-card{to="/spravochnik/modeli" icon="i-lucide-cpu" title="Список моделей" description="Доступные ИИ-модели для платформы, n8n и вайб-кодинга" variant="outline"}
    ::::
  :::
::

::u-page-section
#title
Команда и платформа

#default
  :::u-page-grid
    ::::u-page-card{to="/komanda" icon="i-lucide-users" title="Команда" description="Чем занимается команда, какие услуги оказывает и куда писать с вопросом" variant="outline"}
    ::::
    ::::u-page-card{to="/devops-arhitektura" icon="i-lucide-server" title="DevOps и архитектура" description="Kubernetes, Harbor, SeaweedFS и PostgreSQL: из чего собрана платформа" variant="outline"}
    ::::
  :::
::

::u-page-section
#title
Как устроена база

#default
Каждая страница — markdown-файл в репозитории [Dosipo/workspace-docs](https://github.com/Dosipo/workspace-docs). Внизу страницы есть блок «О странице»: кто её создал, кто правил последним и на каких источниках она основана. Если источников нет, страница описывает практику команды.

Предложить правку можно двумя способами:

1. Ссылка «Редактировать страницу» внизу любой страницы открывает файл на GitHub. Изменение уходит в pull request и проходит ревью.
2. Новый документ или ссылку передайте агенту «Куратор знаний» в Multica. Он проверит, чего в базе ещё нет, и подготовит страницы. Текст вычитывает «Редактор базы знаний», публикацию одобряет человек.

Правила оформления страниц: [Оформление страниц](/nachalo-raboty/onboarding/authoring). Формат, в котором база отдаётся агентам: [Open Knowledge Format](/spravochnik/okf).
::
