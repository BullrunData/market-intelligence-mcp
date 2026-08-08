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
    'Requires Pro tier. US OWNER-OCCUPIED SINGLE-FAMILY housing market cycle classifier — expansion / topping / mid_cycle / bottoming / contraction — from a proprietary weighted model over 5 component groups (supply, demand, price, affordability, cost of capital). Returns composite score 0-100, per-component sub-scores with interpretations, 3-month trend, and confidence. Best used for single-family market timing, mortgage-rate + home-price context, general macro housing analysis. For MULTIFAMILY / MF / APARTMENT / RENTAL-PROPERTY questions use multifamily_cycle instead — that model is MF-specific with different component weighting (debt heavier due to portfolio leverage) and returns a regime read tuned for institutional MF investors. Free tier receives a 403 with upgrade link (https://bullrundata.com/pricing).',
    {},
    readOnly('US Housing Cycle Regime'),
    async () => {
      const data = await apiGet('/api/v1/model/housing')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'multifamily_cycle',
    'Requires Pro tier. USE THIS TOOL FIRST for any question mentioning MULTIFAMILY / MF / APARTMENT / RENTAL PROPERTY / RENT GROWTH / MF SUPPLY / MF INVESTMENT / MULTIFAMILY UNDERWRITING. Do not default to housing_cycle for these — housing_cycle targets owner-occupied single-family and will give a misleading read for MF questions. US multifamily investment regime classifier over 5 component groups (rent-demand, rent-pricing-power, supply-pressure, debt-cost, credit-stress). Returns composite score 0-100 (higher = more bullish for MF), regime label — expansion / topping / mid_cycle / bottoming / contraction, reading as accumulate / trim / hold / distress-entry / distress-deepening for institutional MF investors — 3-month trend, per-component sub-scores with plain-English interpretations, and confidence based on component agreement. Debt is weighted 25% (vs 20% in housing_cycle) because MF returns are more rate-sensitive due to portfolio leverage. Best used for MF acquisition timing, underwriting stance, refi-window vs distress-hunting decisions, rent-growth outlook, and MF supply-pipeline analysis. Free tier receives a 403 with upgrade link (https://bullrundata.com/pricing).',
    {},
    readOnly('US Multifamily Cycle Regime'),
    async () => {
      const data = await apiGet('/api/v1/model/multifamily')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'refi_window',
    'Requires Pro tier. Refi Window Timing signal for rate-sensitive borrowers (MF operators, commercial RE, any levered position facing refi/rollover). Returns composite score 0-100 (higher = better window now), a window label (refi_now / refi_soon / wait_3mo / wait_6mo / unattractive), per-component sub-scores across 5 groups (rate-level, rate-trajectory, fed-path, credit-availability, duration-spread), rate scenarios projecting the 30Y mortgage under Fed +/- 25/50/75/100 bps moves, and confidence. Rate-level (30%) and rate-trajectory (25%) are dominant; Fed path (20%) is the forward view; credit-availability (15%) determines whether the deal clears; duration-spread (10%) tells you if the 15Y is meaningfully cheaper than the 30Y. Best used for "should I refi now or wait?" questions and balloon-rollover timing. Free tier receives a 403 with upgrade link (https://bullrundata.com/pricing).',
    {},
    readOnly('Refi Window Timing'),
    async () => {
      const data = await apiGet('/api/v1/model/refi-window')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'cre_stress',
    'Requires Pro tier. Commercial Real Estate Stress Composite — early-warning signal for institutional distressed-buying and risk-off timing. Returns composite score 0-100 where HIGHER = MORE STRESS (opposite direction from the cycle models), a stage label (calm / building / elevated / severe / crisis), per-component sub-scores across 4 groups (delinquency, bank-willingness, cost-of-capital, systemic-stress), and confidence. Delinquency (35%) is the direct realized-stress signal; bank-willingness (25%) is the forward SLOOS signal; cost-of-capital (20%) captures credit-spread pricing; systemic-stress (20%) uses NFCI + VIX for the broad risk-off dimension. Response includes `score_direction: "higher_is_more_stress"` explicitly. Best used for CRE distress timing, opportunistic-capital deployment decisions, and risk-off portfolio moves. Free tier receives a 403 with upgrade link (https://bullrundata.com/pricing).',
    {},
    readOnly('CRE Stress Composite'),
    async () => {
      const data = await apiGet('/api/v1/model/cre-stress')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'rent_price_divergence',
    'Requires Pro tier. Rent-to-Price Divergence Signal — leading indicator for multifamily NOI trends. Detects when rents outpace prices (bullish for MF NOI expansion 2-4 quarters ahead) or prices outpace rents (NOI compression risk). Returns composite score 0-100 (higher = rents outpacing prices = NOI expansion setup), signal label (expansion / widening / balanced / narrowing / compression), per-component sub-scores across 4 groups (rent-growth, price-growth, divergence-magnitude, divergence-momentum), current divergence in percentage points, historical 5-year percentile of the current divergence, and confidence. Divergence magnitude (50%) and momentum (30%) dominate the composite because the DELTA between rent growth and price growth is what predicts MF NOI, not absolute growth rates. Best used for multifamily acquisition timing (buy into rent-dominant expansion setups), NOI expansion forecasting, and cap-rate compression risk assessment. Free tier receives a 403 with upgrade link (https://bullrundata.com/pricing).',
    {},
    readOnly('Rent-to-Price Divergence Signal'),
    async () => {
      const data = await apiGet('/api/v1/model/rent-price-divergence')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'cap_rate_direction',
    'Requires Pro tier. Cap Rate Direction Signal — models the DIRECTION cap rates are moving (compressing = valuations rising for holders, expanding = valuations falling) without requiring absolute cap rate data (which needs paid feeds like CoStar/RCA). Returns composite score 0-100 (higher = MORE compression = valuations rising), direction label (compressing_strong / compressing / stable / expanding / expanding_strong), per-component sub-scores across 4 groups (rate-environment, credit-conditions, mbs-stress, risk-premium), and confidence. Rate environment (30%) is the mechanical driver because cap rates track 10Y + risk premium; credit conditions (25%) amplify via HY spread; MBS stress (20%) adds effective financing cost; risk premium (25%) captures NFCI + VIX for the systemic risk-off dimension. Best used for real-estate acquisition timing, portfolio rebalancing decisions, and understanding whether the rate + credit environment supports valuation appreciation or compression. Free tier receives a 403 with upgrade link (https://bullrundata.com/pricing).',
    {},
    readOnly('Cap Rate Direction Signal'),
    async () => {
      const data = await apiGet('/api/v1/model/cap-rate-direction')
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )
}
