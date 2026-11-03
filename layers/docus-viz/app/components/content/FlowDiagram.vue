<script setup lang="ts">
import { computed, ref, watch, markRaw, useTemplateRef, onBeforeUnmount, onMounted } from 'vue'
import { VueFlow, Position, MarkerType, useVueFlow } from '@vue-flow/core'
import type { Node, Edge } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import dagre from '@dagrejs/dagre'
import { parseFlow, applyOverrides, tableToFlowDsl } from '../../../shared/flow-dsl'
import type { FlowDocument, FlowEdge } from '../../../shared/flow-dsl'
import FlowNodeView from '../viz/FlowNode.vue'
import FlowGroupView from '../viz/FlowGroup.vue'
import FlowEdgeView from '../viz/FlowEdge.vue'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/controls/dist/style.css'
import '../../assets/flow-diagram.css'

const props = withDefaults(defineProps<{
  code?: string
  data?: string
  srcError?: string
  lang?: string
  title?: string
  mode?: string
  direction?: string
  height?: string | number
}>(), {})

const doc = computed<FlowDocument>(() => {
  // table from `src=` → DSL lines; the block body can add title, kinds, descriptions, more edges
  let src: any
  try { src = props.data ? JSON.parse(props.data) : undefined } catch {}
  const fromTable = tableToFlowDsl(src)
  const d = applyOverrides(parseFlow([fromTable.dsl, props.code ?? ''].filter(Boolean).join('\n')), props)
  if (props.srcError) d.errors.unshift({ line: 0, message: props.srcError })
  if (fromTable.error) d.errors.unshift({ line: 0, message: fromTable.error })
  if (fromTable.dsl) d.errors.forEach(e => { if (e.line) e.message = `${e.message} (line counted with ${fromTable.dsl.split('\n').length} generated lines from src first)` })
  return d
})

const isFlow = computed(() => doc.value.mode === 'flow')
const nodeTypes = { flow: markRaw(FlowNodeView), cluster: markRaw(FlowGroupView) } as any
const edgeTypes = { routed: markRaw(FlowEdgeView) } as any
const flowId = `flow-${useId()}`
const { fitView } = useVueFlow(flowId)

// --- Layout (dagre) -------------------------------------------------------
const NODE_H = 40
const CANVAS_W = 700 // approx. prose column width the diagram must fit into
// Measure labels with the page font on the client (Cyrillic/CJK are much wider than Latin);
// fall back to a conservative per-char estimate during SSR.
let measureCtx: CanvasRenderingContext2D | null | undefined
const mounted = ref(false)
onMounted(() => { mounted.value = true })
function textWidth(text: string, size: number, weight = 500) {
  if (!mounted.value) return text.length * size * 0.62
  if (measureCtx === undefined) {
    measureCtx = document.createElement('canvas').getContext('2d')
  }
  if (measureCtx) {
    const family = getComputedStyle(document.body).fontFamily || 'sans-serif'
    measureCtx.font = `${weight} ${size}px ${family}`
    return measureCtx.measureText(text).width
  }
  return text.length * size * 0.62
}
const estimateWidth = (label: string, kind: string) =>
  Math.ceil(Math.max(96, textWidth(label, 14) + 30 + (kind === 'default' ? 0 : 22) + (kind === 'decision' ? 8 : 0)))

type Pt = { x: number, y: number }
type Box = Pt & { w: number, h: number }

