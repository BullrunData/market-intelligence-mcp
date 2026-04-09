#!/usr/bin/env node
/**
 * Market Intelligence MCP Server
 *
 * 20 tools: 12 unique (recession, capital rotation, investment analysis) + 8 commodity (FRED)
 * Transports: stdio (local) and streamable HTTP (remote)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerRecessionTools } from './tools/recession.js'
import { registerCapitalRotationTools } from './tools/capital-rotation.js'
import { registerCalculatorTools } from './tools/calculators.js'
import { registerFredTools } from './tools/fred.js'
import { registerCascadeTools } from './tools/cascade.js'

const server = new McpServer({
  name: 'market-intelligence',
  version: '0.1.0',
  description: 'Market Intelligence MCP — recession probability, capital rotation scoring, investment analysis, and FRED economic data',
})

// Register all tool groups
registerRecessionTools(server)
registerCapitalRotationTools(server)
registerCalculatorTools(server)
registerFredTools(server)
registerCascadeTools(server)

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Market Intelligence MCP server running on stdio')
}

main().catch(console.error)
