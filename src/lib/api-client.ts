/**
 * BullrunData API Client
 * Thin fetch() wrapper — all intelligence runs on the API, not here.
 */

const API_BASE = process.env.BULLRUNDATA_API_URL || 'https://api.bullrundata.com'

export async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'X-API-Key': process.env.BULLRUNDATA_API_KEY || '',
      'Accept': 'application/json',
    },
  })
  if (!res.ok) {
    // Preserve the raw JSON body so 403/429 responses expose the upgrade CTA
    // + pricing URL to the calling tool. Claude reads the error text and can
    // surface the upgrade prompt to the user in-conversation.
    const body = await res.text().catch(() => '')
    throw new Error(`BullrunData API ${res.status}: ${body || res.statusText}`)
  }
  const data: unknown = await res.json()
  // Rate-limit warning at 80% / 90% — bubble the header text into the response
  // payload so Claude sees "You've used 80% of today's quota..." and warns
  // the user before a hard 429 arrives mid-conversation. Only wrap plain
  // objects; arrays and primitives stay unchanged so downstream shape
  // assumptions hold.
  const warning = res.headers.get('x-ratelimit-warning')
  if (
    warning
    && typeof data === 'object'
    && data !== null
    && !Array.isArray(data)
  ) {
    return { _warning: warning, ...(data as Record<string, unknown>) }
  }
  return data
}

export async function apiPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.BULLRUNDATA_API_KEY || '',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    // Same rationale as apiGet — preserve body for 403/429 upgrade CTA.
    const text = await res.text().catch(() => '')
    throw new Error(`BullrunData API ${res.status}: ${text || res.statusText}`)
  }
  return res.json()
}
