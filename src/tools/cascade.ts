import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiGet } from '../lib/api-client.js'
import {
  getCatalystById,
  getCatalystsByCategory,
  listCatalysts,
  searchCatalysts,
  type CatalystTree,
  type CascadeEffect,
} from '../data/catalyst-trees.js'

const READ_ONLY = { readOnlyHint: true, destructiveHint: false } as const

/**
 * Enrich a catalyst tree's watchlist with live data from BullrunData API
 */
async function enrichWithLiveData(tree: CatalystTree): Promise<Record<string, unknown>> {
  const liveData: Record<string, unknown> = {}

  // Collect unique MCP tools referenced in watchlist
  const toolsToFetch = new Set<string>()
  for (const item of tree.watchlist) {
    if (item.mcpTool) toolsToFetch.add(item.mcpTool)
  }

  // Fetch live data in parallel
  const toolMap: Record<string, string> = {
    sectors_rotation: '/api/v1/sectors/rotation',
    institutional_cftc: '/api/v1/institutional/cftc',
    fed_stance: '/api/v1/dashboard/summary',
    recession_probability: '/api/v1/model/probability',
    recession_indicators: '/api/v1/dashboard/summary',
    interest_rates: '/api/v1/indicators?category=Interest%20Rates',
    yield_curve: '/api/v1/indicators/T10Y2Y',
    inflation_data: '/api/v1/indicators?category=Inflation',
    employment_data: '/api/v1/indicators?category=Labor%20Market',
    housing_data: '/api/v1/indicators?category=Housing',
    market_sentiment: '/api/v1/indicators?category=Markets',
    market_regime: '/api/v1/model/probability',
  }

  const fetches = Array.from(toolsToFetch).map(async (tool) => {
    const endpoint = toolMap[tool]
    if (!endpoint) return
    try {
      const data = await apiGet(endpoint)
      liveData[tool] = data
    } catch {
      liveData[tool] = { error: 'Unable to fetch live data' }
    }
  })

  await Promise.all(fetches)
  return liveData
}

/**
 * Flatten a cascade tree into a readable chain for text output
 */
function formatCascadeChain(effects: CascadeEffect[], depth = 0): string {
  const lines: string[] = []
  const indent = '  '.repeat(depth)

  for (const effect of effects) {
    lines.push(`${indent}[${effect.timeframe.toUpperCase()}] ${effect.name}`)
    lines.push(`${indent}  Confidence: ${effect.confidence}`)
    lines.push(`${indent}  Mechanism: ${effect.mechanism}`)

    if (effect.assetImpacts.length > 0) {
      const assets = effect.assetImpacts
        .map((a) => `${a.asset} ${a.direction === 'up' ? '\u2191' : a.direction === 'down' ? '\u2193' : '\u2195'}${a.magnitude}`)
        .join(', ')
      lines.push(`${indent}  Assets: ${assets}`)
    }

    if (effect.regionImpacts.length > 0) {
      const regions = effect.regionImpacts
        .map((r) => `${r.region} (${r.severity})`)
        .join(', ')
      lines.push(`${indent}  Regions: ${regions}`)
    }

    if (effect.secondaryEffects && effect.secondaryEffects.length > 0) {
      lines.push(formatCascadeChain(effect.secondaryEffects, depth + 1))
    }
  }

  return lines.join('\n')
}

export function registerCascadeTools(server: McpServer) {
  // ─── List all available catalysts ─────────────────────────
  server.tool(
    'cascade_list',
    'List all available macro catalyst scenarios in the Cascade Engine. Returns catalyst IDs, names, categories, and severity levels. Use a catalyst ID with cascade_analysis for the full chain reaction.',
    {},
    READ_ONLY,
    async () => {
      const catalysts = listCatalysts()
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            total: catalysts.length,
            catalysts,
            usage: 'Use cascade_analysis with a catalyst_id to get the full chain reaction, or cascade_search to find catalysts by keyword.',
          }, null, 2),
        }],
      }
    },
  )

  // ─── Full cascade analysis for a catalyst ─────────────────
  server.tool(
    'cascade_analysis',
    'Get the full chain reaction cascade for a macro catalyst scenario. Maps cause-effect chains across markets, regions, and asset classes with confidence levels, historical precedents, and live market data enrichment. Use cascade_list to see available catalysts.',
    {
      catalyst_id: z.string().describe(
        'The catalyst ID to analyze. Use cascade_list to see available IDs. Examples: "oil-supply-shock", "dollar-liquidity-squeeze", "fed-emergency-rate-cut", "us-recession-confirmed", "china-taiwan-escalation", "yield-curve-inversion", "credit-market-freeze", "em-currency-crisis", "trade-war-escalation", "sovereign-debt-crisis"'
      ),
      include_live_data: z.boolean().optional().default(true).describe(
        'Whether to enrich the cascade with live market data from BullrunData API (default: true)'
      ),
    },
    READ_ONLY,
    async ({ catalyst_id, include_live_data }) => {
      const tree = getCatalystById(catalyst_id)
      if (!tree) {
        const available = listCatalysts()
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              error: `Catalyst "${catalyst_id}" not found`,
              available_catalysts: available,
            }, null, 2),
          }],
        }
      }

      // Optionally enrich with live data
      let liveData: Record<string, unknown> = {}
      if (include_live_data) {
        try {
          liveData = await enrichWithLiveData(tree)
        } catch {
          liveData = { error: 'Unable to fetch live market data' }
        }
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            catalyst: tree,
            live_market_data: liveData,
            cascade_summary: formatCascadeChain(tree.primaryEffects),
          }, null, 2),
        }],
      }
    },
  )

  // ─── Search catalysts by keyword ──────────────────────────
  server.tool(
    'cascade_search',
    'Search catalyst scenarios by keyword. Matches against catalyst names, descriptions, categories, and trigger conditions. Use this when you\'re not sure which catalyst applies to a given situation.',
    {
      query: z.string().describe(
        'Search query — e.g., "oil", "dollar", "china", "recession", "credit", "currency"'
      ),
    },
    READ_ONLY,
    async ({ query }) => {
      const results = searchCatalysts(query)
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            query,
            matches: results.length,
            catalysts: results.map((c) => ({
              id: c.id,
              name: c.name,
              category: c.category,
              severity: c.severity,
              description: c.description,
              triggerConditions: c.triggerConditions,
            })),
          }, null, 2),
        }],
      }
    },
  )

  // ─── Get catalysts by category ────────────────────────────
  server.tool(
    'cascade_by_category',
    'Get all catalyst scenarios in a specific category. Categories: geopolitical, monetary, credit, commodity, currency, contagion, structural.',
    {
      category: z.enum(['geopolitical', 'monetary', 'credit', 'commodity', 'currency', 'contagion', 'structural']).describe(
        'The category to filter by'
      ),
    },
    READ_ONLY,
    async ({ category }) => {
      const results = getCatalystsByCategory(category)
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            category,
            matches: results.length,
            catalysts: results.map((c) => ({
              id: c.id,
              name: c.name,
              severity: c.severity,
              description: c.description,
            })),
          }, null, 2),
        }],
      }
    },
  )
}
