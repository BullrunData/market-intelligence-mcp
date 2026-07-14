/**
 * BullrunData API Client
 * Thin fetch() wrapper — all intelligence runs on the API, not here.
 */

const API_BASE = process.env.BULLRUNDATA_API_URL || 'https://api.bullrundata.com'
const API_KEY = process.env.BULLRUNDATA_API_KEY || ''

export async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'X-API-Key': API_KEY,
      'Accept': 'application/json',
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`BullrunData API error: ${res.status} ${body}`)
  }
  return res.json()
}

export async function apiPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`BullrunData API error: ${res.status} ${text}`)
  }
  return res.json()
}
