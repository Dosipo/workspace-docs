---
title: Схема данных
description: Структура данных воркспейса ArealDev — описание ключевых сущностей, их полей и форматов с примерами JSON.
navigation:
  icon: heroicons:circle-stack
type: reference
resource: /reference/schema
tags: [reference, schema, data, json, agent, issue, comment, okf]
timestamp: "2026-10-30"
status: current
---

Этот раздел описывает структуру данных ключевых сущностей воркспейса ArealDev. Все схемы соответствуют [JSON Schema Draft-07](https://json-schema.org/draft-07) и доступны машиночитаемо в директории `/schemas/`.

::note
Схемы отражают реальные ответы Multica CLI (`multica issue get`, `multica agent list` и т.д.). При расхождении — CLI является источником истины.
::

## Агент

**Агент** — автономный исполнитель задач с заданными инструкциями, языковой моделью и набором скиллов.

JSON Schema: [`/schemas/agent.json`](/schemas/agent.json)

### Поля

::field-group
  ::field{name="id" type="string (uuid)" required}
  Уникальный идентификатор агента.
  ::

  ::field{name="name" type="string" required}
  Отображаемое имя агента (например, «Docs», «Backend»).
  ::

  ::field{name="description" type="string"}
  Краткое описание специализации на русском языке.
  ::

  ::field{name="instructions" type="string"}
  Системные инструкции — определяют поведение агента при выполнении задач.
  ::

  ::field{name="model" type="string"}
  Идентификатор языковой модели (например, `claude-sonnet-4-6`). Пустая строка — наследует дефолтную модель воркспейса.
  ::

  ::field{name="status" type="enum"}
  Текущий статус: `idle`, `active`, `disabled`.
  ::

  ::field{name="runtime_mode" type="enum"}
  Режим запуска: `local` (на машине разработчика) или `cloud` (в облаке Multica).
  ::

  ::field{name="max_concurrent_tasks" type="integer"}
  Максимальное число одновременно выполняемых задач.
  ::

  ::field{name="skills" type="array<string>"}
  Ключи установленных скиллов (например, `["okf-convert", "review-docs"]`).
  ::

  ::field{name="workspace_id" type="string (uuid)" required}
  ID воркспейса.
  ::

  ::field{name="created_at" type="string (date-time)" required}
  Дата создания в формате RFC 3339.
  ::
::

### Пример

```json [agent.json]
{
  "id": "83c48457-633c-469c-9b4d-e9b9278d3bf7",
  "name": "Docs",
  "description": "Эксперт по текущей базе знаний: содержание, структура, навигация, OKF.",
  "model": "claude-sonnet-4-6",
  "status": "idle",
  "runtime_mode": "local",
  "runtime_bound": true,
  "max_concurrent_tasks": 1,
  "skills": ["okf-convert", "review-docs", "multica-platform"],
  "visibility": "private",
  "permission_mode": "private",
  "workspace_id": "afc34da3-9b44-4b34-9df9-7954b0f8574a",
  "owner_id": "c84fd770-0250-4657-be06-d70e512ac3ca",
  "created_at": "2026-10-30T09:40:21Z",
  "updated_at": "2026-10-30T14:21:47Z"
}
```

---

## Задача (Issue)

**Issue** — единица работы с владельцем, статусом и полным жизненным циклом. Доступна через `multica issue get <id>`.

JSON Schema: [`/schemas/issue.json`](/schemas/issue.json)

### Поля

::field-group
  ::field{name="id" type="string (uuid)" required}
  Уникальный идентификатор задачи.
  ::

  ::field{name="identifier" type="string" required}
  Человекочитаемый идентификатор в формате `<PREFIX>-<N>` (например, `AREA-55`).
  ::

  ::field{name="title" type="string" required}
  Заголовок задачи.
  ::

  ::field{name="description" type="string | null"}
  Тело задачи в формате Markdown.
  ::

  ::field{name="status" type="string" required}
  Ключ текущего статуса. Встроенные: `backlog`, `todo`, `in_progress`, `in_review`, `blocked`, `done`, `cancelled`. Кастомные: `agent_review`. Подробнее — в [Статусах задач](/reference/statuses).
  ::

  ::field{name="status_category" type="enum" required}
  Категория жизненного цикла: `unstarted`, `started`, `done`, `cancelled`.
  ::

  ::field{name="priority" type="enum"}
  Приоритет: `urgent`, `high`, `medium`, `low`, `none`.
  ::

  ::field{name="assignee_id" type="string (uuid) | null"}
  ID исполнителя (агент или участник).
  ::

  ::field{name="assignee_type" type="enum | null"}
  Тип исполнителя: `agent` или `member`.
  ::

  ::field{name="parent_issue_id" type="string (uuid) | null"}
  ID родительской задачи для под-задач.
  ::

  ::field{name="stage" type="integer | null"}
  Этап (stage) для под-задач. Под-задачи одного этапа стартуют одновременно.
  ::

  ::field{name="labels" type="array<Label>"}
  Метки задачи. Каждая метка содержит `id`, `name` и `color`.
  ::

  ::field{name="due_date" type="string (date) | null"}
  Дедлайн в формате `YYYY-MM-DD`.
  ::

  ::field{name="workspace_id" type="string (uuid)" required}
  ID воркспейса.
  ::

  ::field{name="created_at" type="string (date-time)" required}
  Дата создания (RFC 3339).
  ::

  ::field{name="last_activity_at" type="string (date-time)"}
  Дата последней активности (комментарий, смена статуса и т.д.).
  ::
::

### Пример

```json [issue.json]
{
  "id": "01a18d8a-922c-76a5-9df6-11bd20c9ec52",
  "identifier": "AREA-55",
  "number": 55,
  "title": "OKF: создать страницу /reference/schema и JSON Schema файлы в DOCUS",
  "description": "## Контекст\n\nЗадача является частью устранения нарушений стандарта OKF...",
  "status": "in_progress",
  "status_category": "started",
  "status_name": "",
  "priority": "medium",
  "assignee_id": "83c48457-633c-469c-9b4d-e9b9278d3bf7",
  "assignee_type": "agent",
  "creator_id": "62503efb-a348-449e-b45c-acaf792413f7",
  "creator_type": "agent",
  "parent_issue_id": "01a18cd6-5fb4-775b-aac4-604a84ce8c8a",
  "stage": 1,
  "labels": [],
  "due_date": null,
  "workspace_id": "afc34da3-9b44-4b34-9df9-7954b0f8574a",
  "created_at": "2026-10-30T16:00:31Z",
  "updated_at": "2026-10-30T16:00:31Z",
  "last_activity_at": "2026-10-30T16:00:31Z"
}
```

---

## Комментарий (Comment)

**Комментарий** — сообщение к задаче от агента или участника. Поддерживает вложенность (треды) и прикрепления файлов.

JSON Schema: [`/schemas/comment.json`](/schemas/comment.json)

### Поля

::field-group
  ::field{name="id" type="string (uuid)" required}
  Уникальный идентификатор комментария.
  ::

  ::field{name="issue_id" type="string (uuid)" required}
  ID задачи, к которой относится комментарий.
  ::

  ::field{name="parent_id" type="string (uuid) | null"}
  ID родительского комментария для ответов в треде. `null` — корневой комментарий.
  ::

  ::field{name="author_id" type="string (uuid)" required}
  ID автора.
  ::

  ::field{name="author_type" type="enum" required}
  Тип автора: `agent` или `member`.
  ::

  ::field{name="type" type="enum" required}
  Тип записи: `comment` (обычный комментарий) или `activity` (событие жизненного цикла задачи).
  ::

  ::field{name="content" type="string" required}
  Текст в формате Markdown. Поддерживает упоминания: `[текст](mention://issue/<id>)`, `[текст](mention://agent/<id>)`.
  ::

  ::field{name="attachments" type="array<Attachment>"}
  Прикреплённые файлы. Каждый содержит `id`, `name`, `url`, `content_type`, `size`.
  ::

  ::field{name="reactions" type="array<Reaction>"}
  Реакции участников (эмодзи + счётчик + список авторов).
  ::

  ::field{name="resolved_at" type="string (date-time) | null"}
  Дата разрешения комментария. `null` — не разрешён.
  ::

  ::field{name="source_task_id" type="string (uuid) | null"}
  ID задачи агентского рана, создавшего комментарий.
  ::

  ::field{name="created_at" type="string (date-time)" required}
  Дата создания (RFC 3339).
  ::
::

### Пример

```json [comment.json]
{
  "id": "01a18d8b-34bc-7e86-ae9a-809c7545f0c2",
  "issue_id": "01a18cd6-5fb4-775b-aac4-604a84ce8c8a",
  "parent_id": null,
  "author_id": "62503efb-a348-449e-b45c-acaf792413f7",
  "author_type": "agent",
  "type": "comment",
  "content": "Разобрал задачу и запустил две параллельные под-задачи...",
  "attachments": [],
  "reactions": [],
  "resolved_at": null,
  "resolved_by_id": null,
  "resolved_by_type": null,
  "source_task_id": "01a18d89-55bb-7ea4-a8df-f6fdaec004ca",
  "revision": 1,
  "created_at": "2026-10-30T16:01:12Z",
  "updated_at": "2026-10-30T16:01:12Z"
}
```

---

## JSON Schema файлы

Все схемы доступны в директории `/schemas/` и соответствуют [JSON Schema Draft-07](https://json-schema.org/draft-07):

| Сущность | Файл |
|---|---|
| Агент | [`/schemas/agent.json`](/schemas/agent.json) |
| Задача | [`/schemas/issue.json`](/schemas/issue.json) |
| Комментарий | [`/schemas/comment.json`](/schemas/comment.json) |
