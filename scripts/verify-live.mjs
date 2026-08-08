#!/usr/bin/env node
/**
 * verify-live.mjs — comprehensive live-probe smoke test for the BullrunData
 * hosted MCP surface. Runs 26 checks across topology, OAuth security,
 * content parity, MCP protocol lifecycle, dynamic client registration, and
 * the 6-point tool-description rubric for Pro-tier composite models.
 *
 * Usage:
 *   node scripts/verify-live.mjs                    # run all checks
 *   node scripts/verify-live.mjs --skip-auth        # skip API-key-required checks
 *
 * Env vars:
 *   BULLRUNDATA_API_KEY   — required for MCP protocol checks (initialize,
 *                           tools/list, tools/call, session lifecycle)
 *
 * Exit codes:
 *   0   all checks passed
 *   1   one or more checks failed (details in output)
 *
 * When to run:
 *   - Before pushing to `market-intelligence-mcp` or `bullrundata-site`
 *   - After Vercel deploy lands, to confirm no regressions
 *   - Weekly, to catch external-provider drift (GitHub OAuth app config,
 *     Anthropic listing edits, DNS)
 *
 * Design notes:
 *   - Probes LIVE production URLs only. Read-only, safe to run anytime.
 *   - Fails LOUD (non-zero exit) on any regression — never silently degrades.
 *   - Distinguishes auth-required checks so CI can run --skip-auth without a
 *     key and still catch the topology + unauth-security regressions.
 */

import { readFileSync, existsSync } from 'node:fs'

// Minimal .env loader — script is intentionally zero-dep so it can run
// from any repo without a package install. Reads .env.local and .env if
// present in CWD; existing process.env values take precedence.
for (const path of ['.env.local', '.env']) {
  if (!existsSync(path)) continue
  const src = readFileSync(path, 'utf8')
  for (const rawLine of src.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const k = line.slice(0, eq).trim()
    let v = line.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (process.env[k] === undefined) process.env[k] = v
  }
}

const SKIP_AUTH = process.argv.includes('--skip-auth')

const RETIRED_SITE_MCP = 'https://bullrundata.com/api/mcp'
const RETIRED_SITE_DISCOVERY = 'https://bullrundata.com/.well-known/oauth-authorization-server'
const MARKET_BASE = 'https://market.bullrundata.com'
const SITE_BASE = 'https://bullrundata.com'

const isTTY = process.stdout.isTTY
const c = {
  red:   (s) => isTTY ? `\x1b[31m${s}\x1b[0m` : s,
  green: (s) => isTTY ? `\x1b[32m${s}\x1b[0m` : s,
  yellow:(s) => isTTY ? `\x1b[33m${s}\x1b[0m` : s,
  dim:   (s) => isTTY ? `\x1b[2m${s}\x1b[0m` : s,
}

const results = []
function record(section, name, pass, detail = '') {
  results.push({ section, name, pass, detail, skipped: false })
  const tag = pass ? c.green('[PASS]') : c.red('[FAIL]')
  const line = `  ${tag} ${name}${detail ? c.dim(' — ' + detail) : ''}`
  console.log(line)
}

function skip(section, name, reason = '') {
  results.push({ section, name, pass: true, detail: reason, skipped: true })
  console.log(`  ${c.yellow('[SKIP]')} ${name}${reason ? c.dim(' — ' + reason) : ''}`)
}

async function fetchStatus(url, init = {}) {
  try {
    const r = await fetch(url, init)
    return { status: r.status, headers: r.headers, text: async () => r.text() }
  } catch (e) {
    return { status: 0, error: e.message }
  }
}

