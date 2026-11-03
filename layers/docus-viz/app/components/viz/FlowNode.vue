<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { FlowNodeKind } from '../../../shared/flow-dsl'

const props = defineProps<{
  data: {
    label: string
    kind: FlowNodeKind
    state: 'idle' | 'active' | 'neighbor' | 'dim' | 'done'
    hint?: boolean
    sourcePosition: Position
    targetPosition: Position
  }
}>()

const ICONS: Record<FlowNodeKind, string | undefined> = {
  default: undefined,
  actor: 'i-lucide-user',
  service: 'i-lucide-server',
  store: 'i-lucide-database',
  queue: 'i-lucide-layers',
  external: 'i-lucide-globe',
  event: 'i-lucide-zap',
  decision: 'i-lucide-git-branch',
  start: 'i-lucide-play',
  end: 'i-lucide-flag',
}
</script>

<template>
  <div class="flow-node" :class="[`is-${props.data.state}`, `kind-${props.data.kind}`]">
    <Handle type="target" :position="props.data.targetPosition" class="flow-handle" />
    <span v-if="props.data.hint" class="flow-hint">Click ↓</span>
    <UIcon v-if="ICONS[props.data.kind]" :name="ICONS[props.data.kind]!" class="flow-node-icon" />
    <span>{{ props.data.label }}</span>
    <Handle type="source" :position="props.data.sourcePosition" class="flow-handle" />
  </div>
</template>
