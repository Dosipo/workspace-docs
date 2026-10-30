import { serverQueryContent } from '#content/server'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    return null
  }

  if (method !== 'POST') {
    setResponseStatus(event, 405)
    return { error: 'Method not allowed' }
  }

  setResponseHeaders(event, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  })

  const body = await readBody(event)
  const { jsonrpc, method: rpcMethod, params, id } = body

  function ok(result: unknown) {
    return { jsonrpc: '2.0', id, result }
  }
  function err(code: number, message: string) {
    return { jsonrpc: '2.0', id, error: { code, message } }
  }

  if (rpcMethod === 'initialize') {
    return ok({
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'workspace-docs-mcp', version: '1.0.0' },
    })
  }

  if (rpcMethod === 'notifications/initialized') {
    return ok({})
  }

  if (rpcMethod === 'tools/list') {
    return ok({
      tools: [
        {
          name: 'list-pages',
          description: 'List all pages in the workspace knowledge base',
          inputSchema: {
            type: 'object',
            properties: {
              dir: {
                type: 'string',
                description: 'Filter by directory prefix, e.g. "onboarding" (optional)',
              },
            },
          },
        },
        {
          name: 'get-page',
          description: 'Get the full content of a page by its path',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Page path, e.g. "/onboarding/quick-start"',
              },
            },
            required: ['path'],
          },
        },
      ],
    })
  }

  if (rpcMethod === 'tools/call') {
    const toolName = params?.name
    const args = params?.arguments ?? {}

    if (toolName === 'list-pages') {
      let query = serverQueryContent(event).only(['title', 'description', 'path', '_dir'])
      if (args.dir) {
        query = query.where({ _dir: { $contains: args.dir } })
      }
      const pages = await query.find()
      return ok({
        content: [{ type: 'text', text: JSON.stringify(pages, null, 2) }],
      })
    }

    if (toolName === 'get-page') {
      if (!args.path) {
        return err(-32602, 'Missing required argument: path')
      }
      const pages = await serverQueryContent(event, args.path).find()
      if (!pages.length) {
        return ok({
          content: [{ type: 'text', text: `Page not found: ${args.path}` }],
          isError: true,
        })
      }
      return ok({
        content: [{ type: 'text', text: JSON.stringify(pages[0], null, 2) }],
      })
    }

    return err(-32601, `Unknown tool: ${toolName}`)
  }

  return err(-32601, `Unknown method: ${rpcMethod}`)
})
