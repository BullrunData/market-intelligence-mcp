import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiGet } from '../lib/api-client.js'

const readOnly = (title: string) => ({ title, readOnlyHint: true, destructiveHint: false } as const)

interface IndicatorRow {
  indicator: string
  value: number
  timestamp: string
  category: string
  source: string
  change: number | null
  changePercent: number | null
}

async function getByCategory(category: string, includeChange = false): Promise<IndicatorRow[]> {
  const suffix = includeChange ? '&include_change=true' : ''
  const data = (await apiGet(`/api/v1/indicators?category=${encodeURIComponent(category)}${suffix}`)) as IndicatorRow[]
  return data
}

export function registerIndicatorTools(server: McpServer) {
  server.tool(
    'economic_indicator',
    'Time series for any tracked economic indicator by series ID (e.g., VIXCLS, UNRATE, CPIAUCSL, T10Y2Y, MORTGAGE30US, BAMLH0A0HYM2). Real-estate coverage includes housing starts (HOUST, HOUST5F for multifamily), permits (PERMIT, PERMIT5), FHFA home price index (USSTHPI), rental/homeowner vacancy (RRVRUSQ156N, RHVRUSQ156N), mortgage delinquency (DRSFRMACBS), CRE delinquency (DRCRELEXFACBS), CRE bank tightening (SUBLPDRCSM multifamily, SUBLPDRCSC construction), and CPI shelter (CUSR0000SEHA rent, CUSR0000SEHC owners\' equivalent rent). Returns date+value pairs. Use start_date + end_date for explicit period-over-period comparisons; falls back to `range` for trailing windows.',
    {
      series_id: z.string().describe('Series ID (e.g., VIXCLS, UNRATE, DFF, CPIAUCSL, T10Y2Y, MORTGAGE30US, HOUST5F, USSTHPI, DRCRELEXFACBS, CUSR0000SEHC). Aliases like MF_STARTS, FHFA_HPI, OER, CRE_DELINQUENCY resolve to canonical IDs.'),
      limit: z.number().optional().describe('Optional cap on observations returned (1-5000, most recent kept). Omit for full range.'),
      start_date: z.string().optional().describe('Start date YYYY-MM-DD. When provided, overrides `range`.'),
      end_date: z.string().optional().describe('End date YYYY-MM-DD. Defaults to today when start_date is set.'),
      range: z.string().optional().describe('Trailing window: 1m, 3m, 6m, 1y, 2y, 5y, max. Used only when start_date is omitted. Default: 1y.'),
    },
    readOnly('Economic Indicator Time Series'),
    async ({ series_id, limit, start_date, end_date, range }) => {
      const params = new URLSearchParams()
      if (limit !== undefined) params.set('limit', String(limit))
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      if (range) params.set('range', range)
      const qs = params.toString()
      const path = `/api/v1/indicators/${encodeURIComponent(series_id)}/timeseries${qs ? '?' + qs : ''}`
      const data = await apiGet(path)
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'list_indicators',
    'List all tracked indicators with current values, optionally filtered by category. Categories: Consumer, Debt, Economic Activity, Fed Policy, Financial Conditions, Housing, Inflation, Interest Rates, Labor Market, Manufacturing, Markets.',
    {
      category: z.string().optional().describe('Optional category filter (e.g., "Inflation", "Labor Market", "Housing")'),
    },
    readOnly('List All Indicators'),
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
    'Current interest rates with weekly momentum: Fed funds rate and all tracked Treasury / mortgage rate indicators. Each entry includes `change` and `changePercent` vs last week so trend is visible inline (no need to call economic_indicator for a series-level trend check).',
    {},
    readOnly('Interest Rates'),
    async () => {
      const [fedPolicy, rates] = await Promise.all([
        getByCategory('Fed Policy', true),
        getByCategory('Interest Rates', true),
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
    'Current inflation indicators (CPI, Core CPI, PCE, etc — all entries in the Inflation category) with weekly momentum for each.',
    {},
    readOnly('Inflation Data'),
    async () => {
      const data = await getByCategory('Inflation', true)
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'employment_data',
    'Current labor market indicators (unemployment rate, nonfarm payrolls, initial claims, JOLTS, participation, average hourly earnings) with weekly momentum for each.',
    {},
    readOnly('Employment Data'),
    async () => {
      const data = await getByCategory('Labor Market', true)
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'housing_data',
    'Current housing market indicators (mortgage rates, housing starts, building permits, sales prices, Case-Shiller) with weekly momentum. Each entry includes `change` and `changePercent` vs last week so trend is visible inline.',
    {},
    readOnly('Housing Data'),
    async () => {
      const data = await getByCategory('Housing', true)
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'yield_curve',
    'Yield curve snapshot: 10Y-2Y and 10Y-3M Treasury spreads with inversion check.',
    {},
    readOnly('Yield Curve Spreads'),
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
    readOnly('Market Sentiment'),
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
