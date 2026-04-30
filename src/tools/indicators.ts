import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiGet } from '../lib/api-client.js'

const READ_ONLY = { readOnlyHint: true, destructiveHint: false } as const

interface IndicatorRow {
  indicator: string
  value: number
  timestamp: string
  category: string
  source: string
  change: number | null
  changePercent: number | null
}

async function getByCategory(category: string): Promise<IndicatorRow[]> {
  const data = (await apiGet(`/api/v1/indicators?category=${encodeURIComponent(category)}`)) as IndicatorRow[]
  return data
}

export function registerIndicatorTools(server: McpServer) {
  server.tool(
    'economic_indicator',
    'Time series for any tracked economic indicator by series ID (e.g., VIXCLS, UNRATE, CPIAUCSL, T10Y2Y, MORTGAGE30US, BAMLH0A0HYM2). Returns daily date+value pairs over the requested range.',
    {
      series_id: z.string().describe('Series ID (FRED-style for FRED-sourced indicators, e.g., VIXCLS, UNRATE, DFF, CPIAUCSL, T10Y2Y, MORTGAGE30US)'),
      limit: z.number().default(30).describe('Number of observations to return (default 30)'),
      start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
    },
    READ_ONLY,
    async ({ series_id, limit, start_date }) => {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      if (start_date) params.set('start_date', start_date)
      const data = await apiGet(`/api/v1/indicators/${encodeURIComponent(series_id)}/timeseries?${params.toString()}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'list_indicators',
    'List all tracked indicators with current values, optionally filtered by category. Categories: Consumer, Debt, Economic Activity, Fed Policy, Financial Conditions, Housing, Inflation, Interest Rates, Labor Market, Manufacturing, Markets.',
    {
      category: z.string().optional().describe('Optional category filter (e.g., "Inflation", "Labor Market", "Housing")'),
    },
    READ_ONLY,
    async ({ category }) => {
      const path = category
        ? `/api/v1/indicators?category=${encodeURIComponent(category)}`
        : '/api/v1/indicators'
      const data = await apiGet(path)
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'interest_rates',
    'Current interest rates: Fed funds rate and all tracked Treasury / mortgage rate indicators.',
    {},
    READ_ONLY,
    async () => {
      const [fedPolicy, rates] = await Promise.all([
        getByCategory('Fed Policy'),
        getByCategory('Interest Rates'),
      ])
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ fed_policy: fedPolicy, interest_rates: rates }, null, 2),
        }],
      }
    },
  )

  server.tool(
    'inflation_data',
    'Current inflation indicators (CPI, Core CPI, PCE, etc — all entries in the Inflation category).',
    {},
    READ_ONLY,
    async () => {
      const data = await getByCategory('Inflation')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'employment_data',
    'Current labor market indicators (unemployment rate, nonfarm payrolls, initial claims, JOLTS, participation, average hourly earnings).',
    {},
    READ_ONLY,
    async () => {
      const data = await getByCategory('Labor Market')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'housing_data',
    'Current housing market indicators (mortgage rates, housing starts, building permits, sales prices, Case-Shiller).',
    {},
    READ_ONLY,
    async () => {
      const data = await getByCategory('Housing')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'yield_curve',
    'Yield curve snapshot: 10Y-2Y and 10Y-3M Treasury spreads with inversion check.',
    {},
    READ_ONLY,
    async () => {
      const [t2, t3m] = await Promise.all([
        apiGet('/api/v1/indicators/T10Y2Y').catch(() => null),
        apiGet('/api/v1/indicators/T10Y3M').catch(() => null),
      ]) as [IndicatorRow | null, IndicatorRow | null]
      const spread2 = t2?.value ?? null
      const spread3m = t3m?.value ?? null
      const inverted_10y2y = spread2 !== null && spread2 < 0
      const inverted_10y3m = spread3m !== null && spread3m < 0
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            spread_10y_2y: spread2,
            spread_10y_3m: spread3m,
            inverted_10y2y,
            inverted_10y3m,
            timestamp: t2?.timestamp ?? t3m?.timestamp ?? null,
          }, null, 2),
        }],
      }
    },
  )

  server.tool(
    'market_sentiment',
    'Market sentiment indicators (VIX, Financial Conditions Index, Consumer Sentiment, financial-stress measures).',
    {},
    READ_ONLY,
    async () => {
      const [markets, financial] = await Promise.all([
        getByCategory('Markets'),
        getByCategory('Financial Conditions'),
      ])
      const consumer = await getByCategory('Consumer').catch(() => [] as IndicatorRow[])
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            markets,
            financial_conditions: financial,
            consumer_sentiment: consumer,
          }, null, 2),
        }],
      }
    },
  )
}
