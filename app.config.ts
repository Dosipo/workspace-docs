export default defineAppConfig({
  docus: {
    title: 'База знаний ИИ Ареал',
    description: 'Центральная база знаний по корпоративным ИИ-инструментам для команды и агентов',
    socials: {},
    github: {
      owner: 'Dosipo',
      repo: 'workspace-docs',
      branch: 'main',
      root: 'content',
      edit: true,
      contributors: false
    },
    aside: {
      level: 0,
      collapsed: false,
      exclude: []
    },
    main: {
      padded: true,
      fluid: false
    },
    header: {
      logo: false,
      showLinkIcon: true,
      exclude: [],
      fluid: false
    },
    footer: {
      credits: false,
      textLinks: [],
      iconLinks: [],
      fluid: false
    }
  },
  ui: {
    contentToc: {
      defaultVariants: {
        color: 'neutral',
        highlightColor: 'neutral'
      }
    },
    prose: {
      a: {
        base: 'border-primary/30'
      }
    }
  },
  header: {
    title: 'База знаний ИИ Ареал',
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
      alt: 'База знаний ИИ Ареал',
    },
  },
  assistant: {
    floatingInput: true,
    explainWithAi: true,
    shortcuts: {
      focusInput: 'meta_i'
    }
  }
})
