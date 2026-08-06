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
import { signState, isValidRedirectUri } from './auth/oauth-security.js'

const app = new Hono()
const provider = new BullrunOAuthProvider()

// Browser-origin CORS allowlist. MCP clients (Claude backend, Claude Desktop)
// call server-side and don't participate in CORS at all — this list only
// matters for browser-based clients. Wildcard was previously used, which
// let any website with credentials-in-headers call the endpoint.
const CORS_ALLOWED_ORIGINS = new Set([
  'https://claude.ai',
  'https://www.claude.ai',
  'https://claude.com',
  'https://www.claude.com',
  'https://console.anthropic.com',
  'https://bullrundata.com',
  'https://www.bullrundata.com',
  'https://market.bullrundata.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:6274',
])

app.use('*', cors({
  origin: (origin) => (origin && CORS_ALLOWED_ORIGINS.has(origin) ? origin : null),
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Mcp-Session-Id'],
  exposeHeaders: ['Mcp-Session-Id'],
}))

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

  // Refuse to hand off to GitHub if redirect_uri is malformed or points at
  // a non-http(s) scheme. Otherwise the callback later echoes the code to
  // whatever URI we're told (javascript:, data:, file:).
  if (!isValidRedirectUri(redirectUri)) {
    return c.json({ error: 'invalid_request', error_description: 'invalid redirect_uri' }, 400)
  }

  // HMAC-signed state binds this authorization to us; verifyState in the
  // /github/callback path rejects tampered payloads.
  const oauthState = signState({
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
  githubUrl.searchParams.set('state', oauthState)

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

// Session store with TTL. Sessions expire after 30min of inactivity;
// sweepExpiredSessions() runs on every request so a serverless instance
// can't accumulate them indefinitely.
const SESSION_TTL_MS = 30 * 60 * 1000
type Session = {
  transport: WebStandardStreamableHTTPServerTransport
  expiresAt: number
}
const sessions = new Map<string, Session>()

function touchSession(id: string): Session | undefined {
  const s = sessions.get(id)
  if (!s) return undefined
  if (s.expiresAt < Date.now()) {
    sessions.delete(id)
    return undefined
  }
  s.expiresAt = Date.now() + SESSION_TTL_MS
  return s
}

function sweepExpiredSessions() {
  const now = Date.now()
  for (const [id, s] of sessions) {
    if (s.expiresAt < now) sessions.delete(id)
  }
}

function createMcpServer(apiKey?: string): McpServer {
  if (apiKey) {
    process.env.BULLRUNDATA_API_KEY = apiKey
  }

  const server = new McpServer({
    name: 'market-intelligence',
    version: '0.3.0',
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
  sweepExpiredSessions()

  const authHeader = c.req.header('Authorization')
  let apiKey: string | undefined

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    // Accept raw brd_ API keys directly (bypasses OAuth for CLI users
    // running `claude mcp add --header "Authorization: Bearer brd_..."`).
    if (token.startsWith('brd_') && !token.startsWith('brd_at_')) {
      apiKey = token
    } else {
      try {
        const result = await verifyToken(token)
        if (result) apiKey = result.apiKey
      } catch {
        // Token invalid — proceed without; tools will fail with 401
      }
    }
  }

  const sessionId = c.req.header('mcp-session-id')
  const existing = sessionId ? touchSession(sessionId) : undefined
  let transport: WebStandardStreamableHTTPServerTransport

  if (existing) {
    transport = existing.transport
  } else {
    transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (id) => {
        sessions.set(id, { transport, expiresAt: Date.now() + SESSION_TTL_MS })
      },
      onsessionclosed: (id) => {
        sessions.delete(id)
      },
    })

    const server = createMcpServer(apiKey)
    await server.connect(transport)
  }

  return transport.handleRequest(c.req.raw)
})

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'market-intelligence-mcp', version: '0.3.0' }))

// Info
app.get('/', (c) => c.json({
  name: 'BullrunData Market Intelligence MCP',
  version: '0.3.0',
  transport: 'streamable-http',
  mcp_endpoint: `${MCP_BASE_URL}/mcp`,
  oauth: `${MCP_BASE_URL}/.well-known/oauth-authorization-server`,
  docs: 'https://bullrundata.com/docs',
}))

export default app
