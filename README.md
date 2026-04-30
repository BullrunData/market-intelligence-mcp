# Market Intelligence MCP Server

> Recession probability, sector rotation, institutional positioning, macro cascade scenario analysis, real estate calculators, and real-time economic data — for Claude, ChatGPT, Cursor, and any MCP client.

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

## Available Tools (23)

### Macro Intelligence

| Tool | Description |
|------|-------------|
| `dashboard_summary` | One-call macro snapshot — recession probability, regime, Fed stance, 14 key indicators |
| `recession_probability` | 15-component recession model with full breakdown and confirmation slice |
| `recession_indicators` | Curated key metrics block (unemployment, CPI, T10Y2Y, VIX, mortgage, etc.) |
| `fed_stance` | Current Fed monetary policy stance and Fed funds rate |
| `market_regime` | Market cycle phase (early/mid/late_cycle / recession) |
| `confirmation_status` | 4 coincident indicators confirming or denying recession signals |

### Markets & Institutional

| Tool | Description |
|------|-------------|
| `sectors_rotation` | Risk-on/risk-off signal from 11 sector ETFs (cyclical vs defensive) with leaders/laggards |
| `institutional_cftc` | CFTC Commitments of Traders — institutional futures positioning |
| `institutional_tic` | Treasury International Capital flows — net foreign Treasury demand |

### Real Estate Calculators

| Tool | Description |
|------|-------------|
| `investment_property_analysis` | Rental property analysis: cap rate, DSCR, cash flow, 1% rule |
| `brrrr_analysis` | BRRRR deal scoring (0-100) with 70% rule and full breakdown |

### Economic Data

| Tool | Description |
|------|-------------|
| `economic_indicator` | Time series for any tracked indicator (VIXCLS, UNRATE, CPIAUCSL, T10Y2Y, etc.) |
| `list_indicators` | List all tracked indicators, optionally filtered by category |
| `interest_rates` | Fed Policy + Interest Rates categories |
| `inflation_data` | All Inflation-category indicators |
| `employment_data` | Labor Market category (unemployment, payrolls, claims, JOLTS) |
| `housing_data` | Housing category (mortgage rates, starts, permits, prices) |
| `yield_curve` | 10Y-2Y and 10Y-3M spreads with inversion check |
| `market_sentiment` | Markets + Financial Conditions + Consumer Sentiment |

### Cascade Engine (Macro Scenario Analysis)

| Tool | Description |
|------|-------------|
| `cascade_list` | List all 10 macro catalyst scenarios |
| `cascade_analysis` | Full chain reaction for a catalyst with live data enrichment |
| `cascade_search` | Search catalysts by keyword (e.g., "oil", "dollar", "china") |
| `cascade_by_category` | Filter by category: geopolitical, monetary, credit, commodity, currency, structural |

**Available Catalysts:** Oil Supply Shock, Dollar Liquidity Squeeze, Fed Emergency Rate Cut, US Recession, China-Taiwan Escalation, Yield Curve Inversion, Credit Market Freeze, EM Currency Crisis, Trade War Escalation, Sovereign Debt Crisis

## Example Conversations

### "What's the current recession risk?"

Claude uses `recession_probability` and returns:
> Current recession probability is 37.9% (moderate risk). Fed stance: neutral. Market regime: mid-cycle. 0 of 4 coincident indicators confirming. Recommendation: Mixed signals require caution. Begin defensive rotation.

### "Is this a good time to buy an investment property at $450K?"

Claude uses `investment_property_analysis` + `interest_rates`:
> At $450K with 20% down at 7%, monthly cash flow is $287. Cap rate: 5.3%. Cash-on-cash: 4.2%. DSCR: 1.18 (healthy). Current 30Y mortgage rate: 6.38%.

### "What's the market risk-on/risk-off signal?"

Claude uses `sectors_rotation` + `institutional_cftc`:
> Sector rotation signal: RISK_ON. Cyclical sectors leading (XLK +19.7%, XLY +7.2%) vs defensive lagging (XLU -0.5%, XLV -2.6%). Rotation spread +4.4. CFTC institutional positioning: e-mini S&P long, gold short — risk-seeking. Playbook: stay overweight cyclicals, watch for rotation breakdown.

### "What happens if oil hits $120?"

Claude uses `cascade_analysis` + `sectors_rotation`:
> Oil Supply Shock cascade: Dollar demand surges (mechanical) -> Asian FX reserves drain (likely, weeks) -> Asian equity outflows (likely) -> Forced rate hikes in Asia (probable, months). Current sector rotation: RISK_ON, but energy (XLE) lagging at -3.6% suggests market hasn't priced supply risk yet. Playbook: inflation hedges (XLE, TIP) and cash reserves. Watch Fed swap line usage for systemic signal.

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
