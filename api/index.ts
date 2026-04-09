import type { VercelRequest, VercelResponse } from '@vercel/node'
import app from '../src/http-server'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
  const url = new URL(req.url || '/', `${protocol}://${host}`)

  const headers = new Headers()
  for (const [key, val] of Object.entries(req.headers)) {
    if (typeof val === 'string') headers.set(key, val)
    else if (Array.isArray(val)) val.forEach(v => headers.append(key, v))
  }

  let body: string | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  }

  const request = new Request(url.toString(), {
    method: req.method || 'GET',
    headers,
    body,
  })

  const response = await app.fetch(request)

  const respHeaders: Record<string, string> = {}
  response.headers.forEach((val, key) => { respHeaders[key] = val })
  res.writeHead(response.status, respHeaders)
  res.end(await response.text())
}
