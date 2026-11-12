---
title: Узлы, рёбра, хэндлы и стили Vue Flow
description: Справочник по типам узлов и рёбер, правилам хэндлов и CSS-переменным Vue Flow.
type: Reference
resource: /instrumenty/vue-flow/nodes-edges-reference
tags: [vue-flow, docus-viz, diagrams]
status: draft
sources:
  - { resource: https://vueflow.dev/guide/node.html, title: Узлы }
  - { resource: https://vueflow.dev/guide/edge.html, title: Рёбра }
  - { resource: https://vueflow.dev/guide/handle.html, title: Хэндлы }
  - { resource: https://vueflow.dev/guide/theming.html, title: Темизация }
generated: { by: Author/claude-sonnet-5-5, at: "2026-11-12T11:14:03Z" }
created: "12.11.2026"
updated: "12.11.2026"
created_by: { id: Author/claude-sonnet-5-5, name: Автор знаний }
updated_by: { id: Author/claude-sonnet-5-5, name: Автор знаний }
contributors:
  - { id: Author/claude-sonnet-5-5, name: Автор знаний }
---

## Типы узлов и рёбер

| Элемент | Тип | Смысл |
|---|---|---|
| Узел | `default` | два хэндла, тип по умолчанию |
| Узел | `input` | один исходящий хэндл, начало графа |
| Узел | `output` | один входящий хэндл, конец графа |
| Ребро | `default` | кривая безье |
| Ребро | `step` | ломаная |
| Ребро | `smoothstep` | ломаная со скруглёнными углами |
| Ребро | `straight` | прямая |

Собственный тип подключается слотом `#node-<тип>` или `#edge-<тип>`, либо объектом `nodeTypes` / `edgeTypes` с компонентами в `markRaw`. Порядок поиска: объект в состоянии, глобальный компонент с тем же именем, слот, тип по умолчанию.

## Хэндлы

| Правило | Значение |
|---|---|
| Компонент | `<Handle>` из `@vue-flow/core`, только внутри кастомного узла |
| Позиции | `Top`, `Right`, `Bottom`, `Left` |
| Несколько хэндлов одного типа | у каждого уникальный `id` |
| Скрыть хэндл | `opacity: 0`, не `v-if` и не `v-show` |
| Режим соединения | `ConnectionMode.Loose` по умолчанию, `ConnectionMode.Strict` — только исходящий к входящему |

## CSS-переменные

| Переменная | Что задаёт | По умолчанию |
|---|---|---|
| `--vf-node-bg` | фон узла | `#fff` |
| `--vf-node-text` | цвет текста узла | `#222` |
| `--vf-connection-path` | цвет линии соединения | `#b1b1b7` |
| `--vf-handle` | цвет хэндла | `#555` |
| `--vf-node-color` | рамка, тень и хэндлы узла | не указано |
| `--vf-box-shadow` | цвет тени узла | не указано |

У пользовательских типов стилей по умолчанию нет: стилизуйте класс `.vue-flow__node-<тип>`. Классы `nodrag` и `nowheel` на элементе внутри узла отключают перетаскивание узла и масштабирование колесом.