// ─── Tool description rubric spec ────────────────────────────────────
// Pro-tier composite algo models must satisfy the 6-point rubric enforced
// below. Adding a new model? Add its entry here — the pre-push hook fails
// the push if the description regresses. Full rationale: memory
// feedback_model_shipping_pattern.md.
const PRO_TIER_MODEL_TOOLS = {
  housing_cycle: {
    outputStates: ['expansion', 'topping', 'mid_cycle', 'bottoming', 'contraction'],
    componentGroups: ['supply', 'demand', 'price', 'affordability', 'cost of capital'],
    useCaseKeywords: ['single-family'],
    boundaryPhrase: 'multifamily_cycle',       // must redirect MF questions elsewhere
  },
  multifamily_cycle: {
    outputStates: ['expansion', 'topping', 'mid_cycle', 'bottoming', 'contraction'],
    componentGroups: ['rent-demand', 'rent-pricing-power', 'supply-pressure', 'debt-cost', 'credit-stress'],
    useCaseKeywords: ['multifamily', 'MF'],
    triggerKeywords: ['MULTIFAMILY', 'MF', 'APARTMENT', 'RENTAL PROPERTY'],  // ALL-CAPS routing hints required
  },
  refi_window: {
    outputStates: ['refi_now', 'refi_soon', 'wait_3mo', 'wait_6mo', 'unattractive'],
    componentGroups: ['rate-level', 'rate-trajectory', 'fed-path', 'credit-availability', 'duration-spread'],
    useCaseKeywords: ['refi', 'rollover'],
  },
  cre_stress: {
    outputStates: ['calm', 'building', 'elevated', 'severe', 'crisis'],
    componentGroups: ['delinquency', 'bank-willingness', 'cost-of-capital', 'systemic-stress'],
    useCaseKeywords: ['distress', 'CRE'],
    directionContract: true,   // requires explicit "HIGHER = MORE STRESS" or score_direction phrase
  },
  rent_price_divergence: {
    outputStates: ['expansion', 'widening', 'balanced', 'narrowing', 'compression'],
    componentGroups: ['rent-growth', 'price-growth', 'divergence-magnitude', 'divergence-momentum'],
    useCaseKeywords: ['multifamily', 'NOI'],
  },
  cap_rate_direction: {
    outputStates: ['compressing_strong', 'compressing', 'stable', 'expanding', 'expanding_strong'],
    componentGroups: ['rate-environment', 'credit-conditions', 'mbs-stress', 'risk-premium'],
    useCaseKeywords: ['cap rate', 'real-estate'],
  },
}

const DESC_MIN_CHARS = 500       // under this = too thin, Claude wastes tokens on trial calls
const DESC_MAX_CHARS = 1500      // over this = bloated, dilutes signal

function checkToolDescriptions(toolsList) {
  console.log('\n─── Tool description rubric (6-point) ───')
  const byName = Object.fromEntries((toolsList || []).map((t) => [t.name, t]))

  for (const [toolName, spec] of Object.entries(PRO_TIER_MODEL_TOOLS)) {
    const tool = byName[toolName]
    if (!tool) {
      record('rubric', `${toolName} present in tools/list`, false, 'tool missing from live tools/list')
      continue
    }
    const desc = tool.description || ''
    const missing = []

    // (1) Pro tier requirement stated
    if (!/pro\s*tier|requires\s*pro/i.test(desc)) missing.push('Pro tier requirement')

    // (2) All output states listed
    const missingStates = spec.outputStates.filter((s) => !desc.includes(s))
    if (missingStates.length) missing.push(`output states: ${missingStates.join(',')}`)

    // (3) All component groups listed
    const missingComps = spec.componentGroups.filter((c) => !desc.toLowerCase().includes(c.toLowerCase()))
    if (missingComps.length) missing.push(`components: ${missingComps.join(',')}`)

    // (4) Output shape specified
    const hasShape = /composite\s*score\s*0-100/i.test(desc) && /sub-scores/i.test(desc) && /confidence/i.test(desc)
    if (!hasShape) missing.push('output shape (composite/sub-scores/confidence)')

    // (5) Use case keywords
    const missingUseCase = spec.useCaseKeywords.filter((k) => !new RegExp(`\\b${k}\\b`, 'i').test(desc))
    if (missingUseCase.length) missing.push(`use case keywords: ${missingUseCase.join(',')}`)

    // (6) Free tier 403 + upgrade link
    if (!/free\s*tier/i.test(desc) || !/403/.test(desc) || !desc.includes('bullrundata.com/pricing')) {
      missing.push('free-tier 403 + upgrade link')
    }

    // Bonus: trigger-keyword-in-CAPS rule for tools with domain overlap
    if (spec.triggerKeywords) {
      const missingTriggers = spec.triggerKeywords.filter((k) => !desc.includes(k))
      if (missingTriggers.length) missing.push(`ALL-CAPS trigger keywords: ${missingTriggers.join(',')}`)
    }

    // Bonus: boundary phrase — the OTHER tool in an overlap must redirect elsewhere
    if (spec.boundaryPhrase && !desc.includes(spec.boundaryPhrase)) {
      missing.push(`boundary redirect to ${spec.boundaryPhrase}`)
    }

    // Bonus: direction contract for inverted-direction models
    if (spec.directionContract) {
      const hasDirection = /higher\s*=\s*more\s*stress/i.test(desc) || /score_direction/.test(desc) || /HIGHER\s*=\s*MORE/.test(desc)
      if (!hasDirection) missing.push('direction contract (higher = more stress phrase or score_direction field)')
    }

    // Bonus: length range
    if (desc.length < DESC_MIN_CHARS) missing.push(`too short (${desc.length} < ${DESC_MIN_CHARS})`)
    if (desc.length > DESC_MAX_CHARS) missing.push(`too long (${desc.length} > ${DESC_MAX_CHARS})`)

    const pass = missing.length === 0
    record('rubric', `${toolName} description satisfies 6-point rubric`, pass,
      pass ? `${desc.length} chars, all checks pass` : `missing: ${missing.join('; ')}`)
  }
}

