---
title: Claude
description: Что такое Claude, какие семейства моделей есть (Fable, Opus, Sonnet, Haiku), чем они отличаются и какую взять по умолчанию. Вход в раздел с моделями, бенчмарками и выбором под задачу.
navigation:
  icon: simple-icons:anthropic
type: Overview
resource: /instrumenty/claude
tags: [claude, anthropic, models, overview]
generated: { by: Docs/claude-sonnet-5-5, at: "2026-11-05T12:00:00Z" }
status: stable
stale_after: "2026-12-05T00:00:00Z"
created: "05.11.2026"
updated: "05.11.2026"
created_by: { id: Docs/claude-sonnet-5-5, name: Docs }
updated_by: { id: Docs/claude-sonnet-5-5, name: Docs }
contributors:
  - { id: Docs/claude-sonnet-5-5, name: Docs }
  - { id: Analyst/multica, name: Analyst }
sources:
  - resource: file:claude-research.md
    title: "Фактура по Claude: линейка, бенчмарки, выбор модели (снимок 05.11.2026)"
---

Claude — семейство ИИ-моделей компании Anthropic. Эти модели работают за ИИ-платформой, в n8n и в вайб-кодинге. Страница даёт общую картину и шпаргалку «какую взять»; подробности — на страницах раздела. Данные на 05.11.2026.

## Семейства моделей

Сейчас актуально поколение 5.x: у всех четырёх моделей контекст 1M токенов и вывод до 128K.

::card-group
  ::card
  ---
  title: Fable 5.1
  icon: heroicons:sparkles
  to: /instrumenty/claude/modeli
  ---
  Самая способная и самая дорогая: $10 / $50 за 1M токенов. Для задач, где не хватило Opus.
  ::
  ::card
  ---
  title: Opus 5.5
  icon: heroicons:cube
  to: /instrumenty/claude/modeli
  ---
  Сильные рассуждения и долгие автономные сессии: $4 / $20.
  ::
  ::card
  ---
  title: Sonnet 5.5
  icon: heroicons:bolt
  to: /instrumenty/claude/modeli
  ---
  Лучший баланс цены и качества, основа по умолчанию: $2 / $10.
  ::
  ::card
  ---
  title: Haiku 5.5
  icon: heroicons:rocket-launch
  to: /instrumenty/claude/modeli
  ---
  Самая быстрая и дешёвая: $0,10 / $0,50 для промпта до 100K токенов.
  ::
::

## Шпаргалка

| Задача | Модель |
|---|---|
| Кодинг и агенты, анализ данных, тексты | Sonnet 5.5 |
| Многочасовые автономные сессии, рефакторинг | Opus 5.5 |
| Самые сложные рассуждения | Fable 5.1, если Opus 5.5 не хватило |
| Классификация, извлечение, массовая обработка | Haiku 5.5 |

Обоснование и остальные сценарии — в разделе [Какую модель Claude выбрать](/instrumenty/claude/vybor-modeli).

::note
Не каждая модель из списка доступна у нас. Какие именно подключены к платформе, смотрите в [справочнике моделей](/spravochnik/modeli).
::

## Что в разделе

- [Модели Claude](/instrumenty/claude/modeli) — ID, контекст, цены, статусы и соответствие нашим именам `geotech/…` и `gti/…`.
- [Бенчмарки Claude](/instrumenty/claude/benchmarki) — сравнение моделей в тестах на кодинг, агентность и рассуждения.
- [Какую модель Claude выбрать](/instrumenty/claude/vybor-modeli) — задача → модель с обоснованием.
