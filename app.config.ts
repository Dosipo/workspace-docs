export default defineAppConfig({
  // Лицензия контента базы знаний
  license: 'CC BY 4.0',
  licenseUrl: '/license',

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
      credits: {
        icon: 'IconDocus',
        text: '© 2026 Workspace Knowledge Base. Лицензия: CC BY 4.0',
        href: '/license'
      },
      textLinks: [
        {
          text: 'Лицензия CC BY 4.0',
          href: '/license'
        }
      ],
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
    }
  },
  toc: {
    bottom: {
      title: 'Правовая информация',
      links: [
        {
          icon: 'i-lucide-scale',
          label: 'Лицензия CC BY 4.0',
          to: '/license'
        }
      ]
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