// ─── Section 1: Deployment topology ──────────────────────────────────
async function checkTopology() {
  console.log('\n─── Deployment topology ───')

  let r = await fetchStatus(RETIRED_SITE_MCP)
  record('topology', 'site MCP retired (bullrundata.com/api/mcp → 404)',
    r.status === 404, `got ${r.status}`)

  r = await fetchStatus(RETIRED_SITE_DISCOVERY)
  record('topology', 'site OAuth discovery retired (bullrundata.com/.well-known → 404)',
    r.status === 404, `got ${r.status}`)

  r = await fetchStatus(`${MARKET_BASE}/health`)
  record('topology', 'market.bullrundata.com/health live',
    r.status === 200, `got ${r.status}`)

  r = await fetchStatus(`${MARKET_BASE}/.well-known/oauth-authorization-server`)
  const body = r.status === 200 ? await r.text() : ''
  const hasIssuer = body.includes(`"issuer":"${MARKET_BASE}"`)
  record('topology', 'market OAuth discovery live + correct issuer',
    r.status === 200 && hasIssuer, `status ${r.status}, issuer match ${hasIssuer}`)
}

// ─── Section 2: OAuth security controls ──────────────────────────────
async function checkSecurity() {
  console.log('\n─── OAuth security controls ───')

  // /authorize with valid redirect_uri should 302 to GitHub
  let r = await fetchStatus(`${MARKET_BASE}/authorize?client_id=verify&redirect_uri=https://claude.ai/api/mcp/auth_callback&state=x&code_challenge=y`, { redirect: 'manual' })
  const loc = r.headers?.get('location') || ''
  record('security', '/authorize with valid redirect_uri → 302 to GitHub',
    r.status === 302 && loc.startsWith('https://github.com/login/oauth/authorize'),
    `status ${r.status}, redirect starts with github ${loc.startsWith('https://github.com')}`)

  // State should be HMAC-signed (contains a dot separator)
  const url = new URL(loc || 'https://x/x')
  const state = url.searchParams.get('state') || ''
  const looksSigned = state.includes('.') && state.split('.').length === 2
  record('security', 'OAuth state is HMAC-signed (body.signature format)',
    looksSigned, `state prefix: ${state.slice(0, 20)}...`)

  // /authorize with javascript: scheme should 400
  r = await fetchStatus(`${MARKET_BASE}/authorize?client_id=verify&redirect_uri=javascript:alert(1)&state=x&code_challenge=y`)
  record('security', '/authorize rejects javascript: redirect_uri',
    r.status === 400, `got ${r.status}`)

  // /authorize with http://attacker.com should 400 (http only allowed for localhost)
  r = await fetchStatus(`${MARKET_BASE}/authorize?client_id=verify&redirect_uri=http://attacker.com&state=x&code_challenge=y`)
  record('security', '/authorize rejects http://<non-localhost> redirect_uri',
    r.status === 400, `got ${r.status}`)

  // /github/callback with tampered state should reject (not 302 to attacker)
  r = await fetchStatus(`${MARKET_BASE}/github/callback?code=fake&state=tampered_unsigned_payload`)
  record('security', '/github/callback rejects tampered/unsigned state',
    r.status >= 400 && r.status < 600, `got ${r.status}`)

  // CORS: unauthorized origin should NOT get ACAO header
  r = await fetchStatus(`${MARKET_BASE}/mcp`, {
    method: 'OPTIONS',
    headers: { 'Origin': 'https://evil.example.com', 'Access-Control-Request-Method': 'POST' },
  })
  const evilACAO = r.headers?.get('access-control-allow-origin') || ''
  record('security', 'CORS blocks unlisted origin (evil.example.com)',
    !evilACAO || evilACAO === 'null', `ACAO='${evilACAO}'`)

  // CORS: claude.ai should get ACAO reflected
  r = await fetchStatus(`${MARKET_BASE}/mcp`, {
    method: 'OPTIONS',
    headers: { 'Origin': 'https://claude.ai', 'Access-Control-Request-Method': 'POST' },
  })
  const claudeACAO = r.headers?.get('access-control-allow-origin') || ''
  record('security', 'CORS reflects allowlisted origin (claude.ai)',
    claudeACAO === 'https://claude.ai', `ACAO='${claudeACAO}'`)
}

