export default defineAppConfig({
  docus: {
    title: 'База знаний воркспейса',
    description: 'Центральная база знаний для команды и AI-агентов',
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
  assistant: {
    floatingInput: true,
    explainWithAi: true,
    shortcuts: {
      focusInput: 'meta_i'
    }
  }
})
