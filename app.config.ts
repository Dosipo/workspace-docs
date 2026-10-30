export default defineAppConfig({
  docus: {
    title: 'Workspace Docs',
    description: 'Knowledge base for the workspace',
    socials: {},
    github: {
      owner: 'Dosipo',
      repo: 'workspace-docs',
      branch: 'main'
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
    }
  }
})
