---
title: Правила оформления страниц
description: Как оформить страницу базы знаний — frontmatter, заголовок без H1, короткое имя в сайдбаре через navigation.title и строка обновления через :page-updated. Шаблон новой страницы.
navigation:
  title: Оформление страниц
  icon: heroicons:pencil-square
type: guide
resource: /nachalo-raboty/onboarding/authoring
tags: [onboarding, authoring, frontmatter, mdc, search, okf, template]
generated: human-authored
status: current
timestamp: "2026-11-02T00:00:00Z"
---

Эти правила нужны, чтобы страница один раз попадала во внутренний поиск (Ctrl+K), правильно подписывалась в сайдбаре и попадала в `llms.txt`. Следуйте им при создании и правке любой страницы в `content/`. Формат frontmatter основан на [Open Knowledge Format](/spravochnik/okf).

::warning
Если начать страницу с `# Заголовка` или написать строку обновления обычным текстом, в поиске Ctrl+K снова появятся дубли страницы.
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
type: guide               # guide | reference | index | ...
resource: /<раздел>/<slug>
tags: [tag1, tag2]
generated: human-authored
status: current
timestamp: "2026-11-02T00:00:00Z"
---

:page-updated{date="2 ноября 2026" author="Имя"}

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

## Строка «Обновлено»

Дату обновления и автора указывайте компонентом `:page-updated`, а не текстом. Компонент получает данные через атрибуты, поэтому строка видна на странице, но не попадает в поисковый индекс и сниппеты Ctrl+K.

```md
:page-updated{date="30.10.2026" author="Алсу"}
```

::field-group
:::field{name="date" type="string" required}
Дата обновления в любом читаемом формате, например `30.10.2026` или `29 июня 2026`.
:::

:::field{name="author" type="string"}
Кто обновил страницу. Если автор не указан, выводится только дата.
:::
::

Ставьте строку сразу после frontmatter, перед первым разделом.

```diff [content/1.nachalo-raboty/2.obzor.md]
-*Обновлено: 30.10.2026 · Алсу*
+:page-updated{date="30.10.2026" author="Алсу"}
```

## Чек-лист перед PR

- [ ] Во frontmatter есть `title`, `description`, `type`, `tags`, `timestamp`.
- [ ] В тексте нет `# H1`; короткое имя для меню задано в `navigation.title`.
- [ ] Строка обновления оформлена как `:page-updated{...}`.
- [ ] `npm run build` проходит без ошибок MDC.

Поля frontmatter следуют стандарту Open Knowledge Format (OKF): `type`, `title`, `description`, `tags` и `timestamp` обязательны, источники перечисляются в `sources`.
