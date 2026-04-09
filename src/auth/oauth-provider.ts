/**
 * OAuth 2.0 Provider for BullrunData MCP Server
 *
 * Flow:
 * 1. Claude sends user to /authorize
 * 2. We redirect to GitHub OAuth
 * 3. GitHub returns with code
 * 4. We exchange for GitHub user info
 * 5. Look up/create BullrunData API key for user
 * 6. Issue authorization code back to Claude
 * 7. Claude exchanges code for access token via /token
 * 8. Access token maps to user's API key
 */

import type { OAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/provider.js'
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js'
import type { OAuthClientInformationFull, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js'
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'
import {
  storeAuthorizationCode,
  exchangeCode,
  verifyToken,
  lookupUserApiKey,
  createApiKeyForUser,
} from './token-store.js'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ''
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || ''
const MCP_BASE_URL = process.env.MCP_BASE_URL || 'https://market.bullrundata.com'

// ─── Clients Store ─────────────────────────────────────────────

class BullrunClientsStore implements OAuthRegisteredClientsStore {
  async getClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
    // Accept any client that Claude sends — dynamic client registration
    return {
      client_id: clientId,
      redirect_uris: [
        'http://localhost:6274/oauth/callback',
        'http://localhost:6274/oauth/callback/debug',
        'https://claude.ai/api/mcp/auth_callback',
        'https://claude.com/api/mcp/auth_callback',
      ],
      client_name: 'Claude',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    } as OAuthClientInformationFull
  }

  async registerClient(
    client: Omit<OAuthClientInformationFull, 'client_id' | 'client_id_issued_at'>
  ): Promise<OAuthClientInformationFull> {
    const clientId = 'client_' + crypto.randomUUID().replace(/-/g, '')
    return {
      ...client,
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
    } as OAuthClientInformationFull
  }
}

// ─── OAuth Provider ────────────────────────────────────────────

export class BullrunOAuthProvider implements OAuthServerProvider {
  get clientsStore(): OAuthRegisteredClientsStore {
    return new BullrunClientsStore()
  }

  async authorize(
    client: OAuthClientInformationFull,
    params: { redirectUri: string; codeChallenge?: string; state?: string; scopes?: string[] },
    res: Response
  ): Promise<void> {
    // Store the pending auth request state, then redirect to GitHub
    const state = JSON.stringify({
      clientId: client.client_id,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      originalState: params.state,
    })

    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
    githubAuthUrl.searchParams.set('client_id', GITHUB_CLIENT_ID)
    githubAuthUrl.searchParams.set('redirect_uri', `${MCP_BASE_URL}/github/callback`)
    githubAuthUrl.searchParams.set('scope', 'user:email')
    githubAuthUrl.searchParams.set('state', Buffer.from(state).toString('base64url'))

    // The SDK expects us to handle the redirect via the Response object
    // But since we're using Hono, we'll handle this differently in http-server.ts
    throw new RedirectError(githubAuthUrl.toString())
  }

  async challengeForAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string
  ): Promise<string> {
    return 'S256'
  }

  async exchangeAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    _redirectUri?: string
  ): Promise<OAuthTokens> {
    const result = await exchangeCode(authorizationCode)
    if (!result) throw new Error('Invalid authorization code')

    return {
      access_token: result.accessToken,
      token_type: 'bearer',
      refresh_token: result.refreshToken,
      expires_in: 30 * 24 * 60 * 60, // 30 days
    }
  }

  async exchangeRefreshToken(
    _client: OAuthClientInformationFull,
    refreshToken: string
  ): Promise<OAuthTokens> {
    // For simplicity, just reject refresh tokens for now
    throw new Error('Refresh tokens not yet supported')
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const result = await verifyToken(token)
    if (!result) throw new Error('Invalid access token')

    return {
      token,
      clientId: result.clientId,
      scopes: result.scopes ? result.scopes.split(' ') : [],
      extra: { apiKey: result.apiKey },
    }
  }
}

// Helper error class for redirect flow
export class RedirectError extends Error {
  constructor(public readonly url: string) {
    super('redirect')
  }
}

// ─── GitHub OAuth Helpers ──────────────────────────────────────

export async function handleGitHubCallback(code: string, stateB64: string): Promise<{
  authorizationCode: string
  redirectUri: string
  originalState?: string
}> {
  // Exchange GitHub code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  })
  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }
  if (!tokenData.access_token) throw new Error('GitHub OAuth failed: ' + (tokenData.error || 'unknown'))

  // Get user email from GitHub
  const userRes = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' },
  })
  const emails = (await userRes.json()) as Array<{ email: string; primary: boolean }>
  const primaryEmail = emails.find((e) => e.primary)?.email || emails[0]?.email
  if (!primaryEmail) throw new Error('Could not get email from GitHub')

  // Look up or create BullrunData API key
  let apiKey = await lookupUserApiKey(primaryEmail)
  if (!apiKey) {
    apiKey = await createApiKeyForUser(primaryEmail)
  }

  // Parse state
  const state = JSON.parse(Buffer.from(stateB64, 'base64url').toString())

  // Generate authorization code
  const authCode = 'authcode_' + crypto.randomUUID().replace(/-/g, '')

  // Store the code → API key mapping
  await storeAuthorizationCode(
    authCode,
    apiKey,
    state.clientId,
    state.redirectUri,
    state.codeChallenge
  )

  return {
    authorizationCode: authCode,
    redirectUri: state.redirectUri,
    originalState: state.originalState,
  }
}
