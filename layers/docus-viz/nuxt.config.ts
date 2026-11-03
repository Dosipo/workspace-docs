import { fileURLToPath } from 'node:url'

const remarkViz = fileURLToPath(new URL('./remark-viz.mjs', import.meta.url))

/**
 * docus-viz — visualizations for Docus content, from text or from the user's own files.
 *
 *   ```flow / ```graph   process diagrams (Vue Flow + dagre)
 *   ```map               maps, routes, chainage, distances (MapLibre + turf)
 *   ```chart             bar / line / area / pie from tables
 *   ```gantt             schedules on dates or units (shifts, weeks)
 *
 * Any block accepts {src=file} — csv, tsv, xlsx, json, geojson, kml, kmz, gpx — looked up in
 * <root>/data/ first, then next to the .md file. Data is embedded at build time.
 */
export default defineNuxtConfig({
  content: {
    build: {
      markdown: {
        remarkPlugins: {
          [remarkViz]: {},
        },
      },
    },
  },
  // data files change → content must re-parse
  watch: ['data/**'],
  vite: {
    optimizeDeps: {
      include: ['@vue-flow/core', '@vue-flow/controls', '@dagrejs/dagre', 'maplibre-gl', '@turf/helpers', '@turf/length', '@turf/along', '@turf/bbox', '@turf/nearest-point-on-line'],
    },
  },
})
