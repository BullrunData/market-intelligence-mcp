import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiGet } from '../lib/api-client.js'

const READ_ONLY = { readOnlyHint: true, destructiveHint: false } as const

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
    'One-call macro snapshot — recession probability, market regime, Fed stance, and 14 key economic indicators (unemployment, Fed funds, CPI, yield curve spreads, VIX, high-yield spread, consumer sentiment, mortgage rate, housing starts, jobless claims, financial conditions, M2, industrial production). Best starting point for any macro question.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/api/v1/dashboard/summary')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'recession_probability',
    'Current US recession probability (0-100%) from a 15-component leading indicator model. Returns probability, trend (early/mid/late_cycle/recession), confidence, full component breakdown (yield curves, credit spreads, unemployment trend, JOLTS quits, ISM, consumer sentiment, housing, VIX, M2, financial conditions), 4-indicator confirmation slice, Fed stance, and recommendation.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/api/v1/model/probability')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'recession_indicators',
    'Latest values for all key recession-model indicators with labels and units. Returns the curated key_metrics block from the dashboard summary (unemployment, Fed funds, CPI, T10Y2Y, T10Y3M, VIX, high-yield spread, consumer sentiment, mortgage rate, housing starts, jobless claims, financial conditions, M2, industrial production).',
    {},
    READ_ONLY,
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
    'Current Federal Reserve monetary policy stance (TIGHTENING, EASING, NEUTRAL, CRISIS) with the live Fed funds rate.',
    {},
    READ_ONLY,
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
    'Current market cycle phase (early_cycle, mid_cycle, late_cycle, recession) inferred from the recession model trend.',
    {},
    READ_ONLY,
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
    'Coincident-indicator confirmation slice from the recession model. Tracks Real GDP Growth, Industrial Production, Real Personal Income, and Employment Level against thresholds. Tells you whether leading-indicator recession signals are being confirmed by current activity.',
    {},
    READ_ONLY,
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
}
