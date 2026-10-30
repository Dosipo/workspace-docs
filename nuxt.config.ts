export default defineNuxtConfig({
  extends: ['docus'],
  css: ['~/assets/css/main.css', '~/assets/css/custom.css'],
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
  }
})
