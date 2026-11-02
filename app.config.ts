export default defineAppConfig({
  navigation: {
    sub: 'header',
  },
  // AREA-145: right-hand table of contents title (Docus toc.title)
  toc: {
    title: 'На этой странице'
  },
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
    // AREA-120: warm neutral palette from the reference (stone ≈ Notion greys)
    colors: {
      primary: 'stone',
      neutral: 'stone'
    },
    // Homepage (content/index.md) — compact, left-aligned layout from the reference
    pageHero: {
      slots: {
        container: 'max-w-240 py-12 sm:py-16 lg:py-16 gap-0 sm:gap-y-0',
        title: 'text-3xl sm:text-4xl tracking-tight font-bold text-highlighted',
        description: 'text-base sm:text-lg/7 text-muted max-w-2xl',
        footer: 'mt-6',
        links: 'gap-3'
      },
      variants: {
        orientation: {
          vertical: {
            wrapper: 'text-left',
            description: 'text-pretty',
            links: 'justify-start'
          }
        },
        title: {
          true: { description: 'mt-3' }
        }
      }
    },
    pageSection: {
      slots: {
        root: 'pb-10 last:pb-16',
        container: 'max-w-240 py-0 sm:py-0 lg:py-0 gap-3 sm:gap-3',
        title: 'text-xs sm:text-xs lg:text-xs font-semibold uppercase tracking-wider text-muted',
        body: 'mt-3'
      },
      variants: {
        orientation: {
          vertical: { title: 'text-left' }
        }
      }
    },
    pageGrid: {
      base: 'gap-2 sm:gap-2'
    },
    pageCard: {
      slots: {
        container: 'p-4 sm:p-4 gap-y-0',
        leading: 'mb-3',
        leadingIcon: 'size-5 text-muted',
        title: 'text-sm',
        description: 'text-sm/6'
      }
    },
    // AREA-145: TOC typography/spacing; title icon is in components/DocsAsideRight.vue (#leading).
    // Active item stays monochrome (AREA-120): neutral color + neutral indicator.
    contentToc: {
      slots: {
        trigger: 'gap-2 lg:mb-2',
        title: 'text-highlighted',
        link: 'leading-5'
      },
      defaultVariants: {
        color: 'neutral',
        highlightColor: 'neutral'
      }
    },
    prose: {
      a: {
        // wrap-anywhere: long URLs must not cause horizontal scroll on mobile (AREA-124)
        base: 'border-primary/30 wrap-anywhere'
      },
      code: {
        // inline code is inline-block: allow breaking long tokens so it fits 375 px (AREA-124)
        base: 'max-w-full wrap-anywhere'
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