function runDagre(d: FlowDocument, dir: FlowDocument['direction']) {
  const g = new dagre.graphlib.Graph({ compound: true, multigraph: true })
  const horizontal = dir === 'LR' || dir === 'RL'
  g.setGraph({ rankdir: dir, nodesep: horizontal ? 32 : 56, ranksep: horizontal ? 80 : 64, edgesep: 24, marginx: 28, marginy: 28 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const grp of d.groups) g.setNode(grp.id, { label: grp.label, paddingTop: 36, paddingLeft: 16, paddingRight: 16, paddingBottom: 16 })
  for (const n of d.nodes) {
    g.setNode(n.id, { width: estimateWidth(n.label, n.kind), height: NODE_H })
    if (n.group) g.setParent(n.id, n.group)
  }
  for (const e of d.edges) {
    g.setEdge(e.source, e.target, {
      width: e.label ? textWidth(e.label, 11, 400) + 14 : 0,
      height: e.label ? 20 : 0,
      labelpos: 'c',
    }, e.id)
  }
  dagre.layout(g)

  const boxes: Record<string, Box> = {}
  for (const id of g.nodes()) {
    const n = g.node(id)
    if (n?.width) boxes[id] = { x: n.x - n.width / 2, y: n.y - n.height / 2, w: n.width, h: n.height }
  }
  const routes: Record<string, { points: Pt[], labelPos?: Pt }> = {}
  for (const e of d.edges) {
    const r = g.edge({ v: e.source, w: e.target, name: e.id })
    if (e.source === e.target) {
      // dagre's self-loop points are awkward to draw; route a loop off the node's right/top-right corner
      const n = g.node(e.source)
      if (!n) continue
      const x = n.x + n.width / 2, y = n.y
      const top = n.y - n.height / 2
      routes[e.id] = {
        points: [{ x, y }, { x: x + 28, y }, { x: x + 28, y: top - 18 }, { x: n.x + n.width / 4, y: top - 18 }, { x: n.x + n.width / 4, y: top }],
        labelPos: { x: x + 28 + (e.label ? textWidth(e.label, 11, 400) / 2 + 8 : 0), y: top - 2 },
      }
    }
    else if (r) routes[e.id] = { points: r.points ?? [], labelPos: r.x !== undefined ? { x: r.x, y: r.y } : undefined }
  }
  const all = Object.values(boxes)
  const width = all.length ? Math.max(...all.map(b => b.x + b.w)) - Math.min(...all.map(b => b.x)) : 1
  const height = all.length ? Math.max(...all.map(b => b.y + b.h)) - Math.min(...all.map(b => b.y)) : 1
  return { boxes, routes, width, height, direction: dir }
}

const layoutError = ref<string | null>(null)
const EMPTY_LAYOUT = { boxes: {} as Record<string, Box>, routes: {} as Record<string, { points: Pt[], labelPos?: Pt }>, width: 1, height: 1, direction: 'LR' as const }

const layout = computed(() => {
  const d = doc.value
  layoutError.value = null
  if (!d.nodes.length) return EMPTY_LAYOUT
  try {
    return pickLayout(d)
  }
  catch (e) {
    layoutError.value = `Layout failed: ${(e as Error).message}`
    return EMPTY_LAYOUT
  }
})

function pickLayout(d: FlowDocument) {
  if (d.directionSet) return runDagre(d, d.direction)
  // Auto: choose the orientation that renders largest in the prose column,
  // preferring LR for short chains (reads like a sentence).
  const lr = runDagre(d, 'LR')
  const tb = runDagre(d, 'TB')
  const scale = (l: { width: number, height: number }) => Math.min(1.2, CANVAS_W / l.width, 520 / l.height)
  return scale(lr) >= scale(tb) * 0.9 ? lr : tb
}

const canRender = computed(() => !layoutError.value && Object.keys(layout.value.boxes).length > 0)

// --- Interaction state ----------------------------------------------------
const active = ref<string | null>(null)
const step = ref(0) // flow mode: number of edges revealed

const tourEdges = computed<FlowEdge[]>(() => [...doc.value.edges].sort((a, b) => a.step - b.step))
const currentEdge = computed(() => (isFlow.value && step.value > 0 ? tourEdges.value[step.value - 1] : undefined))
const hasTour = computed(() => isFlow.value && tourEdges.value.length > 0)
const finished = computed(() => hasTour.value && step.value >= tourEdges.value.length)
const nextEdge = computed(() => (hasTour.value ? tourEdges.value[step.value] : undefined))

const neighbors = computed(() => {
  const s = new Set<string>()
  if (!active.value) return s
  for (const e of doc.value.edges) {
    if (e.source === active.value) s.add(e.target)
    if (e.target === active.value) s.add(e.source)
  }
  return s
})

// Node the user should click next in flow mode
// The tour advances when the user clicks the target of the next edge; for the first step,
// or when the next edge doesn't continue from where we are (fan-out / new branch), the source.
const hintNode = computed(() => {
  const next = nextEdge.value
  if (!next) return null
  if (step.value === 0) return next.source
  const here = currentEdge.value?.target
  return here === next.source || active.value === next.source ? next.target : next.source
})

const revealed = computed(() => {
  const s = new Set<string>()
  if (!isFlow.value) return s
  tourEdges.value.slice(0, step.value).forEach((e) => { s.add(e.source); s.add(e.target) })
  if (step.value === 0 && tourEdges.value[0]) s.add(tourEdges.value[0].source)
  return s
})

function nodeState(id: string) {
  if (isFlow.value) {
    if (step.value === 0 && !active.value) return 'idle'
    if (id === active.value) return 'active'
    if (currentEdge.value && (currentEdge.value.source === id || currentEdge.value.target === id)) return 'neighbor'
    if (revealed.value.has(id) || id === hintNode.value) return 'done'
    return 'dim'
  }
  if (!active.value) return 'idle'
  if (id === active.value) return 'active'
  if (neighbors.value.has(id)) return 'neighbor'
  return 'dim'
}

function edgeState(e: FlowEdge) {
  if (isFlow.value) {
    if (step.value === 0) return 'idle'
    if (currentEdge.value?.id === e.id) return 'active'
    if (e.step <= step.value) return 'done'
    return 'dim'
  }
  if (!active.value) return 'idle'
  return e.source === active.value || e.target === active.value ? 'active' : 'dim'
}

// --- Vue Flow elements ----------------------------------------------------
const nodes = computed<Node[]>(() => {
  const { boxes, direction } = layout.value
  const sourcePosition = { LR: Position.Right, RL: Position.Left, TB: Position.Bottom, BT: Position.Top }[direction]
  const targetPosition = { LR: Position.Left, RL: Position.Right, TB: Position.Top, BT: Position.Bottom }[direction]
  const groupNodes: Node[] = doc.value.groups.filter(g => boxes[g.id]).map(g => ({
    id: g.id,
    type: 'cluster',
    position: { x: boxes[g.id]!.x, y: boxes[g.id]!.y },
    data: { label: g.label },
    style: { width: `${boxes[g.id]!.w}px`, height: `${boxes[g.id]!.h}px` },
    selectable: false,
    draggable: false,
    focusable: false,
    zIndex: -1,
  }))
  const regular = doc.value.nodes.map((n): Node | null => {
    const p = boxes[n.id]
    if (!p) return null
    return {
      id: n.id,
      type: 'flow',
      position: { x: p.x, y: p.y },
      style: { width: `${p.w}px` },
      data: {
        label: n.label,
        kind: n.kind,
        state: nodeState(n.id),
        hint: hintNode.value === n.id,
        sourcePosition,
        targetPosition,
      },
      draggable: false,
      connectable: false,
    }
  })
  return [...groupNodes, ...(regular.filter(Boolean) as Node[])]
})

const edges = computed<Edge[]>(() => doc.value.edges.map((e) => {
  const state = edgeState(e)
  const color = state === 'active' || state === 'done' ? 'var(--ui-primary)' : 'var(--ui-border-accented)'
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'routed',
    label: e.label,
    data: { ...(layout.value.routes[e.id] ?? { points: [] }), domId: `${flowId}-${e.id}` },
    animated: state === 'active' && e.style !== 'solid',
    class: ['flow-edge', `is-${state}`, `style-${e.style}`],
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
  }
}))

