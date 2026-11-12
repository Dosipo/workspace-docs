---
title: Что такое Vue Flow
description: Что умеет библиотека Vue Flow, из чего состоит граф и где она нужна авторам базы.
type: Overview
resource: /instrumenty/vue-flow/what-is-vue-flow
tags: [vue-flow, docus-viz, diagrams]
status: draft
sources:
  - { resource: https://vueflow.dev/, title: Главная Vue Flow }
  - { resource: https://vueflow.dev/guide/, title: Введение }
generated: { by: okf-link/1.0, at: "2026-11-12T11:14:13Z" }
created: "12.11.2026"
updated: "12.11.2026"
created_by: { id: Author/claude-sonnet-5-5, name: Автор знаний }
updated_by: { id: okf-link/1.0, name: okf-link }
contributors:
  - { id: Author/claude-sonnet-5-5, name: Автор знаний }
  - { id: okf-link/1.0, name: okf-link }
---

<!-- okf:meta:start -->
*Создано: 12.11.2026 · Обновлено: 12.11.2026 · Автор: Автор знаний · Обновил: okf-link · Участники: Автор знаний, okf-link*
<!-- okf:meta:end -->

## Что это

Vue Flow — библиотека для Vue 3, которая строит интерактивные графы из узлов и рёбер. Главная страница проекта описывает её как перенос возможностей React Flow в Vue. Версия на 12.11.2026 — v1.48.2, лицензия MIT.

## Что есть из коробки

- масштаб и панорама, выделение одного и нескольких элементов, перетаскивание;
- свои типы узлов и рёбер, обработчики событий;
- вложенные узлы и графы;
- компоненты Background, MiniMap, Controls, NodeToolbar и NodeResizer;
- типы TypeScript в комплекте;
- работа с клавиатуры: Enter или Space выделяет узел, стрелки двигают, Delete удаляет, Escape снимает выделение.

## Из чего состоит граф

Граф — это узлы и рёбра. У каждого уникальный `id`. Узел имеет позицию XY, ребро — `source` и `target` с `id` узлов. Рёбра цепляются к узлам через хэндлы.

## Что делать авторам страниц

Код Vue Flow писать не нужно: схемы на страницах задаются блоками docus-viz, их описывает страница [«Визуализации на страницах»](/nachalo-raboty/onboarding/visualizations).

<!-- okf:related:start -->
## Связанные материалы

- [Визуализации на страницах](/nachalo-raboty/onboarding/visualizations) — Как добавить на страницу схему, граф, карту, график или календарный план блоками docus-viz — текстом или из файла xlsx, csv, kml, gpx.
<!-- okf:related:end -->
