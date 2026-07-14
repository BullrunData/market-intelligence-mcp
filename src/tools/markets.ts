import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiGet } from '../lib/api-client.js'

const readOnly = (title: string) => ({ title, readOnlyHint: true, destructiveHint: false } as const)

export function registerMarketTools(server: McpServer) {
  server.tool(
    'sectors_rotation',
    'Sector rotation signal — risk-on vs risk-off based on cyclical vs defensive S&P sector performance. Returns the rotation spread, current signal (RISK_ON / RISK_OFF / NEUTRAL), top leaders and laggards, and momentum data across 1w / 1m / 3m windows.',
    {},
    readOnly('Sector Rotation Signal'),
    async () => {
      const data = await apiGet('/api/v1/sectors/rotation')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'sectors_flows',
    'Per-sector accumulation and distribution signals — classifies each S&P sector ETF as ACCUMULATION, DISTRIBUTION, or NEUTRAL based on a proprietary composite of price and volume analysis. Surfaces sectors with sustained buying pressure, early distribution, or capitulation lows.',
    {
      lookback: z.number().default(14).describe('Analysis lookback window in trading days (default 14, range 5-50)'),
    },
    readOnly('Sector Money Flows'),
    async ({ lookback }) => {
      const params = new URLSearchParams()
      params.set('lookback', String(lookback))
      const data = await apiGet(`/api/v1/sectors/flows?${params.toString()}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'institutional_cftc',
    'Aggregate institutional futures positioning across major contracts. Returns long/short/net positions, directional bias, and an aggregate signal (RISK_ON / RISK_OFF / NEUTRAL) reflecting where institutional money is leaning.',
    {},
    readOnly('Institutional Positioning'),
    async () => {
      const data = await apiGet('/api/v1/institutional/cftc')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'cftc_contracts_list',
    'List available futures contracts for use with cftc_positioning_detail. Each entry indicates report_type — pass the contract name to cftc_positioning_detail for the full breakdown.',
    {},
    readOnly('CFTC Contracts List'),
    async () => {
      const data = await apiGet('/api/v1/institutional/cftc/contracts')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'cftc_positioning_detail',
    'Detailed positioning for a single contract or matching set, with smart-money breakdown and week-over-week change in long/short.',
    {
      contract: z.string().optional().describe('Contract name substring (case-insensitive). Examples: "GOLD", "NASDAQ", "10 YEAR U.S. TREASURY", "WHEAT". Omit to return a broad sample.'),
      limit: z.number().default(20).describe('Maximum contracts returned (default 20, max 500)'),
    },
    readOnly('Institutional Positioning Detail'),
    async ({ contract, limit }) => {
      const params = new URLSearchParams()
      if (contract) params.set('contract', contract)
      params.set('limit', String(limit))
      const data = await apiGet(`/api/v1/institutional/cftc/positioning?${params.toString()}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'institutional_tic',
    'Treasury International Capital (TIC) flows — net foreign purchases of US Treasuries and other long-term securities. Useful for tracking dollar demand and reserve manager behavior.',
    {},
    readOnly('Treasury TIC Flows'),
    async () => {
      const data = await apiGet('/api/v1/institutional/tic')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )
}