// --- Detail panel ---------------------------------------------------------
const nodeById = computed(() => Object.fromEntries(doc.value.nodes.map(n => [n.id, n])))
const activeNode = computed(() => (active.value ? nodeById.value[active.value] : undefined))

const activeRelations = computed(() => {
  if (!active.value) return []
  return doc.value.edges
    .filter(e => e.source === active.value || e.target === active.value)
    .map((e) => {
      const outgoing = e.source === active.value
      const other = nodeById.value[outgoing ? e.target : e.source]!.label
      return { id: e.id, outgoing, other, label: e.label, style: e.style }
    })
})

const footer = computed(() => {
  const label = (id?: string | null) => (id ? nodeById.value[id]?.label : '')
  if (hasTour.value) {
    if (step.value === 0) return `Click ${label(hintNode.value)} to start the walkthrough.`
    const e = currentEdge.value!
    const what = e.label ? `${label(e.source)} → ${label(e.target)}: ${e.label}.` : `${label(e.source)} → ${label(e.target)}.`
    const tail = finished.value ? ' Done — click any node to explore, or Replay.' : ` Next, click ${label(hintNode.value)}.`
    return `Step ${step.value}/${tourEdges.value.length} · ${what}${tail}`
  }
  if (!activeNode.value) return 'Click any node to see how it connects.'
  const names = [...neighbors.value].map(id => label(id)).join(', ')
  return `${activeNode.value.label} connects directly to ${names || 'nothing'}.`
})

function onNodeClick({ node }: { node: Node }) {
  if (node.type === 'cluster') return
  if (hasTour.value && node.id === hintNode.value) {
    const next = nextEdge.value!
    // clicking a new branch's source only selects it; clicking a target advances
    if (step.value === 0 || node.id === next.target) step.value++
  }
  active.value = node.id
}

function next() {
  if (!hasTour.value || finished.value) return
  step.value++
  active.value = currentEdge.value?.target ?? null
}

function replay() {
  step.value = 0
  active.value = null
  fitView({ padding: 0.15, maxZoom: 1.2, duration: 300 })
}

watch(() => props.code, replay)

