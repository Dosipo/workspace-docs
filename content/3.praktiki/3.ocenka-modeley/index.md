---
title: Оценка моделей
description: Зачем проверять модели, какие бенчмарки качества и безопасности существуют, как собрать свой голденсет и проверить агента на промпт-инъекции; шпаргалка, что смотреть под вашу задачу.
navigation:
  title: Оценка моделей
  icon: i-lucide-gauge
type: Overview
resource: /praktiki/ocenka-modeley
tags: [evaluation, benchmarks, golden-set, safety, prompt-injection]
generated: { by: Docs/claude-sonnet-5-5, at: "2026-11-05T15:00:00Z" }
status: stable
stale_after: "2027-02-05T00:00:00Z"
created: "05.11.2026"
updated: "10.11.2026"
created_by: { id: Docs/claude-sonnet-5-5, name: Docs }
updated_by: { id: kb-editor/claude-sonnet-5-5, name: Редактор базы знаний }
contributors:
  - { id: Docs/claude-sonnet-5-5, name: Docs }
  - { id: Analyst/multica, name: Analyst }
  - { id: kb-editor/claude-sonnet-5-5, name: Редактор базы знаний }
---

Публичные бенчмарки помогают отобрать кандидатов, но выбор модели для вашей задачи подтверждает только проверка на ваших данных. Раздел объясняет, как её провести и не обмануться цифрами.

## Карта раздела

::::card-group
  ::card{title="Бенчмарки качества" icon="i-lucide-chart-bar" to="/praktiki/ocenka-modeley/benchmarki-kachestva"}
  Что меряют MMLU-Pro, GPQA, SWE-bench, Terminal-Bench, τ-bench и другие, и как читать их цифры.
  ::
  ::card{title="Бенчмарки безопасности" icon="i-lucide-shield-check" to="/praktiki/ocenka-modeley/benchmarki-bezopasnosti"}
  Отказы на вредные запросы, ложные отказы, агентный вред, предвзятость.
  ::
  ::card{title="Голденсеты" icon="i-lucide-list-checks" to="/praktiki/ocenka-modeley/goldensety"}
  Свой набор проверок: сбор, оценка, LLM-as-judge, регресс при смене модели.
  ::
  ::card{title="Проверка на промпт-инъекции" icon="i-lucide-bug-off" to="/praktiki/ocenka-modeley/prompt-inyekcii"}
  Защитная методика для агентов, n8n и Excel.
  ::
::::

## Что смотреть под задачу

| Задача | Публичные бенчмарки для отбора | Затем обязательно |
|---|---|---|
| Кодинг, агент в терминале | Terminal-Bench, SWE-bench, LiveCodeBench | свой голденсет на ваших репозиториях |
| Агент с инструментами | τ-bench, OSWorld | тест на промпт-инъекции |
| Длинные документы | RULER, LongBench | голденсет на ваших документах |
| Следование формату ответа | IFEval | проверка схемы JSON кодом |
| Чат-ассистент для людей | LMArena (предпочтения) | голденсет с рубрикой |
| Любой сценарий с внешними данными | AgentDojo, InjecAgent | [проверка на инъекции](/praktiki/ocenka-modeley/prompt-inyekcii) |

::tip
Порядок работы: отобрать 2–3 кандидатов по публичным цифрам, прогнать их по голденсету, проверить безопасность, зафиксировать результат рядом с версией набора.
::

## Где взять цифры моделей

Эти страницы не дублируют таблицы с результатами: они быстро устаревают.

- Claude: [Бенчмарки Claude](/instrumenty/claude/benchmarki) и [Выбор модели Claude](/instrumenty/claude/vybor-modeli).
- Все вендоры, доступные у нас: [Список моделей](/spravochnik/modeli) и [Какую выбрать модель](/instrumenty/ii-platforma/vybor-modeli).
