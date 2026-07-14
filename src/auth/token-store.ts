/**
 * Neon-backed OAuth token storage
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''

function sql() {
  return neon(DATABASE_URL)
}

export async function storeAuthorizationCode(
  code: string,
  apiKey: string,
  clientId: string,
  redirectUri: string,
  codeChallenge?: string
) {
  const db = sql()
  await db`
    INSERT INTO oauth_tokens (authorization_code, api_key, client_id, redirect_uri, code_challenge, access_token)
    VALUES (${code}, ${apiKey}, ${clientId}, ${redirectUri}, ${codeChallenge ?? null}, ${'pending_' + code})
  `
}

export async function exchangeCode(code: string): Promise<{
  accessToken: string
  refreshToken: string
  apiKey: string
} | null> {
  const db = sql()
  const rows = await db`
    SELECT api_key, client_id, code_challenge, redirect_uri
    FROM oauth_tokens
    WHERE authorization_code = ${code}
  `
  if (rows.length === 0) return null

  const apiKey = rows[0].api_key as string

  // Generate tokens
  const accessToken = 'brd_at_' + crypto.randomUUID().replace(/-/g, '')
  const refreshToken = 'brd_rt_' + crypto.randomUUID().replace(/-/g, '')

  // Update the row with real tokens
  await db`
    UPDATE oauth_tokens
    SET access_token = ${accessToken},
        refresh_token = ${refreshToken},
        authorization_code = NULL,
        expires_at = NOW() + INTERVAL '30 days'
    WHERE authorization_code = ${code}
  `

  return { accessToken, refreshToken, apiKey }
}

export async function verifyToken(accessToken: string): Promise<{
  apiKey: string
  clientId: string
  scopes: string
} | null> {
  const db = sql()
  const rows = await db`
    SELECT api_key, client_id, scopes
    FROM oauth_tokens
    WHERE access_token = ${accessToken}
      AND (expires_at IS NULL OR expires_at > NOW())
  `
  if (rows.length === 0) return null
  return {
    apiKey: rows[0].api_key as string,
    clientId: rows[0].client_id as string,
    scopes: (rows[0].scopes as string) || '',
  }
}

export async function getOrRegisterClient(
  clientId: string,
  clientSecret?: string,
  redirectUris?: string[],
  name?: string
) {
  const db = sql()
  const rows = await db`SELECT * FROM oauth_clients WHERE client_id = ${clientId}`
  if (rows.length > 0) return rows[0]

  await db`
    INSERT INTO oauth_clients (client_id, client_secret, redirect_uris, name)
    VALUES (${clientId}, ${clientSecret ?? null}, ${JSON.stringify(redirectUris || [])}, ${name ?? clientId})
    ON CONFLICT (client_id) DO NOTHING
  `
  const result = await db`SELECT * FROM oauth_clients WHERE client_id = ${clientId}`
  return result[0]
}

export async function lookupUserApiKey(githubEmail: string): Promise<string | null> {
  const db = sql()
  const rows = await db`
    SELECT key FROM api_keys WHERE email = ${githubEmail} AND active = TRUE LIMIT 1
  `
  if (rows.length === 0) return null
  return rows[0].key as string
}

export async function createApiKeyForUser(email: string): Promise<string> {
  const db = sql()
  const key = 'brd_' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  await db`
    INSERT INTO api_keys (key, name, tier, email, daily_limit)
    VALUES (${key}, ${email + ' (OAuth)'}, 'free', ${email}, 100)
  `
  return key
}
