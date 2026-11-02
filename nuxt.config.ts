export default defineNuxtConfig({
  extends: ['docus'],
  css: ['~/assets/css/main.css', '~/assets/css/custom.css'],
  ui: {
    colors: {
      primary: 'zinc',
    },
  },
  icon: {
    serverBundle: {
      collections: ['heroicons', 'lucide', 'logos']
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
