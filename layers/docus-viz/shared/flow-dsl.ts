/**
 * Flow DSL — a tiny text language for process / service diagrams.
 *
 *   title: Assigning an issue to an agent
 *   direction: LR                       # LR | TB | RL | BT (omit to auto-pick the best fit)
 *   mode: flow                          # flow (step tour) | graph (free exploration)
 *
 *   # Node declarations are optional; undeclared nodes are created on first use.
 *   user [actor] User                   # [kind] Label
 *   api [service] API Gateway
 *     | Validates the JWT and routes the request.   # description lines start with "|"
 *   db [store] Postgres
 *
 *   group Backend: api, worker, db      # visual cluster
 *   link api: /reference/api            # "See …" link in the detail card
 *
 *   user -> api : POST /issues          # solid edge with label ("a -> b: label" also works)
 *   api -> db : insert
 *   api --> worker : enqueue job        # dashed edge (async / event)
 *   worker ..> user : notify            # dotted edge (optional / feedback)
 *   a -> b -> c                         # chains are allowed
 *
 * Comments: a line starting with `#`, or `#` preceded by two+ spaces. A single
 * space before `#` keeps it as text (`issue #42`); `\#` is always a literal `#`.
 * Ids may use any letters (incl. Cyrillic), digits, `_`, `-`, `.`.
 *
 * In `flow` mode, the order of edges is the order of steps in the tour.
 */

export type FlowDirection = 'LR' | 'TB' | 'RL' | 'BT'
export type FlowMode = 'flow' | 'graph'
export type FlowEdgeStyle = 'solid' | 'dashed' | 'dotted'

export const FLOW_NODE_KINDS = [
  'default', 'actor', 'service', 'store', 'queue', 'external', 'event', 'decision', 'start', 'end',
] as const
export type FlowNodeKind = typeof FLOW_NODE_KINDS[number]

export interface FlowNode {
  id: string
  label: string
  kind: FlowNodeKind
  description?: string
  link?: string
  group?: string
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  label?: string
  style: FlowEdgeStyle
  step: number
}

export interface FlowGroup {
  /** Always contains ":" so it can never collide with a node id. */
  id: string
  label: string
  members: string[]
}

export interface FlowDocument {
  title?: string
  direction: FlowDirection
  /** false when the author didn't write `direction:` — the renderer then picks the best fit */
  directionSet: boolean
  mode: FlowMode
  nodes: FlowNode[]
  edges: FlowEdge[]
  groups: FlowGroup[]
  errors: FlowError[]
  warnings: FlowError[]
}

export interface FlowError {
  line: number
  message: string
}

const ID = '[\\p{L}\\p{N}_.-]+'
const ID_RE = new RegExp(`^${ID}$`, 'u')
const ARROW_RE = /\s*(-->|\.\.>|->)\s*/
const NODE_DECL_RE = new RegExp(`^(${ID})\\s*(?:\\[(\\w+)\\])?\\s*:?\\s*(.*)$`, 'u')
const LINK_RE = new RegExp(`^link\\s+(${ID})\\s*:\\s*(\\S+)$`, 'iu')
const DIRECTIVE_RE = /^(title|direction|mode)\s*:\s*(.+)$/i
const GROUP_RE = /^group\s+(.+?)\s*:\s*(.+)$/i
const ESCAPED_HASH = '\u0000'

export const MAX_LABEL = 40

export function normalizeDirection(v: string | undefined): FlowDirection | undefined {
  const d = v?.trim().toUpperCase()
  return d === 'LR' || d === 'TB' || d === 'RL' || d === 'BT' ? d : undefined
}

function humanize(id: string) {
  return id
    .replace(/[_-]+/g, ' ')
    .replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2')
    .replace(/^\p{L}/u, c => c.toUpperCase())
}

