<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge } from '@vue-flow/core'

// Edge routed by dagre: follows the layout's bend points instead of a generic smoothstep,
// so back-edges (cycles) and labels don't collide with nodes.
const props = defineProps<{
  id: string
  label?: string
  markerEnd?: string
  data: { points: { x: number, y: number }[], labelPos?: { x: number, y: number }, domId?: string }
}>()

function roundedPath(raw: { x: number, y: number }[], r = 10) {
  // dagre repeats bend points for self-loops; zero-length segments would yield NaN
  const pts = raw.filter((p, i) => i === 0 || p.x !== raw[i - 1]!.x || p.y !== raw[i - 1]!.y)
  if (pts.length < 2) return ''
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1]!, p1 = pts[i]!, p2 = pts[i + 1]!
    const d1 = Math.hypot(p1.x - p0.x, p1.y - p0.y)
    const d2 = Math.hypot(p2.x - p1.x, p2.y - p1.y)
    if (!d1 || !d2) { d += ` L ${p1.x} ${p1.y}`; continue }
    const rr = Math.min(r, d1 / 2, d2 / 2)
    const a = { x: p1.x - ((p1.x - p0.x) / d1) * rr, y: p1.y - ((p1.y - p0.y) / d1) * rr }
    const b = { x: p1.x + ((p2.x - p1.x) / d2) * rr, y: p1.y + ((p2.y - p1.y) / d2) * rr }
    d += ` L ${a.x} ${a.y} Q ${p1.x} ${p1.y} ${b.x} ${b.y}`
  }
  const last = pts[pts.length - 1]!
  return `${d} L ${last.x} ${last.y}`
}

const path = computed(() => roundedPath(props.data.points))
</script>

<template>
  <BaseEdge
    :id="props.data.domId ?? props.id"
    :path="path"
    :marker-end="props.markerEnd"
    :label="props.label"
    :label-x="props.data.labelPos?.x"
    :label-y="props.data.labelPos?.y"
    :label-bg-padding="[6, 3]"
    :label-bg-border-radius="4"
  />
</template>
