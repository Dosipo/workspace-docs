export default defineNuxtConfig({
  extends: ['docus'],
  css: ['~/assets/css/main.css', '~/assets/css/custom.css'],
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
