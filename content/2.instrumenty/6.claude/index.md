---
title: Claude — модели Anthropic
description: Что такое Claude, какие четыре модели поколения 5.5 актуальны на 05.11.2026 (Fable, Opus, Sonnet, Haiku) и краткая шпаргалка, какую взять для кода, документов и массовых задач.
navigation:
  title: Claude
  icon: heroicons:sparkles
type: Overview
resource: /instrumenty/claude
tags: [claude, anthropic, models, overview]
generated: { by: Docs/claude-sonnet-5-5, at: "2026-11-05T12:30:00Z" }
status: draft
created: "05.11.2026"
updated: "05.11.2026"
created_by: { id: Docs/claude-sonnet-5-5, name: Docs }
updated_by: { id: Docs/claude-sonnet-5-5, name: Docs }
contributors:
  - { id: Docs/claude-sonnet-5-5, name: Docs }
  - { id: Analyst/claude-sonnet-5-5, name: Analyst }
---

Claude — семейство больших языковых моделей компании Anthropic. Раздел помогает понять, какие модели есть сейчас, чем они отличаются и какую выбрать под задачу. Данные актуальны на **05.11.2026**.

Актуальная линейка состоит из четырёх моделей поколения 5.x. У всех контекст 1 млн токенов и вывод до 128 тыс. токенов.

| Семейство | Модель | Для чего |
|---|---|---|
| Fable | Claude Fable 5.1 | самые сложные рассуждения и исследования; самая дорогая |
| Opus | Claude Opus 5.5 | длинные автономные сессии, рефакторинг, тяжёлые цепочки |
| Sonnet | Claude Sonnet 5.5 | рабочая лошадка: код, агенты, анализ данных, тексты |
| Haiku | Claude Haiku 5.5 | быстрые массовые задачи: классификация, извлечение, маршрутизация |

Источник: [обзор моделей Anthropic](https://platform.claude.com/docs/en/models/overview), на 05.11.2026.

## Шпаргалка: какую взять

::tip
Если сомневаетесь, начните с **Sonnet 5.5**. Не хватило качества — переходите на Opus 5.5. Нужна скорость и низкая цена — на Haiku 5.5. Подробности — на странице [Какую модель выбрать](/instrumenty/claude/kakuyu-model-vybrat).
::

::warning
В наших статьях пока нет моделей поколения 5.5, а `geotech/anthropic/claude-sonnet-4-5` снимается с поддержки 30.11.2026. Подробности — в [Моделях](/instrumenty/claude/modeli).
::

## Страницы раздела

::card-group
  ::card
  ---
  title: Модели
  icon: heroicons:cpu-chip
  to: /instrumenty/claude/modeli
  ---
  ID в API, контекст, цены, статусы и соответствие нашим именам `geotech/...` и `gti/...`.
  ::

  ::card
  ---
  title: Бенчмарки
  icon: heroicons:chart-bar
  to: /instrumenty/claude/benchmarki
  ---
  Кодинг, агенты, рассуждения: таблицы, графики и оговорки по методике.
  ::

  ::card
  ---
  title: Какую модель выбрать
  icon: heroicons:adjustments-horizontal
  to: /instrumenty/claude/kakuyu-model-vybrat
  ---
  Задача → модель с обоснованием по цене и бенчмаркам.
  ::
::

## Где что лежит

- **Эта страница и раздел «Claude»** — главные для моделей Anthropic: линейка, цены, бенчмарки.
- [Какую выбрать модель](/instrumenty/ii-platforma/vybor-modeli) — главная страница по выбору среди всех моделей ИИ-платформы.
- [Список доступных моделей](/spravochnik/modeli) — главный справочник того, что доступно у нас, с рейтингами.
- [Claude Code для VSCode](/instrumenty/vayb-koding/vscode/claude-code) — как подключить Claude Code к редактору.
