export default defineNuxtConfig({
  extends: ['docus'],
  css: ['~/assets/css/main.css', '~/assets/css/custom.css'],
  ui: {
    colors: {
      primary: 'zinc',
    },
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
    esbuild: {
      target: 'es2022'
    }
  },
  nitro: {
    esbuild: {
      options: {
        target: 'es2022'
      }
    }
  }
})