function stripComment(line: string) {
  const s = line.replace(/\\#/g, ESCAPED_HASH)
  if (/^\s*#/.test(s)) return ''
  const m = s.match(/\s{2,}#/)
  return m ? s.slice(0, m.index) : s
}
const unescape = (s: string) => s.replaceAll(ESCAPED_HASH, '#')

export function parseFlow(source: string): FlowDocument {
  const doc: FlowDocument = {
    direction: 'LR', directionSet: false, mode: 'flow',
    nodes: [], edges: [], groups: [], errors: [], warnings: [],
  }
  const nodes = new Map<string, FlowNode>()
  let lastNode: FlowNode | undefined
  let step = 0

  const ensureNode = (rawId: string, line: number): FlowNode | undefined => {
    const id = rawId.trim()
    if (!ID_RE.test(id)) {
      doc.errors.push({ line, message: `Invalid node id "${id}" (use letters, digits, "_", "-", ".")` })
      return
    }
    let node = nodes.get(id)
    if (!node) {
      node = { id, label: humanize(id), kind: 'default' }
      nodes.set(id, node)
    }
    return node
  }

  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  lines.forEach((raw, i) => {
    const lineNo = i + 1
    const trimmedRaw = raw.trim()

    // Description continuation: "| text" (kept verbatim, no comment stripping)
    if (trimmedRaw.startsWith('|')) {
      if (!lastNode) {
        doc.errors.push({ line: lineNo, message: 'Description line "|" must follow a node declaration' })
        return
      }
      const text = trimmedRaw.slice(1).trim()
      lastNode.description = lastNode.description ? `${lastNode.description} ${text}` : text
      return
    }

    const line = stripComment(raw).trim()
    if (!line) return

    // Directives: key: value
    const directive = line.match(DIRECTIVE_RE)
    if (directive && !ARROW_RE.test(directive[1]!)) {
      const key = directive[1]!.toLowerCase()
      const value = unescape(directive[2]!.trim())
      if (key === 'title') doc.title = value
      else if (key === 'direction') {
        const d = normalizeDirection(value)
        if (d) { doc.direction = d; doc.directionSet = true }
        else doc.errors.push({ line: lineNo, message: `Unknown direction "${value}" (LR | TB | RL | BT)` })
      }
      else if (key === 'mode') {
        const v = value.toLowerCase()
        if (v === 'flow' || v === 'graph') doc.mode = v
        else doc.errors.push({ line: lineNo, message: `Unknown mode "${value}" (flow | graph)` })
      }
      lastNode = undefined
      return
    }

    // Edge chain — checked before group/link so ids named "group"/"link" still work.
    // Label separator is the first ":" after the chain (ids can't contain ":").
    if (ARROW_RE.test(line)) {
      const colon = line.indexOf(':')
      const chain = colon >= 0 ? line.slice(0, colon) : line
      const label = colon >= 0 ? unescape(line.slice(colon + 1).trim()) || undefined : undefined
      const parts = chain.split(ARROW_RE)
      // parts: [node, arrow, node, arrow, node...]
      if (parts.length < 3 || parts.length % 2 === 0 || parts.some((p, k) => k % 2 === 0 && !p.trim())) {
        doc.errors.push({ line: lineNo, message: `Malformed edge "${unescape(line)}"` })
        return
      }
      for (let p = 0; p + 2 < parts.length; p += 2) {
        const a = ensureNode(parts[p]!, lineNo)
        const b = ensureNode(parts[p + 2]!, lineNo)
        if (!a || !b) continue
        if (a.id === b.id) doc.warnings.push({ line: lineNo, message: `Self-loop on "${a.id}" — consider a separate retry/repeat node` })
        const arrow = parts[p + 1]!
        const style: FlowEdgeStyle = arrow === '-->' ? 'dashed' : arrow === '..>' ? 'dotted' : 'solid'
        step++
        const edgeLabel = p + 2 === parts.length - 1 ? label : undefined // label applies to the last hop
        if (edgeLabel && edgeLabel.length > MAX_LABEL) {
          doc.warnings.push({ line: lineNo, message: `Edge label longer than ${MAX_LABEL} chars — shorten it, put details in a node "| description"` })
        }
        doc.edges.push({ id: `e${step}`, source: a.id, target: b.id, label: edgeLabel, style, step })
      }
      lastNode = undefined
      return
    }

    // Group: group Label: a, b, c
    const group = line.match(GROUP_RE)
    if (group) {
      const label = unescape(group[1]!.trim())
      const members = group[2]!.split(',').map(s => s.trim()).filter(Boolean)
      const id = `group:${doc.groups.length}`
      for (const m of members) {
        const node = ensureNode(m, lineNo)
        if (!node) continue
        if (node.group) doc.errors.push({ line: lineNo, message: `Node "${m}" is already in another group` })
        else node.group = id
      }
      doc.groups.push({ id, label, members })
      lastNode = undefined
      return
    }

    // Link: link node: url
    if (/^link\s/i.test(line) && line.includes(':')) {
      const link = line.match(LINK_RE)
      if (!link) {
        doc.errors.push({ line: lineNo, message: `Malformed link "${unescape(line)}" (expected "link <id>: <url>")` })
        return
      }
      const node = ensureNode(link[1]!, lineNo)
      if (node) node.link = unescape(link[2]!)
      lastNode = undefined
      return
    }

    // Node declaration: id [kind] Label   (also "id: Label")
    const decl = line.match(NODE_DECL_RE)
    if (decl) {
      const node = ensureNode(decl[1]!, lineNo)
      if (!node) return
      const kind = decl[2]?.toLowerCase()
      if (kind) {
        if ((FLOW_NODE_KINDS as readonly string[]).includes(kind)) node.kind = kind as FlowNodeKind
        else doc.errors.push({ line: lineNo, message: `Unknown kind "${kind}" (${FLOW_NODE_KINDS.join(' | ')})` })
      }
      const label = unescape(decl[3]?.trim() ?? '')
      if (label) node.label = label
      lastNode = node
      return
    }

    doc.errors.push({ line: lineNo, message: `Cannot parse "${unescape(line)}"` })
  })

  doc.nodes = [...nodes.values()]
  if (!doc.nodes.length) doc.errors.push({ line: 0, message: 'Diagram has no nodes' })
  return doc
}

/** Applies fence meta / component props on top of the parsed document (shared by renderer and checker). */
export function applyOverrides(doc: FlowDocument, o: { lang?: string, mode?: string, direction?: string, title?: string }) {
  if (o.lang === 'graph') doc.mode = 'graph'
  if (o.mode === 'flow' || o.mode === 'graph') doc.mode = o.mode
  const dir = normalizeDirection(o.direction)
  if (dir) { doc.direction = dir; doc.directionSet = true }
  else if (o.direction) doc.errors.push({ line: 0, message: `Unknown direction "${o.direction}" (LR | TB | RL | BT)` })
  if (o.title) doc.title = o.title
  return doc
}

/**
 * Converts an embedded table (from `src=`) into DSL lines, prepended to the block body.
 * Columns (case-insensitive, RU/EN): from|source|откуда|от, to|target|куда|к, label|action|действие|подпись,
 * style|type (solid|dashed|dotted|async), plus optional node columns: id, name|label, kind|тип, description|описание.
 * A table with only node columns declares nodes; a table with from/to declares edges (rows = steps, in order).
 */
export function tableToFlowDsl(src: { kind: string, columns: string[], rows: unknown[][] } | undefined): { dsl: string, error?: string } {
  if (!src) return { dsl: '' }
  if (src.kind !== 'table') return { dsl: '', error: 'flow src must be a table (csv/xlsx/json array)' }
  const cols = src.columns.map(c => String(c).toLowerCase().trim())
  const col = (...names: string[]) => cols.findIndex(c => names.includes(c))
  const from = col('from', 'source', 'откуда', 'от', 'из'), to = col('to', 'target', 'куда', 'к', 'в')
  const label = col('label', 'action', 'действие', 'подпись', 'шаг', 'step')
  // in an edge table, a bare "type/тип" column means the link type
  const style = col('style', 'type', 'тип связи', 'тип', 'связь')
  const id = col('id', 'код'), name = col('name', 'название', 'наименование'), kind = col('kind', 'тип'), desc = col('description', 'описание')
  const clean = (v: unknown) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim()
  const toId = (v: unknown) => clean(v).replace(/[^\p{L}\p{N}_.-]+/gu, '_').replace(/^_+|_+$/g, '')
  const lines: string[] = []
  if (from >= 0 && to >= 0) {
    for (const r of src.rows) {
      const a = toId(r[from]), b = toId(r[to])
      if (!a || !b) continue
      // keep readable labels for auto-created nodes
      for (const [rawIdx, nid] of [[from, a], [to, b]] as const) if (clean(r[rawIdx]) !== nid) lines.push(`${nid} ${clean(r[rawIdx])}`)
      const st = clean(style >= 0 ? r[style] : '').toLowerCase()
      const arrow = /dash|async|асинх|событ/.test(st) ? '-->' : /dot|optional|опц|ошиб/.test(st) ? '..>' : '->'
      const l = label >= 0 ? clean(r[label]) : ''
      lines.push(`${a} ${arrow} ${b}${l ? ` : ${l}` : ''}`)
    }
    return { dsl: lines.join('\n') }
  }
  if (id >= 0 || name >= 0) {
    for (const r of src.rows) {
      const nid = toId(id >= 0 ? r[id] : r[name]); if (!nid) continue
      const k = kind >= 0 ? clean(r[kind]).toLowerCase() : ''
      lines.push(`${nid}${k ? ` [${k}]` : ''} ${name >= 0 ? clean(r[name]) : ''}`.trim())
      if (desc >= 0 && clean(r[desc])) lines.push(`  | ${clean(r[desc])}`)
    }
    return { dsl: lines.join('\n') }
  }
  return { dsl: '', error: `flow src table needs from/to columns or id/name columns (have: ${src.columns.join(', ')})` }
}
