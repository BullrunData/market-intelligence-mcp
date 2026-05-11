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
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

import { registerMacroTools } from './tools/macro.js'
import { registerIndicatorTools } from './tools/indicators.js'
import { registerMarketTools } from './tools/markets.js'
import { registerCalculatorTools } from './tools/calculators.js'
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

// Store transports per session (in-memory, per Vercel function instance)
const transports = new Map<string, WebStandardStreamableHTTPServerTransport>()

function createMcpServer(apiKey?: string): McpServer {
  if (apiKey) {
    process.env.BULLRUNDATA_API_KEY = apiKey
  }

  const server = new McpServer({
    name: 'market-intelligence',
    version: '0.2.0',
    description: 'Market Intelligence MCP — recession probability, sector rotation, institutional positioning, macro cascade scenarios, real estate calculators, and economic data',
  })

  registerMacroTools(server)
  registerIndicatorTools(server)
  registerMarketTools(server)
  registerCalculatorTools(server)
  registerCascadeTools(server)

  return server
}

// Handles GET (SSE), POST (JSON-RPC), DELETE (session close) per MCP spec
app.all('/mcp', async (c) => {
  const authHeader = c.req.header('Authorization')
  let apiKey: string | undefined

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const result = await verifyToken(token)
      if (result) apiKey = result.apiKey
    } catch {
      // Token invalid — proceed without; tools will fail with 401
    }
  }

  const sessionId = c.req.header('mcp-session-id')
  let transport: WebStandardStreamableHTTPServerTransport

  if (sessionId && transports.has(sessionId)) {
    transport = transports.get(sessionId)!
  } else {
    transport = new WebStandardStreamableHTTPServerTransport({
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

  return transport.handleRequest(c.req.raw)
})

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'market-intelligence-mcp', version: '0.2.0' }))

// Info
app.get('/', (c) => c.json({
  name: 'BullrunData Market Intelligence MCP',
  version: '0.2.0',
  transport: 'streamable-http',
  mcp_endpoint: `${MCP_BASE_URL}/mcp`,
  oauth: `${MCP_BASE_URL}/.well-known/oauth-authorization-server`,
  docs: 'https://bullrundata.com/docs',
}))

export default app
