import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiGet } from '../lib/api-client.js'

const READ_ONLY = { readOnlyHint: true, destructiveHint: false } as const

export function registerFredTools(server: McpServer) {
  server.tool(
    'economic_indicator',
    'Get time series data for any economic indicator by series ID (e.g., GDP, UNRATE, CPIAUCSL). Returns date-value pairs.',
    {
      series_id: z.string().describe('Economic indicator series ID (e.g., GDP, UNRATE, CPIAUCSL, DFF)'),
      limit: z.number().default(10).describe('Number of observations to return (default 10)'),
      start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      units: z.string().optional().describe('Data transformation: lin (levels), pch (% change), pc1 (YoY % change)'),
    },
    READ_ONLY,
    async ({ series_id, limit, start_date, units }) => {
      let path = `/v1/fred/indicator/${series_id}?limit=${limit}`
      if (start_date) path += `&start_date=${start_date}`
      if (units) path += `&units=${units}`
      const data = await apiGet(path)
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'search_indicators',
    'Search for economic indicators by keyword. Returns matching series with ID, name, frequency, and last updated date.',
    {
      query: z.string().describe('Search query (e.g., "unemployment rate", "consumer price index")'),
      limit: z.number().default(10).describe('Max results (default 10)'),
    },
    READ_ONLY,
    async ({ query, limit }) => {
      const data = await apiGet(`/v1/fred/search?q=${encodeURIComponent(query)}&limit=${limit}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'interest_rates',
    'Get current interest rates: Fed funds, 2Y/5Y/10Y/30Y Treasury yields, 3M T-Bill, prime rate, 30-year and 15-year mortgage rates.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/v1/fred/interest-rates')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'inflation_data',
    'Get current inflation indicators: CPI, Core CPI, PCE, Core PCE, 10-year breakeven inflation, and consumer inflation expectations.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/v1/fred/inflation')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'employment_data',
    'Get current employment indicators: unemployment rate, nonfarm payrolls, initial claims, JOLTS openings and quits rate, participation rate, average hourly earnings.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/v1/analysis/employment')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'housing_data',
    'Get current housing market data: 30Y and 15Y mortgage rates, housing starts, building permits, median sales price, Case-Shiller index, existing home sales.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/v1/analysis/housing')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'yield_curve',
    'Get yield curve analysis: 10Y-2Y and 10Y-3M spreads, all Treasury yields, and inversion detection.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/v1/analysis/yield-curve')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'market_sentiment',
    'Get market sentiment indicators: VIX (fear index), Financial Conditions Index, Financial Stress Index, and Consumer Sentiment.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/v1/analysis/market-sentiment')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )
}
