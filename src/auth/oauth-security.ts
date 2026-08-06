/**
 * OAuth security primitives: HMAC state signing, redirect URI validation,
 * PKCE verification. Ported from bullrundata-site so both hosted MCP
 * surfaces stay in lockstep.
 */

import crypto from 'crypto'

// ─── State signing (HMAC) ─────────────────────────────────────────────
//
// The OAuth `state` handed off to GitHub is a base64url-encoded JSON of
// { clientId, redirectUri, codeChallenge, originalState }. Without a
// signature, anyone can forge a state payload pointing at THEIR clientId
// and redirectUri and hijack the flow. HMAC-SHA256 binds each state to
// this deployment and lets the callback reject tampered payloads.

function stateSecret(): Buffer {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET missing — cannot sign OAuth state')
  return Buffer.from(secret, 'utf8')
}

export function signState(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', stateSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyState(token: string): Record<string, unknown> | null {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = crypto.createHmac('sha256', stateSecret()).update(body).digest('base64url')
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'base64url'), Buffer.from(expected, 'base64url'))) {
      return null
    }
  } catch {
    return null
  }
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

// ─── Redirect URI validation ──────────────────────────────────────────
//
// Blocks `javascript:`, `data:`, `file:`, etc. An attacker who controls
// `redirect_uri` on an OAuth flow can otherwise inject arbitrary schemes
// into the final callback and steal the auth code. HTTPS-only in prod;
// http allowed only for localhost dev clients.

const ALLOWED_LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

export function isValidRedirectUri(uri: string | undefined | null): boolean {
  if (!uri || typeof uri !== 'string') return false
  let parsed: URL
  try {
    parsed = new URL(uri)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
  if (parsed.protocol === 'http:' && !ALLOWED_LOCALHOST_HOSTS.has(parsed.hostname)) {
    return false
  }
  return true
}

// ─── PKCE verification (RFC 7636, S256) ───────────────────────────────
//
// Given a plaintext verifier and the stored challenge, checks that
// base64url(SHA256(verifier)) matches the challenge. If the stored
// challenge is skipped at token exchange, PKCE becomes decoration and
// intercepted auth codes are trivially redeemable.

export function verifyPkceChallenge(verifier: string, challenge: string): boolean {
  if (!verifier || !challenge) return false
  const computed = crypto.createHash('sha256').update(verifier).digest('base64url')
  try {
    const a = Buffer.from(computed, 'utf8')
    const b = Buffer.from(challenge, 'utf8')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
