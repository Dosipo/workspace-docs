---
title: Ошибки Vue Flow
description: Коды ошибок Vue Flow для узлов и рёбер, их причины и способы исправления.
type: Reference
resource: /instrumenty/vue-flow/vue-flow-errors
tags: [vue-flow, docus-viz, diagrams]
status: draft
sources:
  - { resource: https://vueflow.dev/guide/troubleshooting.html, title: Устранение ошибок }
generated: { by: Author/claude-sonnet-5-5, at: "2026-11-12T11:14:03Z" }
created: "12.11.2026"
updated: "12.11.2026"
created_by: { id: Author/claude-sonnet-5-5, name: Автор знаний }
updated_by: { id: Author/claude-sonnet-5-5, name: Автор знаний }
contributors:
  - { id: Author/claude-sonnet-5-5, name: Автор знаний }
---

## Узлы

| Код | Причина | Что сделать |
|---|---|---|
| `MISSING_VIEWPORT_DIMENSIONS` | у родителя нет размеров | задать родителю ширину и высоту |
| `NODE_INVALID` | не хватает обязательных полей | проверить `id` и `position` |
| `NODE_NOT_FOUND` | `useNode` вызван вне узла, узла нет | проверить, что узел существует |
| `NODE_MISSING_PARENT` | у вложенного узла нет родителя | создать родителя раньше и указать `parentNode` |
| `NODE_TYPE_MISSING` | у типа нет компонента | описать компонент для каждого типа |
| `NODE_EXTENT_INVALID` | родительская область у узла без родителя | использовать только у дочерних узлов |

## Рёбра

| Код | Причина | Что сделать |
|---|---|---|
| `EDGE_INVALID` | нет `source` или `target` | задать оба |
| `EDGE_NOT_FOUND` | `useEdge` вызван вне ребра, ребра нет | проверить, что ребро существует |
| `EDGE_SOURCE_MISSING`, `EDGE_TARGET_MISSING` | нет начального или конечного узла | проверить оба узла |
| `EDGE_TYPE_MISSING` | у типа нет компонента | описать компонент для каждого типа |
| `EDGE_SOURCE_TARGET_SAME` | начало и конец — один узел | допустимо, если задумано |
| `EDGE_SOURCE_TARGET_MISSING` | нет обоих узлов | проверить оба узла |
| `EDGE_ORPHANED` | ребро потеряло узел, часто после удаления | удалять рёбра раньше узлов |

## Как увидеть ошибки

В разработке Vue Flow пишет предупреждения в консоль, в продакшене они подавлены. Свой обработчик — `onError` вместе с `isErrorOfType` и перечислением `ErrorCode`.
