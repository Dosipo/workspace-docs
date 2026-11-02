export default defineNuxtConfig({
  extends: ['docus'],
  routeRules: {
    // Начало работы
    '/introduction': { redirect: '/nachalo-raboty/introduction' },
    '/obzor': { redirect: '/nachalo-raboty/obzor' },
    '/onboarding': { redirect: '/nachalo-raboty/onboarding' },
    '/onboarding/**': { redirect: '/nachalo-raboty/onboarding/**' },
    // Инструменты
    '/ii-platforma': { redirect: '/instrumenty/ii-platforma' },
    '/ii-platforma/**': { redirect: '/instrumenty/ii-platforma/**' },
    '/vayb-koding': { redirect: '/instrumenty/vayb-koding' },
    '/vayb-koding/**': { redirect: '/instrumenty/vayb-koding/**' },
    '/excel': { redirect: '/instrumenty/excel' },
    '/excel/**': { redirect: '/instrumenty/excel/**' },
    '/n8n': { redirect: '/instrumenty/n8n' },
    '/n8n/**': { redirect: '/instrumenty/n8n/**' },
    // Практики
    '/luchshie-praktiki': { redirect: '/praktiki' },
    '/luchshie-praktiki/**': { redirect: '/praktiki/**' },
    // Справочник
    '/faq': { redirect: '/spravochnik/faq' },
    '/modeli': { redirect: '/spravochnik/modeli' },
    '/reference': { redirect: '/spravochnik/reference' },
    '/reference/**': { redirect: '/spravochnik/reference/**' },
  },
  css: ['~/assets/css/main.css', '~/assets/css/custom.css'],
  icon: {
    provider: 'server',
    serverBundle: {
      collections: ['heroicons', 'lucide', 'logos']
    }
  },
  app: {
    head: {
      link: [
        { rel: 'alternate', type: 'application/json', href: '/datapackage.json' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },
  content: {
    highlight: {
      langs: ['yaml']
    }
  },
  docus: {
    assistant: {
      enabled: true,
      mcpServer: '/mcp',
      model: 'google/gemini-3-flash'
    }
  },
  vite: {
    build: {
      minify: 'esbuild',
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'INEFFECTIVE_DYNAMIC_IMPORT') return
          warn(warning)
        }
      }
    },
    optimizeDeps: {
      include: ['defu', 'ufo', 'pathe']
    }
  }
})
