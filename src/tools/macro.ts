import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiGet } from '../lib/api-client.js'

const readOnly = (title: string) => ({ title, readOnlyHint: true, destructiveHint: false } as const)

interface ModelProbability {
  probability: number
  trend: string
  confidence: string
  timestamp: string
  components: Record<string, number>
  confirmation: {
    score: number
    status: string
    confidence: string
    triggered: string[]
    message: string
    values: Record<string, { value: number; threshold: number; triggered: boolean }>
    fed_stance: string
    fed_funds_rate: number
    recommendation: string
    risk_color: string
    high_risk_indicators: string[]
    leading_probability: number
  }
}

interface DashboardSummary {
  timestamp: string
  recession: {
    probability: number
    risk_level: string
    risk_color: string
    recommendation: string
    high_risk_indicators: string[]
    leading_probability: number
  }
  regime: {
    market_regime: string
    fed_stance: string
    fed_funds_rate: number
  }
  key_metrics: Record<string, { label: string; value: number; unit: string }>
  indicators_count: number
  data_freshness: string
}

export function registerMacroTools(server: McpServer) {
  server.tool(
    'dashboard_summary',
    'One-call macro snapshot with a curated block of key economic indicators. Best starting point for any macro question. Free tier sees indicators + counts; recession probability, market regime, and Fed stance blocks return a Pro-upgrade placeholder — upgrade at https://bullrundata.com/pricing for the full composite.',
    {},
    readOnly('Macro Dashboard Summary'),
    async () => {
      const data = await apiGet('/api/v1/dashboard/summary')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'recession_probability',
    'Requires Pro tier. Current US recession probability (0-100%) from a proprietary weighted model. Returns probability, trend (early/mid/late_cycle/recession), confidence, confirmation layer, Fed stance, and recommendation. Free tier receives a 403 with upgrade link (https://bullrundata.com/pricing).',
    {},
    readOnly('Recession Probability Score'),
    async () => {
      const data = await apiGet('/api/v1/model/probability')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'recession_indicators',
    'Latest values for the curated key metrics block from the dashboard summary — with labels and units.',
    {},
    readOnly('Recession Indicators'),
    async () => {
      const data = (await apiGet('/api/v1/dashboard/summary')) as DashboardSummary
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            indicators: data.key_metrics,
            data_freshness: data.data_freshness,
            indicators_count: data.indicators_count,
          }, null, 2),
        }],
      }
    },
  )

  server.tool(
    'fed_stance',
    'Requires Pro tier. Current Federal Reserve monetary policy stance (TIGHTENING, EASING, NEUTRAL, CRISIS) with the live Fed funds rate. Sourced from the recession-model composite endpoint. Free tier receives a 403 with upgrade link (https://bullrundata.com/pricing).',
    {},
    readOnly('Federal Reserve Stance'),
    async () => {
      const data = (await apiGet('/api/v1/model/probability')) as ModelProbability
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            fed_stance: data.confirmation.fed_stance,
            fed_funds_rate: data.confirmation.fed_funds_rate,
            timestamp: data.timestamp,
          }, null, 2),
        }],
      }
    },
  )

  server.tool(
    'market_regime',
    'Requires Pro tier. Current market cycle phase (early_cycle, mid_cycle, late_cycle, recession) inferred from the recession model trend. Free tier receives a 403 with upgrade link (https://bullrundata.com/pricing).',
    {},
    readOnly('Market Cycle Regime'),
    async () => {
      const data = (await apiGet('/api/v1/model/probability')) as ModelProbability
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            market_regime: data.trend,
            confidence: data.confidence,
            recession_probability: data.probability,
            timestamp: data.timestamp,
          }, null, 2),
        }],
      }
    },
  )

  server.tool(
    'confirmation_status',
    'Requires Pro tier. Coincident-indicator confirmation slice from the recession model. Tells you whether leading-indicator recession signals are being confirmed by current activity. Free tier receives a 403 with upgrade link (https://bullrundata.com/pricing).',
    {},
    readOnly('Recession Confirmation Status'),
    async () => {
      const data = (await apiGet('/api/v1/model/probability')) as ModelProbability
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            ...data.confirmation,
            timestamp: data.timestamp,
          }, null, 2),
        }],
      }
    },
  )

  server.tool(
    'housing_cycle',
    'Requires Pro tier. US housing market cycle classifier — expansion / topping / mid_cycle / bottoming / contraction — from a proprietary weighted model over 5 component groups (supply, demand, price, affordability, cost of capital). Returns composite score 0-100, per-component sub-scores with interpretations, 3-month trend, and confidence. Best used for real estate timing decisions and macro housing analysis. Free tier receives a 403 with upgrade link (https://bullrundata.com/pricing).',
    {},
    readOnly('US Housing Cycle Regime'),
    async () => {
      const data = await apiGet('/api/v1/model/housing')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'multifamily_cycle',
    'Requires Pro tier. US multifamily investment regime classifier — expansion / topping / mid_cycle / bottoming / contraction, reading as accumulate / trim / hold / distress-entry / distress-deepening for institutional MF investors — from a proprietary weighted model over 5 component groups (rent-demand, rent-pricing-power, supply-pressure, debt-cost, credit-stress). Returns composite score 0-100, per-component sub-scores with interpretations, 3-month trend, and confidence. Debt is weighted heavier (25%) than in the general housing_cycle model because MF returns are more rate-sensitive due to portfolio leverage. Best used for multifamily acquisition timing, underwriting stance, refi-window vs distress-hunting decisions. Free tier receives a 403 with upgrade link (https://bullrundata.com/pricing).',
    {},
    readOnly('US Multifamily Cycle Regime'),
    async () => {
      const data = await apiGet('/api/v1/model/multifamily')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )
}
