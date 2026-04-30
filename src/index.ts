#!/usr/bin/env node
/**
 * Market Intelligence MCP Server
 *
 * 23 tools: 6 macro + 8 indicators + 3 markets + 2 calculators + 4 cascade
 * Transports: stdio (local) and streamable HTTP (remote)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerMacroTools } from './tools/macro.js'
import { registerIndicatorTools } from './tools/indicators.js'
import { registerMarketTools } from './tools/markets.js'
import { registerCalculatorTools } from './tools/calculators.js'
import { registerCascadeTools } from './tools/cascade.js'

const server = new McpServer({
  name: 'market-intelligence',
  version: '0.2.0',
  description: 'Market Intelligence MCP — recession probability, sector rotation, institutional positioning, macro cascade scenarios, real estate calculators, and economic data',
})

registerMacroTools(server)
registerIndicatorTools(server)
registerMarketTools(server)
registerCalculatorTools(server)
registerCascadeTools(server)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Market Intelligence MCP server running on stdio')
}

main().catch(console.error)
