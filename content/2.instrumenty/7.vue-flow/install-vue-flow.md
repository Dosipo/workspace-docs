---
title: Как подключить Vue Flow и нарисовать граф
description: Установка Vue Flow, подключение стилей и минимальный граф из узлов и рёбер.
type: Guide
resource: /instrumenty/vue-flow/install-vue-flow
tags: [vue-flow, docus-viz, diagrams]
status: draft
sources:
  - { resource: https://vueflow.dev/guide/getting-started.html, title: Начало работы }
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

## Предусловия

- Node.js v20 или выше.
- Vue 3.3 или выше.

## Шаги

1. Установите пакет одной из команд: `npm add @vue-flow/core`, `pnpm add @vue-flow/core` или `yarn add @vue-flow/core`.
2. Подключите обязательные стили: `@import '@vue-flow/core/dist/style.css';`.
3. По желанию подключите тему по умолчанию: `@import '@vue-flow/core/dist/theme-default.css';`.
4. Импортируйте `VueFlow` из `@vue-flow/core`.
5. Задайте `nodes` и `edges` как реактивные `ref`-массивы:
   - узел: `id`, `position` с `x` и `y`, при желании `type` и `data.label`;
   - ребро: `id`, `source`, `target`.
6. Выведите граф: `<VueFlow :nodes="nodes" :edges="edges" />`.
7. Дайте родительскому элементу ширину и высоту, иначе граф не нарисуется.

## Результат

На экране граф, который можно двигать, масштабировать и выделять. Тип узла `default` показывает `data.label`; `animated: true` на ребре анимирует его.

## Если не получилось

Причины и решения по кодам ошибок — на странице [«Ошибки Vue Flow»](/instrumenty/vue-flow/vue-flow-errors).

<!-- okf:related:start -->
## Связанные материалы

- [Ошибки Vue Flow](/instrumenty/vue-flow/vue-flow-errors) — Коды ошибок Vue Flow для узлов и рёбер, их причины и способы исправления.
<!-- okf:related:end -->
