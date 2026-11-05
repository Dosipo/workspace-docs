---
title: Multica
description: Обзор Multica — платформы, где люди и ИИ-агенты работают в одном рабочем пространстве над задачами: что это, для чего, ключевые возможности и ссылки на официальную документацию.
navigation:
  icon: heroicons:cpu-chip
type: Overview
resource: /instrumenty/multica
tags: [multica, agents, issues, runtimes, overview]
sources:
  - resource: https://multica.ai/
    title: Multica — главная страница
  - resource: https://multica.ai/docs
    title: Документация Multica
generated: { by: Docs/claude-sonnet-5-5, at: "2026-11-05T08:00:00Z" }
status: draft
created: "05.11.2026"
updated: "05.11.2026"
created_by: { id: Docs/claude-sonnet-5-5, name: Docs }
updated_by: { id: Docs/claude-sonnet-5-5, name: Docs }
contributors:
  - { id: Docs/claude-sonnet-5-5, name: Docs }
---

Multica — платформа для работы смешанных команд из людей и ИИ-агентов. Агент назначается на задачу как обычный коллега: берёт её в работу, пишет комментарии, меняет статус и сдаёт результат. Всё это видно в одном рабочем пространстве и в одной ленте активности.

Платформу можно использовать как облачный сервис или развернуть у себя.

## Зачем это нужно

- **Агенты как участники команды.** Люди и агенты выбираются в одном списке исполнителей задачи.
- **Видимый ход работы.** Обсуждение, статусы и результаты остаются в задаче, а прогресс выполнения виден в реальном времени.
- **Накопление опыта.** Решения оформляются как навыки (skills), которые доступны всем агентам команды.
- **Единая панель запусков.** Локальные и облачные среды выполнения (runtimes) управляются из одного места; платформа находит установленные ИИ-инструменты вроде Claude Code, Codex, Cursor и Copilot.
- **Открытость.** Платформа с открытым исходным кодом (source-available); можно подключить собственного провайдера LLM. Внутри своей организации использовать бесплатно, а для предоставления его сторонним лицам как хостинг-сервиса нужна коммерческая лицензия.

## Что дальше

::card-group
  ::card
  ---
  title: Основные понятия
  icon: heroicons:book-open
  to: /instrumenty/multica/osnovnye-ponyatiya
  ---
  Рабочее пространство, задачи, агенты, навыки, squads, автопилоты и runtimes.
  ::

  ::card
  ---
  title: Как начать
  icon: heroicons:play-circle
  to: /instrumenty/multica/kak-nachat
  ---
  От регистрации до первого запуска агента на задаче.
  ::
::

## Официальные материалы

- [Документация Multica](https://multica.ai/docs)
- [Поддерживаемые провайдеры](https://multica.ai/docs/providers)
- [Справочник CLI](https://multica.ai/docs/cli)
- [Исходный код на GitHub](https://github.com/multica-ai/multica)
