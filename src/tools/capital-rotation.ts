import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiGet } from '../lib/api-client.js'

export function registerCapitalRotationTools(server: McpServer) {
  server.tool(
    'capital_rotation_score',
    'Get the current capital rotation risk-on/risk-off composite score (-100 to +100) based on 9 macro instruments (DXY, Gold, Oil, Copper, VIX, 10Y Yield, Gold/Silver Ratio, SOFR, Bitcoin). Includes regime detection and asset allocation playbook.',
    {},
    async () => {
      const data = await apiGet('/v1/capital-rotation/score')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'capital_rotation_instruments',
    'Get detailed scoring for all 9 macro instruments in the capital rotation model. Each instrument includes price, weighted score, signal direction, interpretation, and risk classification.',
    {},
    async () => {
      const data = await apiGet('/v1/capital-rotation/instruments')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'divergence_alerts',
    'Get active correlation breakdowns between macro instruments (e.g., DXY and Gold both rising = systemic fear). Includes severity, implication, and momentum shift detection.',
    {},
    async () => {
      const data = await apiGet('/v1/capital-rotation/divergence')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )
}
