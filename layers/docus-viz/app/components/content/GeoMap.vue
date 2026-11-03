<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, shallowRef, useTemplateRef } from 'vue'
import { parseMap, applyMapOverrides } from '../../../shared/map-dsl'
import type { MapDocument, Basemap } from '../../../shared/map-dsl'
import { resolveMap, formatDistance, formatChainage, measureAt } from '../../../shared/map-geometry'
import type { ResolvedPlace, ResolvedRoute, ResolvedHaul } from '../../../shared/map-geometry'
import '../../assets/geo-map.css'

const props = defineProps<{
  code?: string
  title?: string
  basemap?: string
  height?: string | number
  /** embedded by remark-viz from `src=` */
  data?: string
  srcError?: string
  routeKind?: string
  pointKind?: string
}>()

const embedded = computed(() => { try { return props.data ? JSON.parse(props.data) : undefined } catch { return undefined } })
const doc = computed<MapDocument>(() => {
  const d = applyMapOverrides(parseMap(props.code ?? '', embedded.value, { routeKind: props.routeKind, pointKind: props.pointKind }), props)
  if (props.srcError) d.errors.unshift({ line: 0, message: props.srcError })
  return d
})
const geo = computed(() => resolveMap(doc.value))
const errors = computed(() => [...doc.value.errors.map(e => (e.line ? `Line ${e.line}: ${e.message}` : e.message)), ...geo.value.errors])
const canRender = computed(() => !!geo.value.bounds)

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const STYLES: Record<Exclude<Basemap, 'satellite'>, string> = {
  streets: 'https://tiles.openfreemap.org/styles/liberty',
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}
const SATELLITE = {
  version: 8 as const,
  sources: {
    esri: {
      type: 'raster' as const,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 18,
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [{ id: 'esri', type: 'raster' as const, source: 'esri' }],
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
}
// Fallback when the vector style can't be fetched (offline CDN, flaky network): plain OSM raster.
const RASTER_FALLBACK = {
  version: 8 as const,
  sources: {
    osm: { type: 'raster' as const, tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 19, attribution: '© OpenStreetMap contributors' },
  },
  layers: [{ id: 'osm', type: 'raster' as const, source: 'osm' }],
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
}
const usingFallback = ref(false)
const basemap = ref<Basemap>(doc.value.basemap)
watch(() => doc.value.basemap, v => (basemap.value = v))
const styleFor = (b: Basemap) => {
  if (b === 'satellite') return SATELLITE
  if (usingFallback.value) return RASTER_FALLBACK
  // follow the site theme unless the author pinned a basemap
  if (!doc.value.basemapSet && isDark.value) return STYLES.dark
  if (b === 'streets' && isDark.value) return STYLES.dark
  return STYLES[b]
}

// --- selection -------------------------------------------------------------
type Selected = { type: 'place', item: ResolvedPlace } | { type: 'route', item: ResolvedRoute, measure?: number } | { type: 'haul', item: ResolvedHaul }
const selected = shallowRef<Selected | null>(null)

const summary = computed(() => {
  const g = geo.value, u = doc.value.units
  const parts = g.routes.map(r => `${r.label}: ${formatDistance(r.lengthKm, u)}`)
  if (g.hauls.length) parts.push(`${g.hauls.length} плеч${g.hauls.length === 1 ? 'о' : 'а'} возки`)
  return parts.join(' · ')
})

const footer = computed(() => {
  const s = selected.value, u = doc.value.units
  if (!s) return summary.value || 'Кликните по объекту на карте.'
  if (s.type === 'haul') return `${s.item.from.label} → ${s.item.to.label}: ${formatDistance(s.item.km, u)}${s.item.alongRoute ? ' по трассе' : ' по прямой'}`
  if (s.type === 'route') {
    const ch = s.measure !== undefined ? formatChainage(s.measure, doc.value) : undefined
    return `${s.item.label}: ${formatDistance(s.item.lengthKm, u)}${s.measure !== undefined ? ` · точка на ${formatDistance(s.measure, u)} от начала${ch ? ` (${ch})` : ''}` : ''}`
  }
  const p = s.item
  const ch = p.measureKm !== undefined ? formatChainage(p.measureKm, doc.value) : undefined
  return `${p.label}${ch ? ` · ${ch}` : p.measureKm !== undefined ? ` · ${formatDistance(p.measureKm, u)} от начала` : ''}`
})

// --- map lifecycle -----------------------------------------------------------
const container = useTemplateRef<HTMLDivElement>('container')
let map: any
let ml: typeof import('maplibre-gl') | undefined
const loaded = ref(false)
const loadError = ref<string | null>(null)

const KIND_COLOR: Record<string, string> = {
  camp: '#2563eb', quarry: '#a16207', spoil: '#78716c', bridge: '#0891b2', culvert: '#06b6d4',
  city: '#334155', start: '#16a34a', end: '#dc2626', warn: '#ea580c', info: '#7c3aed', default: '#475569',
}
const ROUTE_STYLE: Record<string, { width: number, dash?: number[] }> = {
  road: { width: 5 }, haul: { width: 3, dash: [2, 1.5] }, rail: { width: 3, dash: [4, 2] },
  river: { width: 3 }, boundary: { width: 2, dash: [1, 1.5] }, plan: { width: 4, dash: [3, 2] },
}

// MapLibre only understands rgb/hex/hsl; Nuxt UI tokens are oklch(). Let the browser convert.
function cssColorToRgb(color: string, fallback: string) {
  try {
    const ctx = document.createElement('canvas').getContext('2d')!
    ctx.fillStyle = fallback
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return `rgb(${r}, ${g}, ${b})`
  }
  catch { return fallback }
}
function primary() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--ui-primary').trim()
  return v ? cssColorToRgb(v, '#16a34a') : '#16a34a'
}

function addData() {
  const g = geo.value
  const p = primary()
  map.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: g.routes.map(r => ({ ...r.line, id: undefined, properties: { id: r.id, kind: r.kind, label: r.label } })) } })
  map.addSource('segments', { type: 'geojson', data: { type: 'FeatureCollection', features: g.segments.map(s => ({ ...s.line, properties: { id: s.id, color: KIND_COLOR[s.kind] ?? KIND_COLOR.warn, label: s.label } })) } })
  const haulsData = { type: 'FeatureCollection', features: g.hauls.map(h => ({ ...h.line, properties: { id: h.id, along: !!h.alongRoute, label: `${h.label ? `${h.label} · ` : ''}${formatDistance(h.km, doc.value.units)}` } })) }
  map.addSource('hauls', { type: 'geojson', data: haulsData })
  const placesData = { type: 'FeatureCollection', features: g.places.map(pl => ({ type: 'Feature', geometry: { type: 'Point', coordinates: pl.coord }, properties: { id: pl.id, label: pl.label, color: KIND_COLOR[pl.kind] ?? KIND_COLOR.default } })) }
  map.addSource('places', { type: 'geojson', data: placesData })
  // Label layers get their own sources: a symbol layer waits for glyphs, and that would
  // otherwise hold back rendering of the points/lines sharing the same GeoJSON tiles.
  map.addSource('place-labels', { type: 'geojson', data: placesData })
  map.addSource('haul-labels', { type: 'geojson', data: haulsData })

  for (const kind of Object.keys(ROUTE_STYLE)) {
    const st = ROUTE_STYLE[kind]!
    map.addLayer({ id: `route-casing-${kind}`, type: 'line', source: 'routes', filter: ['==', ['get', 'kind'], kind], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': st.width + 3, 'line-opacity': 0.9 } })
    map.addLayer({ id: `route-${kind}`, type: 'line', source: 'routes', filter: ['==', ['get', 'kind'], kind], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': kind === 'river' ? '#0284c7' : p, 'line-width': st.width, ...(st.dash ? { 'line-dasharray': st.dash } : {}) } })
  }
  map.addLayer({ id: 'segments', type: 'line', source: 'segments', layout: { 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 8, 'line-opacity': 0.85 } })
  map.addLayer({ id: 'hauls', type: 'line', source: 'hauls', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#a16207', 'line-width': 2.5, 'line-dasharray': [2, 2], 'line-offset': ['case', ['get', 'along'], 9, 0] } })
  map.addLayer({ id: 'haul-labels', type: 'symbol', source: 'haul-labels', layout: { 'symbol-placement': 'line-center', 'text-field': ['get', 'label'], 'text-size': 12, 'text-font': ['Noto Sans Regular'] }, paint: { 'text-color': '#713f12', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 } })
  map.addLayer({ id: 'places', type: 'circle', source: 'places', paint: { 'circle-radius': 6, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } })
  map.addLayer({ id: 'place-labels', type: 'symbol', source: 'place-labels', layout: { 'text-field': ['get', 'label'], 'text-size': 12, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-font': ['Noto Sans Regular'], 'text-optional': true }, paint: { 'text-color': '#1e293b', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 } })

  const clickable = ['places', 'hauls', 'segments', ...Object.keys(ROUTE_STYLE).map(k => `route-${k}`)]
  for (const id of clickable) {
    map.on('mouseenter', id, () => (map.getCanvas().style.cursor = 'pointer'))
    map.on('mouseleave', id, () => (map.getCanvas().style.cursor = ''))
  }
  map.on('click', (e: any) => {
    const f = map.queryRenderedFeatures(e.point, { layers: clickable })[0]
    if (!f) { selected.value = null; return }
    const id = f.properties.id
    const place = g.places.find(x => x.id === id)
    if (place) { selected.value = { type: 'place', item: place }; return }
    const haul = g.hauls.find(x => x.id === id)
    if (haul) { selected.value = { type: 'haul', item: haul }; return }
    const route = g.routes.find(x => x.id === id)
    if (route) { selected.value = { type: 'route', item: route, measure: measureAt(route, [e.lngLat.lng, e.lngLat.lat]) }; return }
    const seg = g.segments.find(x => x.id === id)
    if (seg) { const r = g.routes.find(x => x.id === seg.routeId)!; selected.value = { type: 'route', item: r, measure: measureAt(r, [e.lngLat.lng, e.lngLat.lat]) } }
  })
}

function fit(animate = true) {
  const b = geo.value.bounds
  if (!map || !b) return
  map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 48, maxZoom: 14, duration: animate ? 400 : 0 })
}

async function init() {
  if (!container.value || !canRender.value) return
  try {
    ml = await import('maplibre-gl')
    const workerUrl = (await import('maplibre-gl/dist/maplibre-gl-worker.mjs?url')).default
    ml.setWorkerUrl(workerUrl)
    await import('maplibre-gl/dist/maplibre-gl.css')
  }
  catch (e) {
    loadError.value = `Map library failed to load: ${(e as Error).message}`
    return
  }
  const b = geo.value.bounds!
  map = new ml.Map({
    container: container.value,
    style: styleFor(basemap.value) as any,
    bounds: [[b[0], b[1]], [b[2], b[3]]],
    fitBoundsOptions: { padding: 48, maxZoom: 14 },
    cooperativeGestures: true,
    // render Cyrillic/CJK with a local font if the glyph CDN is unreachable
    localIdeographFontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    attributionControl: { compact: true },
  })
  map.addControl(new ml.NavigationControl({ visualizePitch: true }), 'top-right')
  map.addControl(new ml.ScaleControl({ unit: doc.value.units === 'mi' ? 'imperial' : 'metric' }), 'bottom-left')
  map.addControl(new ml.FullscreenControl(), 'top-right')
  map.on('style.load', () => { addData(); loaded.value = true; clearTimeout(styleTimer) })
  const fallBack = (reason: string) => {
    if (usingFallback.value || basemap.value === 'satellite') return
    usingFallback.value = true
    loadError.value = null
    console.info(`[geo-map] vector basemap unavailable (${reason}); using OSM raster`)
    map.setStyle(RASTER_FALLBACK as any)
  }
  const styleTimer = setTimeout(() => { if (!loaded.value) fallBack('timeout') }, 8000)
  map.on('error', (e: any) => {
    const msg = String(e?.error?.message ?? e?.error ?? '')
    if (!loaded.value && /styles\//.test(msg)) return fallBack(msg)
    // tile/glyph hiccups after load are non-fatal: MapLibre retries and renders the rest
    if (!loaded.value && msg && !/\.pbf|fonts\//.test(msg)) loadError.value = `Map failed: ${msg}`
  })
}

function setBasemap(b: Basemap) {
  basemap.value = b
  map?.setStyle(styleFor(b) as any)
}
watch(isDark, () => map?.setStyle(styleFor(basemap.value) as any))
watch(() => props.code, () => { map?.remove(); map = undefined; loaded.value = false; selected.value = null; init() })

let ro: ResizeObserver | undefined
onMounted(() => {
  init()
  if (container.value && typeof ResizeObserver !== 'undefined') {
    let last = ''
    ro = new ResizeObserver(([e]) => {
      const s = `${Math.round(e!.contentRect.width)}x${Math.round(e!.contentRect.height)}`
      if (!e!.contentRect.width || s === last) return
      const first = !last
      last = s
      map?.resize()
      if (first) fit(false) // map was created inside a hidden tab
    })
    ro.observe(container.value)
  }
})
onBeforeUnmount(() => { ro?.disconnect(); map?.remove() })

const heightCss = computed(() => {
  const h = props.height
  if (!h) return '420px'
  return typeof h === 'number' || /^\d+$/.test(String(h)) ? `${h}px` : String(h)
})
const KIND_LABEL: Record<string, string> = {
  camp: 'База / городок', quarry: 'Карьер', spoil: 'Отвал', bridge: 'Мост', culvert: 'Труба', city: 'Населённый пункт',
  start: 'Начало', end: 'Конец', warn: 'Внимание', info: 'Пункт', default: 'Точка',
}
const legend = computed(() => {
  const g = geo.value
  const items: { key: string, label: string, color: string, shape: string }[] = []
  if (g.routes.length) items.push({ key: 'route', label: g.routes.length === 1 ? g.routes[0]!.label : 'Маршруты', color: 'var(--ui-primary)', shape: 'line' })
  for (const kind of [...new Set(g.places.map(p => p.kind))]) items.push({ key: `p-${kind}`, label: KIND_LABEL[kind] ?? kind, color: KIND_COLOR[kind] ?? KIND_COLOR.default, shape: 'dot' })
  for (const s of g.segments.filter((x, i, a) => a.findIndex(y => y.kind === x.kind) === i)) items.push({ key: `s-${s.kind}`, label: g.segments.filter(x => x.kind === s.kind).length > 1 ? s.label.replace(/,.*$/, '') : s.label, color: KIND_COLOR[s.kind] ?? KIND_COLOR.warn, shape: 'bar' })
  if (g.hauls.length) items.push({ key: 'haul', label: 'Плечо возки', color: '#a16207', shape: 'dash' })
  return items
})
const BASEMAPS: { id: Basemap, label: string }[] = [
  { id: 'streets', label: 'Схема' }, { id: 'light', label: 'Светлая' }, { id: 'satellite', label: 'Спутник' },
]
</script>

<template>
  <div class="geo-map not-prose">
    <div class="geo-map__header">
      <span class="geo-map__badge"><UIcon name="i-lucide-map" /> Карта</span>
      <span class="geo-map__title">{{ doc.title || 'Расположение и расстояния' }}</span>
      <span v-if="usingFallback" class="geo-map__note" title="Векторная подложка недоступна, показана растровая OSM">растровая подложка</span>
      <div class="geo-map__actions">
        <UButton
          v-for="b in BASEMAPS" :key="b.id" :label="b.label" size="xs" color="neutral"
          :variant="basemap === b.id ? 'subtle' : 'ghost'" @click="setBasemap(b.id)"
        />
        <UButton icon="i-lucide-scan" size="xs" color="neutral" variant="ghost" aria-label="Fit" @click="fit()" />
      </div>
    </div>

    <div v-if="errors.length || loadError" class="geo-map__errors">
      <p v-for="(e, i) in errors" :key="i"><UIcon name="i-lucide-triangle-alert" /> {{ e }}</p>
      <p v-if="loadError"><UIcon name="i-lucide-wifi-off" /> {{ loadError }}</p>
    </div>

    <div v-if="canRender" ref="container" class="geo-map__canvas" :style="{ height: heightCss }" />

    <ul v-if="canRender && legend.length" class="geo-map__legend">
      <li v-for="l in legend" :key="l.key"><span class="geo-map__swatch" :class="l.shape" :style="{ background: l.color, borderColor: l.color }" />{{ l.label }}</li>
    </ul>

    <Transition name="geo-fade" mode="out-in">
      <div v-if="selected" :key="selected.item.id" class="geo-map__card">
        <p class="geo-map__card-title">{{ selected.item.label ?? selected.item.id }}</p>
        <p v-if="'description' in selected.item && selected.item.description" class="geo-map__card-desc">{{ selected.item.description }}</p>
        <p v-if="'link' in selected.item && selected.item.link" class="geo-map__card-link">See <ULink :to="selected.item.link">{{ selected.item.link }}</ULink></p>
      </div>
    </Transition>

    <div v-if="canRender" class="geo-map__footer">{{ footer }}</div>

    <!-- Text alternative: SSR-rendered, indexed by search and LLMs -->
    <details v-if="geo.routes.length || geo.hauls.length" class="geo-map__source">
      <summary>Расстояния (таблица)</summary>
      <table>
        <tbody>
          <tr v-for="r in geo.routes" :key="r.id"><td>{{ r.label }}</td><td>{{ formatDistance(r.lengthKm, doc.units) }}</td></tr>
          <tr v-for="h in geo.hauls" :key="h.id"><td>{{ h.from.label }} → {{ h.to.label }}<template v-if="h.label"> ({{ h.label }})</template></td><td>{{ formatDistance(h.km, doc.units) }}{{ h.alongRoute ? ' по трассе' : ' по прямой' }}</td></tr>
          <tr v-for="p in geo.places.filter(x => x.measureKm !== undefined)" :key="p.id"><td>{{ p.label }}</td><td>{{ formatChainage(p.measureKm!, doc) ?? formatDistance(p.measureKm!, doc.units) }}</td></tr>
        </tbody>
      </table>
    </details>
  </div>
</template>
