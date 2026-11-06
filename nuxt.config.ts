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
  // AREA-190: dark code theme. Nuxt UI defaults to material-theme-palenight (bluish,
  // clashes with the warm stone palette, comments 3.3:1). github-dark-default keeps
  // comments ≥ 5:1 on the code-block surface. Light/default themes are left as is.
  mdc: {
    highlight: {
      theme: {
        dark: 'github-dark-default'
      }
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
