---
title: Правила оформления страниц
description: Как оформить страницу базы знаний — frontmatter, заголовок без H1, короткое имя в сайдбаре через navigation.title, формат sources и блок «О странице» с метаданными OKF. Шаблон новой страницы.
navigation:
  title: Оформление страниц
  icon: heroicons:pencil-square
type: Guide
resource: /nachalo-raboty/onboarding/authoring
tags: [onboarding, authoring, frontmatter, mdc, search, okf, template]
generated: { by: Docs/claude-sonnet-5-5, at: "2026-11-02T15:12:08Z" }
status: stable
created: "02.11.2026"
updated: "02.11.2026"
created_by: { id: human:dosipo, name: Даниил Осипов }
updated_by: { id: Docs/claude-sonnet-5-5, name: Docs }
contributors:
  - { id: human:dosipo, name: Даниил Осипов }
  - { id: claude/opus-5-5, name: Claude Opus 5.5 }
  - { id: multica-agent/multica, name: multica-agent }
  - { id: Docs/claude-sonnet-5-5, name: Docs }
---

Эти правила нужны, чтобы страница один раз попадала во внутренний поиск (Ctrl+K), правильно подписывалась в сайдбаре и попадала в `llms.txt`. Следуйте им при создании и правке любой страницы в `content/`.

::warning
Если начать страницу с `# Заголовка` в поиске Ctrl+K снова появятся дубли страницы.
::

## Шаблон страницы

Скопируйте шаблон и заполните поля.

```md [content/<раздел>/<N>.<slug>.md]
---
title: "Полное название страницы"
description: Одно-два предложения о том, что читатель найдёт на странице.
navigation:
  title: "Короткое имя"   # только если title длинный
  icon: heroicons:document-text
type: Guide               # Guide | Reference | Playbook | Dataset | ... (с заглавной буквы)
resource: /<раздел>/<slug>
tags: [tag1, tag2]
status: draft             # draft | stable | deprecated
sources:                  # только вложения и ссылки пользователя, см. ниже
  - resource: file:<имя файла>
    title: "Название источника"
generated: { by: Имя/модель, at: "2026-11-02T10:00:00Z" }
created: "02.11.2026"
updated: "02.11.2026"
created_by: { id: Имя/модель, name: Имя }
updated_by: { id: Имя/модель, name: Имя }
contributors:
  - { id: Имя/модель, name: Имя }
---

## Первый раздел

Текст страницы.
```

## Заголовок страницы

Не начинайте страницу с `# H1`. Docus сам выводит заголовок страницы из поля `title` во frontmatter, поэтому второй H1 в тексте дублирует его и создаёт лишнюю запись в поиске.

- `title` — полное название. Оно выводится вверху страницы, попадает в поиск и в `llms.txt`.
- `navigation.title` — короткое имя для сайдбара. Задавайте его, только если `title` слишком длинный для меню.
- Текст страницы начинайте сразу с абзаца или с `## Раздела`.

```diff [content/2.instrumenty/4.n8n/2.credentials.md]
 ---
-title: Доступы (credentials)
+title: "Доступы или credentials"
 navigation:
+  title: "Доступы (credentials)"
   icon: heroicons:key
 ---

-# Доступы или credentials
-
 ## Что такое credentials?
```

## Источники (`sources`)

В `sources` попадает только то, что передал пользователь. У каждого источника есть `resource`, `title` — по желанию.

| Что передал пользователь | Значение `resource` | Пример |
|---|---|---|
| Файл во вложении | `file:<имя файла>` | `file:smeta-2026.xlsx` |
| Ссылка | полный URL `http(s)://…` | `https://github.com/Dosipo/workspace-docs` |
| Ссылка на саму базу | `internal:*` | `internal:arealdev-kb` |

```yaml [frontmatter]
sources:
  - resource: file:smeta-2026.xlsx
    title: Смета на 2026 год
  - resource: https://www.figma.com/file/abc123
    title: Макет страницы
```

::warning
Не выдумывайте источники. Если не знаете, откуда взята информация, не добавляйте запись. Ссылки, которые агент нашёл сам, во `sources` не пишите.
::

`internal:*` остаётся только в YAML и в блоке «О странице» не показывается.

## Блок «О странице»

Внизу каждой страницы компонент `OkfMetadata` выводит метаданные как список свойств: иконка, подпись, значение. Править блок вручную не нужно, он строится из frontmatter. Пустое поле строку не создаёт.

| Строка | Откуда берётся |
|---|---|
| Тип | `type` по-русски: `Guide` → «Руководство», `Reference` → «Справочник» и т. д.; неизвестное значение выводится как есть |
| Статус | `status`: `stable` — «Стабильная», `draft` — «Черновик», `deprecated` — «Устарела» |
| Создана | `created` и `created_by` |
| Изменена | `updated` и `updated_by`; скрыта, если совпадает с «Создана» |
| Проверить до | `stale_after`; за 30 дней и меньше текст оранжевый, после срока — красный |
| Источники | `sources` с `resource` вида `file:` и `http(s)://` |
| Теги | `tags` в виде `#tag` |
| Участники | `contributors`, `created_by` и `updated_by` без повторов по `id` |
| Адрес | `resource` страницы |

Поле `generated`, `internal:*` в `sources` и незнакомые ключи (например, `audience`) отдельной строкой не выводятся. Они остаются только в YAML: ссылка «Показать YAML» раскрывает все поля, кнопка «Копировать» копирует их.

Дата последней правки показывается строкой «Изменена», поэтому отдельную строку «Обновлено» в тексте страницы не пишите.

### Как отображаются участники

Вид задаёт формат `id` в `created_by`, `updated_by` и `contributors`.

| Формат `id` | Группа | Пример |
|---|---|---|
| `human:<handle>` | Люди | `human:dosipo` |
| `<vendor>/<model>`, vendor: `claude`, `anthropic`, `gpt`, `openai`, `mistral`, `llama`, `meta` | Модели, с логотипом вендора | `claude/opus-5-5` |
| `<Имя>/<платформа или модель>` | Агенты; если после `/` известная модель, рядом логотип вендора | `Docs/claude-sonnet-5-5`, `Mika/multica` |
| любой другой | Другие | `ci-bot` |

Используйте только эти форматы. Не записывайте нестандартный `id` в агенты: он попадёт в «Другие».

## Чек-лист перед PR

- [ ] Во frontmatter есть `title`, `description`, `type`, `tags`, поля авторства (`generated`, `created`, `updated`, `created_by`, `updated_by`, `contributors`).
- [ ] В тексте нет `# H1`; короткое имя для меню задано в `navigation.title`.
- [ ] `sources` содержит только вложения (`file:<имя>`) и ссылки пользователя (полный URL); `id` участников в одном из форматов выше.
- [ ] `npm run build` проходит без ошибок MDC.

Поля frontmatter следуют стандарту Open Knowledge Format (OKF): обязательны `type`, `title`, `description` и поля авторства; дату и автора записывает `generated: { by, at }` (поле `timestamp` устарело).  Поле `verified` ставит только человек. Проверка: `python3 validate.py content --profile docus` из скилла `okf-convert`.

<!-- okf:related:start -->
## Связанные материалы

- [Ключевые концепции](/nachalo-raboty/onboarding/concepts) — Как устроена работа в воркспейсе — модель, инструменты, принципы.
<!-- okf:related:end -->
