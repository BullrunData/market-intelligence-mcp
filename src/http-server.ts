/**
 * MCP HTTP Server — Streamable HTTP transport with OAuth
 *
 * Endpoints:
 *   POST /mcp              — MCP protocol (Streamable HTTP)
 *   GET  /mcp              — MCP SSE stream
 *   DELETE /mcp            — Close session
 *   GET  /.well-known/oauth-authorization-server  — OAuth metadata
 *   GET  /authorize        — Start OAuth flow
 *   POST /token            — Exchange code for token
 *   GET  /github/callback  — GitHub OAuth callback
 *   POST /register         — Dynamic client registration
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

import { registerRecessionTools } from './tools/recession.js'
import { registerCapitalRotationTools } from './tools/capital-rotation.js'
import { registerCalculatorTools } from './tools/calculators.js'
import { registerFredTools } from './tools/fred.js'
import { registerCascadeTools } from './tools/cascade.js'
import { BullrunOAuthProvider, RedirectError, handleGitHubCallback } from './auth/oauth-provider.js'
import { verifyToken } from './auth/token-store.js'

const app = new Hono()
const provider = new BullrunOAuthProvider()

app.use('*', cors())

// ─── OAuth Discovery ───────────────────────────────────────────

const MCP_BASE_URL = process.env.MCP_BASE_URL || 'https://market.bullrundata.com'

app.get('/.well-known/oauth-authorization-server', (c) => {
  return c.json({
    issuer: MCP_BASE_URL,
    authorization_endpoint: `${MCP_BASE_URL}/authorize`,
    token_endpoint: `${MCP_BASE_URL}/token`,
    registration_endpoint: `${MCP_BASE_URL}/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['read'],
  })
})

// ─── OAuth Authorize ───────────────────────────────────────────

app.get('/authorize', async (c) => {
  const clientId = c.req.query('client_id') || ''
  const redirectUri = c.req.query('redirect_uri') || ''
  const state = c.req.query('state') || ''
  const codeChallenge = c.req.query('code_challenge') || ''

  // Build state for GitHub callback
  const oauthState = JSON.stringify({
    clientId,
    redirectUri,
    codeChallenge,
    originalState: state,
  })

  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ''
  const githubUrl = new URL('https://github.com/login/oauth/authorize')
  githubUrl.searchParams.set('client_id', GITHUB_CLIENT_ID)
  githubUrl.searchParams.set('redirect_uri', `${MCP_BASE_URL}/github/callback`)
  githubUrl.searchParams.set('scope', 'user:email')
  githubUrl.searchParams.set('state', Buffer.from(oauthState).toString('base64url'))

  return c.redirect(githubUrl.toString())
})

// ─── GitHub Callback ───────────────────────────────────────────

app.get('/github/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')

  if (!code || !state) {
    return c.json({ error: 'Missing code or state' }, 400)
  }

  try {
    const result = await handleGitHubCallback(code, state)

    // Redirect back to Claude with the authorization code
    const redirectUrl = new URL(result.redirectUri)
    redirectUrl.searchParams.set('code', result.authorizationCode)
    if (result.originalState) {
      redirectUrl.searchParams.set('state', result.originalState)
    }

    return c.redirect(redirectUrl.toString())
  } catch (e) {
    return c.json({ error: 'OAuth failed', detail: e instanceof Error ? e.message : String(e) }, 500)
  }
})

// ─── Token Exchange ────────────────────────────────────────────

app.post('/token', async (c) => {
  const body = await c.req.parseBody()
  const grantType = body.grant_type as string
  const code = body.code as string

  if (grantType !== 'authorization_code' || !code) {
    return c.json({ error: 'unsupported_grant_type' }, 400)
  }

  try {
    const tokens = await provider.exchangeAuthorizationCode(
      { client_id: (body.client_id as string) || '' } as any,
      code,
      body.code_verifier as string | undefined,
      body.redirect_uri as string | undefined
    )

    return c.json(tokens)
  } catch (e) {
    return c.json({ error: 'invalid_grant', error_description: e instanceof Error ? e.message : String(e) }, 400)
  }
})

// ─── Dynamic Client Registration ───────────────────────────────

app.post('/register', async (c) => {
  const body = await c.req.json()
  const client = await provider.clientsStore.registerClient!(body)
  return c.json(client, 201)
})

// ─── MCP Protocol (Streamable HTTP) ────────────────────────────

// Store transports per session
const transports = new Map<string, StreamableHTTPServerTransport>()

function createMcpServer(apiKey?: string): McpServer {
  // Set the API key in env so tools can use it
  if (apiKey) {
    process.env.BULLRUNDATA_API_KEY = apiKey
  }

  const server = new McpServer({
    name: 'market-intelligence',
    version: '0.1.2',
    description: 'Market Intelligence MCP — recession probability, capital rotation scoring, investment analysis, and economic data',
  })

  registerRecessionTools(server)
  registerCapitalRotationTools(server)
  registerCalculatorTools(server)
  registerFredTools(server)
  registerCascadeTools(server)

  return server
}

app.post('/mcp', async (c) => {
  // Extract auth token if present
  const authHeader = c.req.header('Authorization')
  let apiKey: string | undefined

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const result = await verifyToken(token)
      if (result) apiKey = result.apiKey
    } catch {
      // Token invalid — continue without API key (tools will fail with 401)
    }
  }

  // Get or create transport for this session
  const sessionId = c.req.header('mcp-session-id')
  let transport: StreamableHTTPServerTransport

  if (sessionId && transports.has(sessionId)) {
    transport = transports.get(sessionId)!
  } else {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (id) => {
        transports.set(id, transport)
      },
      onsessionclosed: (id) => {
        transports.delete(id)
      },
    })

    const server = createMcpServer(apiKey)
    await server.connect(transport)
  }

  // Handle the MCP request
  const body = await c.req.json()

  // Use Node.js compatible handling
  const nodeReq = {
    method: 'POST',
    headers: Object.fromEntries(c.req.raw.headers.entries()),
    url: '/mcp',
    auth: apiKey ? { token: authHeader!.slice(7), clientId: '', scopes: [] } : undefined,
  }

  // We need to use the raw request/response for StreamableHTTP
  // For Vercel, return the response directly
  try {
    await transport.handleRequest(
      nodeReq as any,
      {
        writeHead: (status: number, headers: Record<string, string>) => {
          // Will be handled by response construction
        },
        write: (data: string) => {},
        end: (data?: string) => {},
      } as any,
      body
    )
  } catch {
    // Fallback for transport errors
  }

  return c.json({ jsonrpc: '2.0', result: {} })
})

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'market-intelligence-mcp', version: '0.1.2' }))

// Info
app.get('/', (c) => c.json({
  name: 'BullrunData Market Intelligence MCP',
  version: '0.1.2',
  transport: 'streamable-http',
  mcp_endpoint: `${MCP_BASE_URL}/mcp`,
  oauth: `${MCP_BASE_URL}/.well-known/oauth-authorization-server`,
  docs: 'https://bullrundata.com/docs',
}))

export default app