// Refit when the canvas gets a real size (e.g. diagram inside an inactive tab) or resizes.
const canvasEl = useTemplateRef<HTMLElement>('canvas')
let lastSize = ''
let observer: ResizeObserver | undefined
watch(canvasEl, (el) => {
  observer?.disconnect()
  if (!el || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry!.contentRect
    if (!width || !height) return
    const size = `${Math.round(width)}x${Math.round(height)}`
    if (size === lastSize) return
    lastSize = size
    fitView({ padding: 0.15, maxZoom: 1.2 })
  })
  observer.observe(el)
})
onBeforeUnmount(() => observer?.disconnect())

const heightPx = computed(() => {
  if (props.height) return typeof props.height === 'number' || /^\d+$/.test(String(props.height)) ? `${props.height}px` : String(props.height)
  const { width, height } = layout.value
  const scale = Math.min(1.2, CANVAS_W / width)
  return `${Math.round(Math.min(720, Math.max(220, height * scale + 40)))}px`
})
</script>

<template>
  <div class="flow-diagram not-prose">
    <div class="flow-diagram__header">
      <span class="flow-diagram__badge">{{ isFlow ? 'Walkthrough' : 'Try it' }}</span>
      <span class="flow-diagram__title">{{ doc.title || (isFlow ? 'How it works, step by step' : 'How the pieces relate') }}</span>
      <div class="flow-diagram__actions">
        <UButton v-if="hasTour && !finished" icon="i-lucide-step-forward" label="Next" variant="ghost" color="neutral" size="xs" @click="next" />
        <UButton v-if="canRender" icon="i-lucide-rotate-ccw" label="Replay" variant="ghost" color="neutral" size="xs" @click="replay" />
      </div>
    </div>

    <div v-if="doc.errors.length || layoutError" class="flow-diagram__errors">
      <p v-for="(err, i) in doc.errors" :key="i">
        <UIcon name="i-lucide-triangle-alert" /> {{ err.line ? `Line ${err.line}: ` : '' }}{{ err.message }}
      </p>
      <p v-if="layoutError">
        <UIcon name="i-lucide-triangle-alert" /> {{ layoutError }}
      </p>
    </div>

    <ClientOnly v-if="canRender">
      <div ref="canvas" class="flow-diagram__canvas" :style="{ height: heightPx }">
        <VueFlow
          :id="flowId"
          :nodes="nodes"
          :edges="edges"
          :node-types="nodeTypes"
          :edge-types="edgeTypes"
          :nodes-draggable="false"
          :nodes-connectable="false"
          :elements-selectable="false"
          :zoom-on-scroll="false"
          :prevent-scrolling="false"
          :min-zoom="0.3"
          :max-zoom="1.75"
          fit-view-on-init
          :fit-view-params="{ padding: 0.15, maxZoom: 1.2 }"
          @node-click="onNodeClick"
        >
          <Controls :show-interactive="false" position="bottom-right" />
        </VueFlow>
      </div>
      <template #fallback>
        <div class="flow-diagram__canvas flow-diagram__skeleton" :style="{ height: heightPx }" />
      </template>
    </ClientOnly>

    <Transition name="flow-fade" mode="out-in">
      <div v-if="activeNode" :key="activeNode.id" class="flow-diagram__card">
        <p class="flow-diagram__card-title">{{ activeNode.label }}</p>
        <p v-if="activeNode.description" class="flow-diagram__card-desc">{{ activeNode.description }}</p>
        <ul v-if="activeRelations.length" class="flow-diagram__relations">
          <li v-for="r in activeRelations" :key="r.id">
            <UIcon :name="r.outgoing ? 'i-lucide-corner-down-right' : 'i-lucide-corner-left-up'" class="flow-diagram__rel-icon" />
            <span>
              <template v-if="r.outgoing">→ <b>{{ r.other }}</b></template>
              <template v-else>← <b>{{ r.other }}</b></template>
              <template v-if="r.label">: {{ r.label }}</template>
              <em v-if="r.style === 'dashed'"> (async)</em>
              <em v-else-if="r.style === 'dotted'"> (optional)</em>
            </span>
          </li>
        </ul>
        <p v-if="activeNode.link" class="flow-diagram__card-link">
          See <ULink :to="activeNode.link">{{ activeNode.link }}</ULink>
        </p>
      </div>
    </Transition>

    <div v-if="canRender" class="flow-diagram__footer">{{ footer }}</div>

    <!-- Accessible text alternative, also what search/LLMs index -->
    <details v-if="tourEdges.length" class="flow-diagram__source">
      <summary>Text version</summary>
      <ol>
        <li v-for="e in tourEdges" :key="e.id">
          {{ nodeById[e.source]?.label }} → {{ nodeById[e.target]?.label }}<template v-if="e.label">: {{ e.label }}</template>
        </li>
      </ol>
    </details>
  </div>
</template>
