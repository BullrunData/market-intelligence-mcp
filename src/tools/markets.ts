import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiGet } from '../lib/api-client.js'

const READ_ONLY = { readOnlyHint: true, destructiveHint: false } as const

export function registerMarketTools(server: McpServer) {
  server.tool(
    'sectors_rotation',
    'Sector rotation signal — risk-on vs risk-off based on cyclical (XLK, XLY, XLF, XLI, XLC, XLB) vs defensive (XLP, XLU, XLV, XLRE) sector ETF performance. Returns the rotation spread, current signal (RISK_ON / RISK_OFF / NEUTRAL), top leaders and laggards, and full performance/momentum data for all 11 sector ETFs across 1w / 1m / 3m windows.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/api/v1/sectors/rotation')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'institutional_cftc',
    'CFTC Commitments of Traders — institutional positioning across major futures contracts (S&P 500 e-mini, Gold, etc). Returns long/short/net positions, directional bias, and an aggregate signal (RISK_ON / RISK_OFF / NEUTRAL) reflecting where institutional money is leaning.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/api/v1/institutional/cftc')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'institutional_tic',
    'Treasury International Capital (TIC) flows — net foreign purchases of US Treasuries and other long-term securities. Useful for tracking dollar demand and reserve manager behavior.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/api/v1/institutional/tic')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )
}
