---
title: Визуализации на страницах
description: Как добавить на страницу базы знаний схему процесса, граф связей, карту, график или календарный план — блоками flow, graph, map, chart и gantt из docus-viz, текстом или из файла xlsx, csv, kml, gpx.
navigation:
  title: Визуализации
  icon: heroicons:chart-bar-square
type: Guide
resource: /nachalo-raboty/onboarding/visualizations
tags: [onboarding, authoring, visualization, diagrams, docus-viz]
status: stable
generated: { by: claude/opus-5-5, at: "2026-11-03T12:00:00Z" }
created: "03.11.2026"
updated: "03.11.2026"
created_by: { id: claude/opus-5-5, name: Claude Opus 5.5 }
updated_by: { id: claude/opus-5-5, name: Claude Opus 5.5 }
contributors:
  - { id: claude/opus-5-5, name: Claude Opus 5.5 }
sources:
  - resource: https://github.com/Dosipo/docus-viz
    title: docus-viz — визуализации для Docus
    author: Даниил Осипов
---

Схемы, карты, графики и календарные планы пишутся прямо в Markdown — блоком кода с нужным языком. Сайт превращает такой блок в интерактивную визуализацию, а под ней выводит текстовую таблицу для поиска и доступности. Блоки дают слой [docus-viz](https://github.com/Dosipo/docus-viz), подключённый к базе в `layers/docus-viz`.

::warning
Не вставляйте схемы картинками и не используйте Mermaid: такие схемы не проверяются автоматически и расходятся с текстом. Для любой визуализации — только блоки ниже.
::

## Какой блок выбрать

| Что показать | Блок |
|---|---|
| Процесс, порядок шагов, согласование | `flow` |
| Сущности и связи, архитектура, роли | `graph` |
| Точки, маршруты, расстояния | `map` |
| Числа по категориям или по времени, доли | `chart` |
| Этапы по датам, зависимости, вехи | `gantt` |

Визуализация нужна, когда элементов три и больше и между ними есть порядок или связи. Ставьте её сразу после абзаца, который её вводит, и всегда задавайте `title:`.

## Процесс

Так задача проходит доску воркспейса. Нажмите **Далее**, чтобы пройти схему по шагам.

```flow
title: Путь задачи по статусам
todo [start] Todo
  | Задача создана и назначена исполнителю.
work [actor] In Progress
  | Исполнитель делает работу и открывает PR в staging.
check [service] Ревью агентом
  | Reviewer и QA проверяют результат.
human [actor] In Review
  | Человек смотрит итог и превью.
done [end] Done
  | Сигнал на мерж PR в staging.
todo -> work : взять в работу
work -> check : сдать работу
check -> human : проверка пройдена
human -> done : принять
check ..> work : есть замечания
```

Узел — строка `id [тип] Подпись`, под ней можно добавить описание через `|`. Стрелка `->` — обычный шаг, `..>` — ветка по условию, текст после `:` — действие.

## Связи

```graph
title: Откуда берётся страница на сайте
repo [store] Репозиторий workspace-docs
  | Markdown в content/, данные в data/.
vercel [service] Vercel
  | Собирает сайт на каждый PR и мерж.
staging [external] Предпрод
  | workspace-docs-staging.vercel.app
prod [external] Прод
  | Обновляется только релизом staging → main.
repo -> vercel : PR и мерж
vercel -> staging : ветка staging
vercel -> prod : ветка main
```

## График

Данные можно написать таблицей прямо в блоке или взять из файла.

```chart
title: Страницы по разделам (на 3 ноября 2026)
type: hbar
unit: стр.
Раздел | Страниц
Начало работы | 7
Инструменты | 31
Практики | 3
Справочник | 2
```

## Данные из файла

Если данные уже лежат в таблице или файле геометрии, не перепечатывайте их. Положите копию в папку `data/` в корне репозитория и сошлитесь на неё:

````md
```chart {src=budget-2026.xlsx sheet="Бюджет 2026"}
title: План и факт
type: bar
y: План, Факт
unit: тыс. руб.
```
````

Поддерживаются `csv`, `tsv`, `xlsx`, `json`, `geojson`, `kml`, `kmz`, `gpx`. Файл читается при сборке, поэтому цифры на странице всегда совпадают с источником.

::caution
База знаний публичная: файлы из `data/` видны на GitHub, а их содержимое попадает на страницу. Не кладите туда персональные данные, коммерческие цифры и координаты закрытых объектов.
::

## Проверка перед PR

- [ ] `npm run viz:check` — в итоговой строке `0 error(s) · 0 warning(s)`.
- [ ] `npm run build` проходит.
- [ ] На превью нет красных блоков ошибки визуализации.

Полный синтаксис всех блоков, включая карты и календарные планы, — в [справочнике docus-viz](https://github.com/Dosipo/docus-viz/blob/master/skills/docs-from-sources/references/blocks.md).

<!-- okf:related:start -->
## Связанные материалы

- [Правила оформления страниц](/nachalo-raboty/onboarding/authoring) — шаблон страницы, frontmatter и блок «О странице».
- [Ключевые концепции](/nachalo-raboty/onboarding/concepts) — как устроена работа в воркспейсе.
<!-- okf:related:end -->
