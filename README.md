# Market Intelligence MCP Server

> Recession probability scoring, capital rotation analysis, investment calculators, and real-time economic data — for Claude, ChatGPT, Cursor, and any MCP client.

Powered by the [BullrunData API](https://bullrundata.com).

## Quick Start

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "market-intelligence": {
      "command": "npx",
      "args": ["-y", "@bullrundata/market-intelligence"],
      "env": {
        "BULLRUNDATA_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add market-intelligence -- npx -y @bullrundata/market-intelligence
```

### Get Your API Key

Sign up free at [bullrundata.com](https://bullrundata.com/login) — 100 calls/day, no credit card required.

## Available Tools (20)

### Recession Intelligence

| Tool | Description |
|------|-------------|
| `recession_probability` | Current recession probability (0-95%) from 15-indicator weighted model |
| `recession_indicators` | All model indicators with scores and values |
| `fed_stance` | Federal Reserve policy stance and weight impacts |
| `market_regime` | Market cycle phase (early/mid/late/recession) |
| `confirmation_status` | 4 coincident indicators confirming or denying signals |
| `sahm_rule` | Sahm Rule calculation — predicted every recession since 1970 |
| `recession_timing` | Estimated months to recession based on leading indicators |

### Capital Rotation

| Tool | Description |
|------|-------------|
| `capital_rotation_score` | Risk-on/risk-off composite (-100 to +100) from 9 macro instruments |
| `capital_rotation_instruments` | All instruments with prices, signals, and scores |
| `divergence_alerts` | Correlation breakdowns and momentum shifts |

### Investment Calculators

| Tool | Description |
|------|-------------|
| `investment_property_analysis` | Rental property analysis: cap rate, DSCR, cash flow, 1% rule |
| `brrrr_analysis` | BRRRR deal scoring (0-100) with 70% rule and full breakdown |

### Economic Data

| Tool | Description |
|------|-------------|
| `economic_indicator` | Any economic indicator by series ID (GDP, CPI, UNRATE, etc.) |
| `search_indicators` | Search available indicators by keyword |
| `interest_rates` | Fed funds, treasury yields, mortgage rates |
| `inflation_data` | CPI, PCE, breakeven inflation, expectations |
| `employment_data` | Unemployment, payrolls, claims, JOLTS |
| `housing_data` | Mortgage rates, starts, permits, home prices |
| `yield_curve` | Yield spreads and inversion detection |
| `market_sentiment` | VIX, financial conditions, stress, consumer sentiment |

## Example Conversations

### "What's the current recession risk?"

Claude uses `recession_probability` and returns:
> Current recession probability is 37.9% (moderate risk). Fed stance: neutral. Market regime: mid-cycle. 0 of 4 coincident indicators confirming. Recommendation: Mixed signals require caution. Begin defensive rotation.

### "Is this a good time to buy an investment property at $450K?"

Claude uses `investment_property_analysis` + `interest_rates`:
> At $450K with 20% down at 7%, monthly cash flow is $287. Cap rate: 5.3%. Cash-on-cash: 4.2%. DSCR: 1.18 (healthy). Current 30Y mortgage rate: 6.38%.

### "What's the market risk-on/risk-off signal?"

Claude uses `capital_rotation_score` + `divergence_alerts`:
> Capital rotation score: -3 (NEUTRAL / MIXED SIGNALS). VIX elevated at 27. Gold catching a fear bid. Copper holding — not a structural breakdown. Playbook: quality and diversification over concentrated bets.

## Configuration

| Environment Variable | Required | Description |
|---------------------|----------|-------------|
| `BULLRUNDATA_API_KEY` | Yes | Your API key from [bullrundata.com](https://bullrundata.com/login) |

## Pricing

| Tier | Calls/Day | Price |
|------|-----------|-------|
| Free | 100 | $0 |
| Pro | 10,000 | $29/mo |
| Business | 100,000 | $99/mo |

## Support

- Website: [bullrundata.com](https://bullrundata.com)
- Docs: [bullrundata.com/docs](https://bullrundata.com/docs)
- Issues: [GitHub Issues](https://github.com/BullrunData/market-intelligence-mcp/issues)

## License

MIT