// ─── Section 3: Public content / copy consistency ────────────────────
async function checkContent() {
  console.log('\n─── Public content / copy consistency ───')

  const [homepage, llmsTxt, skillMd] = await Promise.all([
    fetch(SITE_BASE).then(r => r.text()).catch(() => ''),
    fetch(`${SITE_BASE}/llms.txt`).then(r => r.text()).catch(() => ''),
    fetch(`${SITE_BASE}/skill.md`).then(r => r.text()).catch(() => ''),
  ])

  const STALE = 'bullrundata.com/api/mcp'
  const CANONICAL = 'market.bullrundata.com/mcp'

  record('content', 'homepage has no stale bullrundata.com/api/mcp refs',
    homepage.length > 0 && !homepage.includes(STALE),
    homepage.length === 0 ? 'homepage fetch failed' : `stale count: ${(homepage.match(new RegExp(STALE, 'g')) || []).length}`)

  record('content', 'homepage mentions canonical market.bullrundata.com/mcp',
    homepage.includes(CANONICAL), `canonical count: ${(homepage.match(new RegExp(CANONICAL, 'g')) || []).length}`)

  record('content', 'llms.txt shows canonical URL',
    llmsTxt.includes(CANONICAL) && !llmsTxt.includes(STALE),
    `canonical=${llmsTxt.includes(CANONICAL)}, stale=${llmsTxt.includes(STALE)}`)

  record('content', 'skill.md shows canonical URL',
    skillMd.includes(CANONICAL) && !skillMd.includes(STALE),
    `canonical=${skillMd.includes(CANONICAL)}, stale=${skillMd.includes(STALE)}`)

  const dash = await fetchStatus(`${SITE_BASE}/dashboard`, { redirect: 'manual' })
  record('content', 'dashboard route still works (200 or 307 to login)',
    dash.status === 200 || dash.status === 307, `got ${dash.status}`)
}

