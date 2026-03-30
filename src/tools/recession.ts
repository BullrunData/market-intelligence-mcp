import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiGet } from '../lib/api-client.js'

const READ_ONLY = { readOnlyHint: true, destructiveHint: false } as const

export function registerRecessionTools(server: McpServer) {
  server.tool(
    'recession_probability',
    'Get the current US recession probability (0-95%) from a 15-indicator weighted model with dynamic Fed stance and market regime adjustments. Includes risk level, confidence, confirmation status, and actionable recommendation.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/v1/recession/probability')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'recession_indicators',
    'Get all recession model indicators with current values and risk scores.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/v1/recession/indicators')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'fed_stance',
    'Get the current Federal Reserve monetary policy stance (TIGHTENING, EASING, CRISIS, or NEUTRAL) based on fed funds rate trajectory and 6-month rate change.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/v1/recession/fed-stance')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'market_regime',
    'Get the current market cycle phase: EARLY_CYCLE, MID_CYCLE, LATE_CYCLE, or RECESSION. Based on unemployment trend, ISM PMI, yield curve, and credit spreads.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/v1/recession/regime')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'confirmation_status',
    'Check 4 coincident economic indicators that confirm or deny recession signals: Real GDP Growth, Industrial Production, Real Personal Income, Employment Level.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/v1/recession/confirmation')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'sahm_rule',
    'Check the Sahm Rule recession indicator. The 3-month moving average of unemployment minus the 12-month minimum. Triggers at 0.50 — has predicted every US recession since 1970.',
    {},
    READ_ONLY,
    async () => {
      const data = await apiGet('/v1/recession/sahm')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )
}
