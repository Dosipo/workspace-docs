export default defineNuxtConfig({
  extends: ['docus'],
  css: ['~/assets/css/main.css', '~/assets/css/custom.css'],
  ui: {
    colors: {
      primary: 'zinc',
    },
  },
  icon: {
    provider: 'server',
    serverBundle: {
      collections: ['heroicons', 'lucide', 'logos']
    }
  },
  app: {
    head: {
      link: [
        { rel: 'alternate', type: 'application/json', href: '/datapackage.json' }
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
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'INEFFECTIVE_DYNAMIC_IMPORT') return
          warn(warning)
        }
      }
    }
  }
})