// ─── Section 4: MCP protocol lifecycle (requires API key) ────────────
async function checkMcpProtocol() {
  console.log('\n─── MCP protocol lifecycle ───')

  const key = process.env.BULLRUNDATA_API_KEY
  if (!key) {
    skip('mcp', 'MCP protocol lifecycle (5 checks)',
      'BULLRUNDATA_API_KEY not set — export it or run from a repo whose .env.local has it')
    return
  }

  const base = `${MARKET_BASE}/mcp`
  const H = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'Authorization': 'Bearer ' + key,
  }

  // 1. initialize
  let r = await fetchStatus(base, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'verify-live', version: '1.0' } },
    }),
  })
  const sessId = r.headers?.get('mcp-session-id')
  record('mcp', 'initialize → 200 with mcp-session-id',
    r.status === 200 && !!sessId, `status ${r.status}, session ${sessId?.slice(0, 12) || 'none'}`)

  if (!sessId) return

  const H2 = { ...H, 'mcp-session-id': sessId }

  // 2. tools/list — expect 27 tools
  r = await fetchStatus(base, {
    method: 'POST', headers: H2,
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
  })
  let toolCount = 0
  let toolsList = []
  if (r.status === 200) {
    const txt = await r.text()
    try {
      const json = JSON.parse(txt.replace(/^event: message\ndata: /, '').trim())
      toolsList = json.result?.tools || []
      toolCount = toolsList.length
    } catch { /* leave 0 */ }
  }
  record('mcp', 'tools/list → 32 registered tools',
    r.status === 200 && toolCount === 32, `status ${r.status}, tool count ${toolCount}`)

  // 2b. Tool description rubric linter — mechanically enforce the 6-point
  // discoverability contract for every Pro-tier model tool. Prevents the
  // 2026-08-08 multifamily_cycle vs housing_cycle miss where soft "best used
  // for X" language failed to steer Claude away from the wrong tool.
  // Pattern spec: feedback_model_shipping_pattern.md
  checkToolDescriptions(toolsList)

  // 3. tools/call dashboard_summary — expect real data with recession.probability field
  r = await fetchStatus(base, {
    method: 'POST', headers: H2,
    body: JSON.stringify({
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'dashboard_summary', arguments: {} },
    }),
  })
  let hasProbability = false
  if (r.status === 200) {
    const txt = await r.text()
    try {
      const json = JSON.parse(txt.replace(/^event: message\ndata: /, '').trim())
      const content = json.result?.content?.[0]?.text || ''
      hasProbability = /"probability"\s*:\s*[0-9]/.test(content)
    } catch { /* leave false */ }
  }
  record('mcp', 'tools/call dashboard_summary returns real data (recession.probability field)',
    r.status === 200 && hasProbability, `status ${r.status}, has probability ${hasProbability}`)

  // 4. session reuse — second tools/list on same session
  r = await fetchStatus(base, {
    method: 'POST', headers: H2,
    body: JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/list' }),
  })
  record('mcp', 'session reuse — second call on same session ID',
    r.status === 200, `got ${r.status}`)

  // 5. session close (DELETE)
  r = await fetchStatus(base, { method: 'DELETE', headers: H2 })
  record('mcp', 'session close (DELETE) → 200 or 204',
    r.status === 200 || r.status === 204, `got ${r.status}`)
}

// ─── Section 5: Dynamic client registration ──────────────────────────
async function checkRegister() {
  console.log('\n─── Dynamic client registration ───')

  const r = await fetch(`${MARKET_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'verify-live-audit',
      redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
    }),
  })
  let hasClientId = false
  if (r.status === 201) {
    try {
      const json = await r.json()
      hasClientId = typeof json.client_id === 'string' && json.client_id.length > 0
    } catch { /* leave false */ }
  }
  record('register', 'POST /register → 201 with client_id',
    r.status === 201 && hasClientId, `status ${r.status}, client_id present ${hasClientId}`)
}

// ─── Main ────────────────────────────────────────────────────────────
(async () => {
  console.log(c.dim(`verify-live.mjs — ${new Date().toISOString()}`))
  console.log(c.dim(SKIP_AUTH ? '(--skip-auth mode)' : '(full run)'))

  await checkTopology()
  await checkSecurity()
  await checkContent()
  if (!SKIP_AUTH) {
    await checkMcpProtocol()
  } else {
    console.log('\n─── MCP protocol lifecycle ───')
    console.log(c.yellow('  [SKIP] --skip-auth — set BULLRUNDATA_API_KEY and drop the flag to run these'))
  }
  await checkRegister()

  const skipped = results.filter(r => r.skipped).length
  const passed = results.filter(r => r.pass && !r.skipped).length
  const failed = results.filter(r => !r.pass).length
  const total = results.length

  console.log('\n─── Summary ───')
  const parts = [`Total: ${total}`, c.green(`Passed: ${passed}`)]
  if (skipped > 0) parts.push(c.yellow(`Skipped: ${skipped}`))
  parts.push(failed > 0 ? c.red(`Failed: ${failed}`) : 'Failed: 0')
  console.log('  ' + parts.join('   '))

  if (failed > 0) {
    console.log('\n' + c.red('FAILED CHECKS:'))
    for (const r of results.filter(r => !r.pass)) {
      console.log(c.red(`  [${r.section}] ${r.name}  ${r.detail ? '(' + r.detail + ')' : ''}`))
    }
    process.exit(1)
  }

  if (skipped > 0) {
    console.log('\n' + c.yellow(`All ${passed} checks passed (${skipped} skipped). Safe to push, but re-run with full auth before shipping OAuth/MCP changes.`))
  } else {
    console.log('\n' + c.green(`All ${passed} checks passed. Safe to push.`))
  }
  process.exit(0)
})().catch((e) => {
  console.error(c.red('\nverify-live crashed:'), e)
  process.exit(1)
})
