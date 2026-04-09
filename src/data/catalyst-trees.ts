/**
 * Catalyst Cascade Trees — Macro scenario analysis engine
 *
 * Each tree maps a geopolitical/economic catalyst to its chain reaction
 * across markets, regions, and asset classes.
 */

// ─── Types ────────────────────────────────────────────────────

export type CatalystCategory =
  | 'geopolitical'
  | 'monetary'
  | 'credit'
  | 'commodity'
  | 'currency'
  | 'contagion'
  | 'structural'

export type Confidence = 'mechanical' | 'likely' | 'probable' | 'speculative'
export type Timeframe = 'immediate' | 'days' | 'weeks' | 'months'
export type Direction = 'up' | 'down' | 'volatile'
export type Magnitude = 'small' | 'moderate' | 'large' | 'extreme'
export type RegionDirection = 'positive' | 'negative' | 'mixed'
export type Severity = 'low' | 'moderate' | 'high' | 'critical'

export interface AssetImpact {
  asset: string
  name: string
  direction: Direction
  magnitude: Magnitude
  rationale: string
}

export interface RegionImpact {
  region: string
  direction: RegionDirection
  severity: Severity
  rationale: string
}

export interface Precedent {
  event: string
  year: number
  relevance: string
  outcome: string
}

export interface WatchlistItem {
  indicator: string
  name: string
  threshold: string
  mcpTool?: string
  mcpField?: string
}

export interface CascadeEffect {
  id: string
  name: string
  description: string
  mechanism: string
  confidence: Confidence
  timeframe: Timeframe
  assetImpacts: AssetImpact[]
  regionImpacts: RegionImpact[]
  secondaryEffects?: CascadeEffect[]
}

export interface CatalystTree {
  id: string
  name: string
  category: CatalystCategory
  description: string
  triggerConditions: string[]
  severity: 'moderate' | 'severe' | 'critical'
  primaryEffects: CascadeEffect[]
  historicalPrecedents: Precedent[]
  watchlist: WatchlistItem[]
}

// ─── Catalyst Trees ───────────────────────────────────────────

export const catalystTrees: CatalystTree[] = [
  // ═══════════════════════════════════════════════════════════
  // #1: OIL SUPPLY SHOCK
  // ═══════════════════════════════════════════════════════════
  {
    id: 'oil-supply-shock',
    name: 'Oil Supply Shock',
    category: 'commodity',
    description: 'Major disruption to global oil supply from geopolitical conflict, sanctions, or infrastructure damage causing sustained price spikes above $100/barrel.',
    triggerConditions: [
      'Military conflict in major oil-producing region (Middle East, Russia)',
      'Sanctions on major oil exporter cutting 2M+ barrels/day from market',
      'Critical infrastructure damage (Strait of Hormuz, major pipeline)',
      'OPEC+ production cuts deeper than market expectations',
    ],
    severity: 'critical',
    primaryEffects: [
      {
        id: 'oil-price-spike',
        name: 'Oil Price Spike',
        description: 'Crude oil prices surge from ~$90 to $100-130 range as supply shortfall hits physical markets.',
        mechanism: 'Supply removal from a market already balanced tight causes immediate spot price repricing. Futures curve shifts into steep backwardation as near-term scarcity exceeds storage buffers.',
        confidence: 'mechanical',
        timeframe: 'immediate',
        assetImpacts: [
          { asset: 'USO', name: 'US Oil Fund', direction: 'up', magnitude: 'large', rationale: 'Direct oil price exposure' },
          { asset: 'XLE', name: 'Energy Select SPDR', direction: 'up', magnitude: 'large', rationale: 'US energy producers see windfall profits' },
          { asset: 'XOP', name: 'Oil & Gas Exploration ETF', direction: 'up', magnitude: 'large', rationale: 'E&P companies benefit most from price spikes' },
        ],
        regionImpacts: [
          { region: 'Middle East Exporters', direction: 'positive', severity: 'moderate', rationale: 'Revenue windfall for non-disrupted exporters' },
          { region: 'US Energy Sector', direction: 'positive', severity: 'moderate', rationale: 'US producers benefit from higher prices' },
        ],
        secondaryEffects: [],
      },
      {
        id: 'dollar-demand-surge',
        name: 'Dollar Demand Surge',
        description: 'Global scramble for US dollars as oil importers need more USD to purchase the same volume of oil.',
        mechanism: 'Oil is settled in USD. When oil prices spike, importing nations must acquire more dollars, driving DXY higher. This creates a reflexive loop — dollar strength makes oil even more expensive in local currencies.',
        confidence: 'mechanical',
        timeframe: 'days',
        assetImpacts: [
          { asset: 'DXY', name: 'US Dollar Index', direction: 'up', magnitude: 'moderate', rationale: 'Increased dollar demand from oil settlement' },
          { asset: 'UUP', name: 'Invesco DB USD Index', direction: 'up', magnitude: 'moderate', rationale: 'Dollar strengthens vs basket' },
        ],
        regionImpacts: [
          { region: 'Asia', direction: 'negative', severity: 'high', rationale: 'Major oil importers face FX + commodity double hit' },
          { region: 'Europe', direction: 'negative', severity: 'moderate', rationale: 'EUR weakens, energy costs spike' },
        ],
        secondaryEffects: [
          {
            id: 'asian-fx-reserve-drawdown',
            name: 'Asian FX Reserve Drawdown',
            description: 'Asian central banks sell foreign reserves to defend weakening currencies against the strengthening dollar.',
            mechanism: 'Central banks intervene in FX markets to slow depreciation, burning through reserves accumulated over years. Once reserves drop below 3 months of import cover, market confidence collapses.',
            confidence: 'likely',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'USD/JPY', name: 'Dollar-Yen', direction: 'up', magnitude: 'large', rationale: 'Yen weakens as BOJ has limited tools' },
              { asset: 'USD/INR', name: 'Dollar-Rupee', direction: 'up', magnitude: 'large', rationale: 'India is 3rd largest oil importer' },
              { asset: 'USD/KRW', name: 'Dollar-Won', direction: 'up', magnitude: 'moderate', rationale: 'Korea dependent on energy imports' },
            ],
            regionImpacts: [
              { region: 'Japan', direction: 'negative', severity: 'critical', rationale: 'Largest energy importer with weakest currency defense' },
              { region: 'India', direction: 'negative', severity: 'high', rationale: 'Massive oil import dependency, rupee pressure' },
              { region: 'South Korea', direction: 'negative', severity: 'high', rationale: 'Energy-intensive manufacturing economy' },
            ],
            secondaryEffects: [
              {
                id: 'asian-equity-outflows',
                name: 'Asian Equity Outflows',
                description: 'Foreign investors sell Asian equities to avoid the double loss of falling stock prices AND weakening currencies.',
                mechanism: 'A US investor holding Japanese stocks loses money twice — the stock drops AND the yen conversion erodes returns. This triggers mechanical selling by risk-managed funds.',
                confidence: 'likely',
                timeframe: 'weeks',
                assetImpacts: [
                  { asset: 'EWJ', name: 'iShares MSCI Japan', direction: 'down', magnitude: 'large', rationale: 'Foreign selling + yen weakness' },
                  { asset: 'EEM', name: 'iShares MSCI EM', direction: 'down', magnitude: 'large', rationale: 'Broad EM outflows accelerate' },
                  { asset: 'INDA', name: 'iShares MSCI India', direction: 'down', magnitude: 'moderate', rationale: 'Domestic demand provides some cushion' },
                ],
                regionImpacts: [
                  { region: 'Japan', direction: 'negative', severity: 'high', rationale: 'Foreign ownership of Japanese equities is ~30%' },
                  { region: 'Emerging Markets', direction: 'negative', severity: 'high', rationale: 'EM treated as single asset class in risk-off' },
                ],
              },
              {
                id: 'forced-rate-hikes-asia',
                name: 'Forced Rate Hikes in Asia',
                description: 'Asian central banks forced to raise interest rates to defend currencies, even as their economies weaken.',
                mechanism: 'Central banks face an impossible choice: let the currency crash (importing more inflation) or hike rates (killing growth). Most choose rate hikes as the lesser evil.',
                confidence: 'probable',
                timeframe: 'months',
                assetImpacts: [
                  { asset: 'EWJ', name: 'iShares MSCI Japan', direction: 'down', magnitude: 'moderate', rationale: 'Higher rates compress equity valuations' },
                  { asset: 'VNQI', name: 'Vanguard Global ex-US REIT', direction: 'down', magnitude: 'large', rationale: 'Asian REITs hit by rising rates' },
                ],
                regionImpacts: [
                  { region: 'Asia Broad', direction: 'negative', severity: 'high', rationale: 'Growth killed to save currency stability' },
                ],
              },
            ],
          },
          {
            id: 'em-dollar-debt-stress',
            name: 'EM Dollar Debt Stress',
            description: 'Emerging market borrowers with USD-denominated debt face surging repayment costs as the dollar strengthens.',
            mechanism: 'A stronger dollar increases the local-currency cost of servicing dollar bonds. Entities that were solvent at USD/TRY 30 become distressed at USD/TRY 40.',
            confidence: 'likely',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'EMB', name: 'iShares JP Morgan EM Bond', direction: 'down', magnitude: 'large', rationale: 'EM sovereign debt reprices on default risk' },
              { asset: 'HYG', name: 'iShares High Yield Corp Bond', direction: 'down', magnitude: 'moderate', rationale: 'Risk-off contagion from EM to US credit' },
            ],
            regionImpacts: [
              { region: 'Turkey', direction: 'negative', severity: 'critical', rationale: 'Highest external debt vulnerability' },
              { region: 'Argentina', direction: 'negative', severity: 'critical', rationale: 'Chronic dollar shortage worsens' },
              { region: 'Southeast Asia', direction: 'negative', severity: 'high', rationale: 'Dollar-denominated corporate debt concentrated here' },
            ],
          },
        ],
      },
      {
        id: 'inflation-expectations-spike',
        name: 'Inflation Expectations Spike',
        description: 'Energy feeds directly into CPI, causing breakeven inflation rates to widen and forcing central bank recalculation.',
        mechanism: 'Oil flows into everything — transportation, manufacturing, agriculture, heating. A sustained $100+ oil price adds 1-2% to headline CPI within 3-6 months.',
        confidence: 'mechanical',
        timeframe: 'days',
        assetImpacts: [
          { asset: 'TIP', name: 'iShares TIPS Bond', direction: 'up', magnitude: 'moderate', rationale: 'Inflation protection demand surges' },
          { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'moderate', rationale: 'Gold as inflation hedge' },
        ],
        regionImpacts: [
          { region: 'Global', direction: 'negative', severity: 'moderate', rationale: 'Cost-push inflation reduces purchasing power everywhere' },
        ],
        secondaryEffects: [
          {
            id: 'fed-rate-cut-delay',
            name: 'Fed Rate Cut Delay / Hawkish Pivot',
            description: 'The Fed cannot cut rates into rising oil-driven inflation, delaying or reversing easing expectations.',
            mechanism: 'The Fed\'s mandate requires price stability. Rising energy inflation makes cuts politically and economically impossible, even if growth is slowing. Markets must reprice the rate path.',
            confidence: 'probable',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'TLT', name: 'iShares 20+ Year Treasury', direction: 'down', magnitude: 'moderate', rationale: 'Higher-for-longer repricing' },
              { asset: 'QQQ', name: 'Invesco QQQ (Nasdaq)', direction: 'down', magnitude: 'moderate', rationale: 'Growth stocks punished by higher discount rates' },
              { asset: 'IWM', name: 'iShares Russell 2000', direction: 'down', magnitude: 'large', rationale: 'Small caps most rate-sensitive' },
            ],
            regionImpacts: [
              { region: 'US', direction: 'negative', severity: 'moderate', rationale: 'Growth stocks and rate-sensitive sectors hit' },
            ],
          },
          {
            id: 'consumer-spending-contraction',
            name: 'Consumer Spending Contraction',
            description: 'Higher gas and energy prices eat into discretionary spending budgets, especially for lower-income households.',
            mechanism: 'Every $10/barrel increase in oil adds ~$0.25/gallon at the pump. At $120 oil, the average US household spends $2,000+ more annually on gas, money that comes directly from retail, dining, and entertainment.',
            confidence: 'probable',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'XLY', name: 'Consumer Discretionary SPDR', direction: 'down', magnitude: 'large', rationale: 'Discretionary spending is first to be cut' },
              { asset: 'XRT', name: 'SPDR S&P Retail', direction: 'down', magnitude: 'large', rationale: 'Retail sales decline as wallets tighten' },
              { asset: 'XLC', name: 'Communication Services SPDR', direction: 'down', magnitude: 'moderate', rationale: 'Ad spending cuts follow consumer weakness' },
            ],
            regionImpacts: [
              { region: 'US Consumer', direction: 'negative', severity: 'moderate', rationale: 'Gas prices are a direct consumer tax' },
              { region: 'Europe', direction: 'negative', severity: 'high', rationale: 'Higher energy dependency, less domestic production' },
            ],
          },
        ],
      },
      {
        id: 'transportation-cost-spike',
        name: 'Transportation & Logistics Cost Spike',
        description: 'Jet fuel, diesel, and shipping fuel costs surge, cascading through global supply chains.',
        mechanism: 'Transportation is 100% oil-dependent. Airlines, trucking, and shipping cannot switch fuels in the short term. Costs pass through to every physical good.',
        confidence: 'mechanical',
        timeframe: 'weeks',
        assetImpacts: [
          { asset: 'JETS', name: 'US Global Jets ETF', direction: 'down', magnitude: 'large', rationale: 'Fuel is airlines\' largest variable cost' },
          { asset: 'IYT', name: 'iShares Transportation Avg', direction: 'down', magnitude: 'moderate', rationale: 'Trucking and logistics margins compressed' },
        ],
        regionImpacts: [
          { region: 'Island Economies', direction: 'negative', severity: 'high', rationale: '100% import-dependent on shipped goods' },
          { region: 'Global Supply Chain', direction: 'negative', severity: 'moderate', rationale: 'Every link in the chain gets more expensive' },
        ],
      },
    ],
    historicalPrecedents: [
      { event: '1973 OPEC Oil Embargo', year: 1973, relevance: 'Supply-driven shock from geopolitical conflict', outcome: '400% price spike, global recession, birth of stagflation' },
      { event: 'Iranian Revolution', year: 1979, relevance: 'Major producer knocked offline by political upheaval', outcome: 'Oil doubled, Volcker hiked to 20%, deep recession followed' },
      { event: 'Gulf War Oil Spike', year: 1990, relevance: 'Middle East conflict disrupting supply', outcome: 'Oil spiked 60%, short US recession, quick recovery after war ended' },
      { event: 'Russia-Ukraine Oil Shock', year: 2022, relevance: 'Sanctions on major energy exporter', outcome: 'Oil hit $130, global inflation surge, aggressive Fed hiking cycle' },
    ],
    watchlist: [
      { indicator: 'oil_price', name: 'Crude Oil Price (WTI/Brent)', threshold: 'Sustained above $100 = prolonged economic pain', mcpTool: 'capital_rotation_instruments' },
      { indicator: 'dxy', name: 'US Dollar Index', threshold: 'Above 108 = dollar squeeze accelerating', mcpTool: 'capital_rotation_instruments' },
      { indicator: 'fed_swap_lines', name: 'Fed FX Swap Line Usage', threshold: 'Spike above $50B = systemic dollar shortage' },
      { indicator: 'asian_fx_reserves', name: 'Asian Central Bank FX Reserves', threshold: 'Monthly drawdown accelerating = defense weakening' },
      { indicator: 'vix', name: 'CBOE Volatility Index', threshold: 'Above 30 = panic; below 20 = shock absorbed', mcpTool: 'capital_rotation_instruments' },
      { indicator: 'capital_rotation', name: 'Capital Rotation Score', threshold: 'Below -30 = strong risk-off positioning', mcpTool: 'capital_rotation_score' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // #2: DOLLAR LIQUIDITY SQUEEZE (ASIA)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'dollar-liquidity-squeeze',
    name: 'Dollar Liquidity Squeeze (Asia)',
    category: 'currency',
    description: 'Asian banks face acute shortage of US dollars for trade settlement and debt service, causing interbank USD borrowing costs to spike.',
    triggerConditions: [
      'Fed tightening drives dollar strength beyond Asian central bank defense capacity',
      'Oil price shock increases dollar demand for energy imports',
      'Trade surplus reversal reduces natural dollar inflows',
      'Loss of confidence triggers capital flight from Asian markets',
    ],
    severity: 'critical',
    primaryEffects: [
      {
        id: 'swap-spreads-blowout',
        name: 'USD Swap Spreads Blow Out',
        description: 'Interbank USD borrowing costs spike in Asia as dollar liquidity evaporates.',
        mechanism: 'Asian banks fund USD positions through FX swap markets. When counterparties demand higher premiums or pull back entirely, the basis swap spread blows out — the cost of converting local currency to USD skyrockets.',
        confidence: 'mechanical',
        timeframe: 'immediate',
        assetImpacts: [
          { asset: 'DXY', name: 'US Dollar Index', direction: 'up', magnitude: 'moderate', rationale: 'Dollar scarcity drives demand' },
          { asset: 'EWJ', name: 'iShares MSCI Japan', direction: 'down', magnitude: 'large', rationale: 'Japanese bank stocks crater on funding stress' },
        ],
        regionImpacts: [
          { region: 'Japan', direction: 'negative', severity: 'high', rationale: 'Largest offshore USD borrower' },
          { region: 'South Korea', direction: 'negative', severity: 'high', rationale: 'Trade-dependent economy needs constant USD flow' },
          { region: 'Southeast Asia', direction: 'negative', severity: 'high', rationale: 'Dollar-denominated corporate debt exposure' },
        ],
      },
      {
        id: 'currency-defense-operations',
        name: 'Currency Defense Operations',
        description: 'Central banks sell Treasury holdings and FX reserves to raise USD and defend currencies.',
        mechanism: 'Central banks intervene by selling US Treasuries and other dollar assets to supply USD to domestic markets. Japan alone holds $1.1T in Treasuries — forced selling moves the US bond market.',
        confidence: 'mechanical',
        timeframe: 'days',
        assetImpacts: [
          { asset: 'TLT', name: 'iShares 20+ Year Treasury', direction: 'down', magnitude: 'moderate', rationale: 'Asian central bank Treasury selling raises yields' },
          { asset: 'USD/JPY', name: 'Dollar-Yen', direction: 'up', magnitude: 'large', rationale: 'Yen weakens despite intervention' },
        ],
        regionImpacts: [
          { region: 'Japan', direction: 'negative', severity: 'critical', rationale: 'Largest Treasury holder, most exposed to spiral' },
        ],
        secondaryEffects: [
          {
            id: 'treasury-market-disruption',
            name: 'Treasury Market Disruption',
            description: 'Asian central bank selling of US Treasuries disrupts the US bond market, raising yields and mortgage rates.',
            mechanism: 'When Japan and other Asian central banks sell Treasuries to defend currencies, it creates unexpected supply in the bond market. This raises US yields even without Fed action, tightening financial conditions globally.',
            confidence: 'probable',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'TLT', name: 'iShares 20+ Year Treasury', direction: 'down', magnitude: 'large', rationale: 'Selling pressure from Asian central banks' },
              { asset: 'MBB', name: 'iShares MBS ETF', direction: 'down', magnitude: 'moderate', rationale: 'Mortgage rates spike with Treasury yields' },
            ],
            regionImpacts: [
              { region: 'US Housing', direction: 'negative', severity: 'moderate', rationale: 'Mortgage rate spike from Treasury selloff' },
              { region: 'US Equities', direction: 'negative', severity: 'moderate', rationale: 'Higher yields compress equity valuations' },
            ],
          },
          {
            id: 'competitive-devaluation',
            name: 'Competitive Devaluation Risk',
            description: 'If one country abandons its currency defense, neighbors are forced to let their currencies weaken too.',
            mechanism: 'If Japan lets the yen go, Korean and Taiwanese exporters become uncompetitive against Japanese rivals. They must follow or lose market share. This creates a race to the bottom.',
            confidence: 'speculative',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'large', rationale: 'Gold as safe haven amid currency chaos' },
              { asset: 'EEM', name: 'iShares MSCI EM', direction: 'down', magnitude: 'large', rationale: 'Broad Asian/EM currency basket weakens' },
            ],
            regionImpacts: [
              { region: 'Export-Dependent Asia', direction: 'negative', severity: 'high', rationale: 'Currency war erodes margins and confidence' },
            ],
          },
        ],
      },
      {
        id: 'trade-finance-freeze',
        name: 'Trade Finance Freeze',
        description: 'Letters of credit and trade finance dry up as banks can\'t source dollars, stalling physical imports.',
        mechanism: 'International trade requires USD-denominated letters of credit. When banks can\'t access dollars, they stop issuing trade finance, physically blocking imports even if demand exists.',
        confidence: 'likely',
        timeframe: 'weeks',
        assetImpacts: [
          { asset: 'BDRY', name: 'Breakwave Dry Bulk Shipping', direction: 'down', magnitude: 'moderate', rationale: 'No trade finance = no cargo' },
          { asset: 'AAPL', name: 'Apple Inc', direction: 'down', magnitude: 'moderate', rationale: 'Asian supply chain disrupted' },
        ],
        regionImpacts: [
          { region: 'Southeast Asia', direction: 'negative', severity: 'high', rationale: 'Trade-dependent economies stall' },
          { region: 'Global Tech Supply Chain', direction: 'negative', severity: 'moderate', rationale: 'Component imports delayed' },
        ],
        secondaryEffects: [
          {
            id: 'supply-chain-disruption',
            name: 'Global Supply Chain Disruption',
            description: 'Asian manufacturing can\'t source inputs, cascading into global tech and auto production.',
            mechanism: 'Asia produces 60%+ of global electronics and is central to most supply chains. Dollar-starved importers can\'t buy components, halting production lines that feed global markets.',
            confidence: 'probable',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'SMH', name: 'VanEck Semiconductor ETF', direction: 'down', magnitude: 'moderate', rationale: 'Semiconductor supply chain disrupted' },
              { asset: 'XLI', name: 'Industrial Select SPDR', direction: 'down', magnitude: 'moderate', rationale: 'Manufacturing inputs delayed' },
            ],
            regionImpacts: [
              { region: 'Global', direction: 'negative', severity: 'moderate', rationale: 'Supply chain disruption hits all downstream manufacturers' },
            ],
          },
        ],
      },
      {
        id: 'capital-controls-risk',
        name: 'Capital Controls Risk',
        description: 'Desperate governments may restrict capital outflows to stop the dollar drain.',
        mechanism: 'When all other tools fail, governments impose capital controls — restricting how much money can leave the country. This traps foreign investors and creates a massive discount on affected assets.',
        confidence: 'speculative',
        timeframe: 'months',
        assetImpacts: [
          { asset: 'EEM', name: 'iShares MSCI EM', direction: 'down', magnitude: 'extreme', rationale: 'Trapped capital = massive discount to NAV' },
        ],
        regionImpacts: [
          { region: 'Weakest EM Economies', direction: 'negative', severity: 'critical', rationale: 'Capital controls signal last resort' },
        ],
      },
    ],
    historicalPrecedents: [
      { event: 'Asian Financial Crisis', year: 1997, relevance: 'Classic dollar liquidity squeeze — Thai baht broke, contagion swept Asia', outcome: 'GDP contractions of 5-13%, IMF bailouts, 5+ year recovery for most countries' },
      { event: 'Global Financial Crisis Dollar Shortage', year: 2008, relevance: 'Global dollar shortage forced Fed to open unlimited swap lines', outcome: 'Fed swap lines peaked at $580B, prevented total trade finance collapse' },
      { event: 'Taper Tantrum', year: 2013, relevance: 'Mere mention of Fed tapering caused EM dollar outflows', outcome: '"Fragile Five" currencies crashed 15-25%, capital flight from EM' },
      { event: 'BOJ Yen Defense', year: 2022, relevance: 'Japan spent $60B+ defending yen against dollar strength', outcome: 'Intervention slowed but didn\'t stop yen depreciation, USD/JPY hit 150' },
    ],
    watchlist: [
      { indicator: 'usd_jpy', name: 'USD/JPY Exchange Rate', threshold: 'Above 160 = intervention capacity exhausted' },
      { indicator: 'fed_swap_lines', name: 'Fed FX Swap Line Drawings', threshold: 'Any significant uptake = systemic stress' },
      { indicator: 'japan_treasury_holdings', name: 'Japan Treasury Holdings (TIC Data)', threshold: 'Monthly decline > $20B = active selling' },
      { indicator: 'sofr_ois', name: 'SOFR-OIS Spread', threshold: 'Above 50bps = interbank stress', mcpTool: 'interest_rates' },
      { indicator: 'asian_cds', name: 'Asian Sovereign CDS Spreads', threshold: 'Above 200bps = credit risk pricing in default' },
      { indicator: 'capital_rotation', name: 'Capital Rotation Score', threshold: 'Deep negative = capital fleeing risk assets', mcpTool: 'capital_rotation_score' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // #3: FED EMERGENCY RATE CUT
  // ═══════════════════════════════════════════════════════════
  {
    id: 'fed-emergency-rate-cut',
    name: 'Fed Emergency Rate Cut',
    category: 'monetary',
    description: 'The Federal Reserve cuts rates outside of scheduled meetings, signaling something in the financial system is breaking.',
    triggerConditions: [
      'Credit market freeze threatening real economy',
      'Systemic bank failure or near-failure',
      'Sudden severe economic deterioration (employment, GDP)',
      'Financial market crash exceeding 20% in days',
    ],
    severity: 'critical',
    primaryEffects: [
      {
        id: 'reflexive-risk-asset-spike',
        name: 'Risk Assets Spike (Reflexive)',
        description: 'Initial knee-jerk rally as cheaper money reprices assets higher.',
        mechanism: 'Lower rates mechanically increase the present value of future cash flows. Markets rally on the rate cut itself before digesting WHY the cut was needed.',
        confidence: 'mechanical',
        timeframe: 'immediate',
        assetImpacts: [
          { asset: 'SPY', name: 'S&P 500 SPDR', direction: 'up', magnitude: 'large', rationale: 'Cheaper money reprices equity valuations higher' },
          { asset: 'QQQ', name: 'Invesco QQQ (Nasdaq)', direction: 'up', magnitude: 'large', rationale: 'Growth stocks most sensitive to rate changes' },
          { asset: 'BTC', name: 'Bitcoin', direction: 'up', magnitude: 'large', rationale: 'Liquidity injection narrative' },
          { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'large', rationale: 'Lower real yields boost gold' },
        ],
        regionImpacts: [
          { region: 'US', direction: 'positive', severity: 'moderate', rationale: 'Immediate relief rally' },
          { region: 'Emerging Markets', direction: 'positive', severity: 'moderate', rationale: 'Dollar weakening eases pressure' },
        ],
        secondaryEffects: [
          {
            id: 'what-do-they-know-fear',
            name: '"What Do They Know?" Fear',
            description: 'Emergency cuts signal something is broken — the initial rally fades as markets process the implications.',
            mechanism: 'The Fed doesn\'t cut between meetings for fun. An emergency cut means they see systemic risk that justifies the credibility cost of appearing panicked.',
            confidence: 'likely',
            timeframe: 'days',
            assetImpacts: [
              { asset: 'VIX', name: 'CBOE Volatility Index', direction: 'up', magnitude: 'large', rationale: 'Uncertainty about what forced the cut' },
            ],
            regionImpacts: [
              { region: 'Global', direction: 'negative', severity: 'moderate', rationale: 'Uncertainty increases despite lower rates' },
            ],
          },
        ],
      },
      {
        id: 'dollar-weakens',
        name: 'Dollar Weakens',
        description: 'Rate differential narrows, making the dollar less attractive relative to other currencies.',
        mechanism: 'Lower US rates reduce the yield advantage of holding dollars. Capital flows shift toward currencies with higher real rates. The dollar\'s role as a carry trade funder reverses.',
        confidence: 'mechanical',
        timeframe: 'days',
        assetImpacts: [
          { asset: 'DXY', name: 'US Dollar Index', direction: 'down', magnitude: 'large', rationale: 'Rate differential narrows' },
          { asset: 'UUP', name: 'Invesco DB USD Index', direction: 'down', magnitude: 'large', rationale: 'Dollar weakens against basket' },
          { asset: 'EEM', name: 'iShares MSCI EM', direction: 'up', magnitude: 'moderate', rationale: 'Weaker dollar eases EM pressure' },
        ],
        regionImpacts: [
          { region: 'Asia', direction: 'positive', severity: 'moderate', rationale: 'Dollar pressure relief' },
          { region: 'Emerging Markets', direction: 'positive', severity: 'moderate', rationale: 'Dollar debt burden eases' },
        ],
        secondaryEffects: [
          {
            id: 'commodity-repricing',
            name: 'Commodity Repricing',
            description: 'Weaker dollar makes commodities cheaper for the rest of the world, boosting demand.',
            mechanism: 'Commodities are priced in USD. When the dollar weakens, the same commodity costs less in euros, yen, yuan — stimulating global demand.',
            confidence: 'likely',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'large', rationale: 'Gold benefits from lower real yields AND weaker dollar' },
              { asset: 'SLV', name: 'iShares Silver Trust', direction: 'up', magnitude: 'large', rationale: 'Silver follows gold with higher beta' },
              { asset: 'DBC', name: 'Invesco DB Commodity', direction: 'up', magnitude: 'moderate', rationale: 'Broad commodity basket benefits' },
            ],
            regionImpacts: [
              { region: 'Commodity Exporters', direction: 'positive', severity: 'moderate', rationale: 'Brazil, Australia, Canada see demand pickup' },
            ],
          },
          {
            id: 'asian-dollar-squeeze-relief',
            name: 'Asian Dollar Squeeze Relief',
            description: 'Cheaper dollars ease funding pressure on Asian banks and importers.',
            mechanism: 'Lower rates and a weaker dollar reduce the cost of USD funding in swap markets. Asian central banks can stop burning reserves. Trade finance reopens.',
            confidence: 'likely',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'EWJ', name: 'iShares MSCI Japan', direction: 'up', magnitude: 'moderate', rationale: 'Yen stabilizes, equity outflows slow' },
              { asset: 'EMB', name: 'iShares JP Morgan EM Bond', direction: 'up', magnitude: 'moderate', rationale: 'EM bond pressure eases' },
            ],
            regionImpacts: [
              { region: 'Japan', direction: 'positive', severity: 'moderate', rationale: 'Dollar funding pressure relief' },
              { region: 'South Korea', direction: 'positive', severity: 'moderate', rationale: 'Trade finance normalizes' },
              { region: 'India', direction: 'positive', severity: 'moderate', rationale: 'Rupee stabilizes, oil costs ease' },
            ],
          },
        ],
      },
      {
        id: 'yield-curve-steepens',
        name: 'Yield Curve Steepens',
        description: 'Short-end drops as Fed cuts, long-end may rise on inflation fears — the curve normalizes.',
        mechanism: 'Fed cuts directly lower the short end of the curve. The long end may actually rise if markets interpret the cut as inflationary. The steepening benefits banks.',
        confidence: 'mechanical',
        timeframe: 'weeks',
        assetImpacts: [
          { asset: 'KBE', name: 'SPDR S&P Bank ETF', direction: 'up', magnitude: 'moderate', rationale: 'Steeper curve = wider NIM for banks' },
        ],
        regionImpacts: [
          { region: 'US Financials', direction: 'positive', severity: 'moderate', rationale: 'Bank profitability improves with steeper curve' },
        ],
      },
      {
        id: 'inflation-risk-reignites',
        name: 'Inflation Risk Reignites',
        description: 'Easy money combined with supply constraints could reignite inflation in 6-12 months.',
        mechanism: 'Rate cuts inject liquidity into an economy that may still have supply constraints. If demand recovers before supply does, inflation returns — the "stop-start" cycle.',
        confidence: 'probable',
        timeframe: 'months',
        assetImpacts: [
          { asset: 'TIP', name: 'iShares TIPS Bond', direction: 'up', magnitude: 'moderate', rationale: 'Inflation protection demand rises' },
          { asset: 'DBC', name: 'Invesco DB Commodity', direction: 'up', magnitude: 'moderate', rationale: 'Real assets benefit from inflation' },
        ],
        regionImpacts: [
          { region: 'Global', direction: 'negative', severity: 'moderate', rationale: 'Inflation erodes purchasing power again' },
        ],
      },
    ],
    historicalPrecedents: [
      { event: 'Dot-Com Emergency Cut', year: 2001, relevance: 'Surprise 50bp cut during tech bust', outcome: 'Didn\'t stop recession — markets rallied briefly then fell another 40%' },
      { event: 'Pre-GFC Emergency Cut', year: 2007, relevance: '50bp cut as credit markets seized', outcome: 'Initially rallied, then GFC hit anyway — cuts delayed but didn\'t prevent crisis' },
      { event: 'COVID Emergency Cuts', year: 2020, relevance: '150bp in emergency cuts over two weeks', outcome: 'V-shaped market recovery, but massive inflation 18 months later' },
    ],
    watchlist: [
      { indicator: 'fed_funds_futures', name: 'Fed Funds Futures', threshold: 'Pricing cuts before announcement = market forcing Fed\'s hand', mcpTool: 'fed_stance' },
      { indicator: 'treasury_2y', name: '2-Year Treasury Yield', threshold: 'Drops sharply below fed funds = market pricing emergency', mcpTool: 'interest_rates' },
      { indicator: 'hy_ig_spread', name: 'HY-IG Credit Spread', threshold: 'What broke that forced the cut', mcpTool: 'recession_indicators' },
      { indicator: 'kbe_index', name: 'Bank Stock Index (KBE)', threshold: 'If banks are crashing, it\'s a banking crisis' },
      { indicator: 'repo_rates', name: 'Repo Market Rates', threshold: 'Plumbing stress = liquidity crisis', mcpTool: 'interest_rates' },
      { indicator: 'recession_prob', name: 'Recession Probability', threshold: 'Above 60% = recession likely even with cuts', mcpTool: 'recession_probability' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // #4: US RECESSION CONFIRMED
  // ═══════════════════════════════════════════════════════════
  {
    id: 'us-recession-confirmed',
    name: 'US Recession Confirmed',
    category: 'structural',
    description: 'Official or de facto US recession confirmed by NBER or consecutive GDP contractions with rising unemployment.',
    triggerConditions: [
      'Two consecutive quarters of negative GDP growth',
      'Unemployment rising above 4.5% with accelerating trend',
      'NBER officially declares recession',
      'Sahm Rule triggered (3-month average unemployment rises 0.5%+ from 12-month low)',
    ],
    severity: 'severe',
    primaryEffects: [
      {
        id: 'consumer-spending-collapse',
        name: 'Consumer Spending Contraction',
        description: 'Consumer confidence collapses as job security fears trigger precautionary saving.',
        mechanism: 'Discretionary spending is cut first as households prioritize debt service and essentials. Consumer confidence leading indicators collapse, creating a self-reinforcing cycle of reduced spending and further economic weakening.',
        confidence: 'mechanical',
        timeframe: 'immediate',
        assetImpacts: [
          { asset: 'XLY', name: 'Consumer Discretionary SPDR', direction: 'down', magnitude: 'large', rationale: 'Discretionary spending first to be cut' },
          { asset: 'XRT', name: 'SPDR S&P Retail', direction: 'down', magnitude: 'large', rationale: 'Retail sales decline sharply' },
          { asset: 'XLP', name: 'Consumer Staples SPDR', direction: 'up', magnitude: 'moderate', rationale: 'Defensive rotation into staples' },
          { asset: 'WMT', name: 'Walmart', direction: 'up', magnitude: 'small', rationale: 'Trade-down effect benefits discount retailers' },
        ],
        regionImpacts: [
          { region: 'US', direction: 'negative', severity: 'critical', rationale: 'Consumer spending is 70% of US GDP' },
          { region: 'Canada', direction: 'negative', severity: 'moderate', rationale: 'Trade-linked economy follows US' },
        ],
        secondaryEffects: [
          {
            id: 'corporate-earnings-collapse',
            name: 'Corporate Earnings Collapse',
            description: 'Revenue declines hit operating leverage — earnings fall 2-3x faster than revenue.',
            mechanism: 'Companies with high fixed costs see earnings fall disproportionately as revenue declines. Guidance is slashed, triggering analyst downgrades in waves.',
            confidence: 'mechanical',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'SPY', name: 'S&P 500 SPDR', direction: 'down', magnitude: 'large', rationale: 'Broad market earnings contraction' },
              { asset: 'IWM', name: 'iShares Russell 2000', direction: 'down', magnitude: 'extreme', rationale: 'Small caps have highest operating leverage' },
              { asset: 'VIX', name: 'CBOE Volatility Index', direction: 'up', magnitude: 'extreme', rationale: 'Uncertainty + forced selling = vol spike' },
            ],
            regionImpacts: [
              { region: 'US', direction: 'negative', severity: 'critical', rationale: 'Earnings recession across most sectors' },
              { region: 'Global', direction: 'negative', severity: 'moderate', rationale: 'Multinational revenue exposure to US consumer' },
            ],
            secondaryEffects: [
              {
                id: 'mass-layoffs',
                name: 'Mass Layoff Cycle',
                description: 'Companies cut headcount to defend margins, creating a negative feedback loop with consumer spending.',
                mechanism: 'Tech and finance lead layoffs (high comp per employee), then manufacturing and retail follow. Each round reduces consumer spending further.',
                confidence: 'likely',
                timeframe: 'months',
                assetImpacts: [
                  { asset: 'XLK', name: 'Technology SPDR', direction: 'down', magnitude: 'moderate', rationale: 'Tech leads layoff cycles' },
                  { asset: 'XLF', name: 'Financial SPDR', direction: 'down', magnitude: 'moderate', rationale: 'Financial sector downsizes aggressively' },
                  { asset: 'XLI', name: 'Industrial SPDR', direction: 'down', magnitude: 'large', rationale: 'Manufacturing layoffs follow' },
                ],
                regionImpacts: [
                  { region: 'US', direction: 'negative', severity: 'critical', rationale: 'Unemployment-spending doom loop' },
                  { region: 'India', direction: 'negative', severity: 'moderate', rationale: 'IT outsourcing cuts follow US layoffs' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'flight-to-safety',
        name: 'Flight to Safety',
        description: 'Institutional investors execute risk-off rotation into Treasuries, gold, and cash.',
        mechanism: 'Risk-off playbook: equities and credit rotate into Treasuries and gold. Treasury yields plunge as demand surges. Dollar initially strengthens on repatriation flows.',
        confidence: 'mechanical',
        timeframe: 'immediate',
        assetImpacts: [
          { asset: 'TLT', name: 'iShares 20+ Year Treasury', direction: 'up', magnitude: 'large', rationale: 'Safe haven bid drives yields down' },
          { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'moderate', rationale: 'Gold as store of value' },
          { asset: 'UUP', name: 'Invesco DB USD Index', direction: 'up', magnitude: 'moderate', rationale: 'Initial dollar strength on repatriation' },
        ],
        regionImpacts: [
          { region: 'US Treasuries', direction: 'positive', severity: 'moderate', rationale: 'Ultimate safe haven bid' },
          { region: 'Switzerland', direction: 'positive', severity: 'low', rationale: 'Swiss franc safe haven flows' },
        ],
      },
      {
        id: 'fed-forced-to-cut',
        name: 'Fed Forced to Cut Aggressively',
        description: 'Rising unemployment and collapsing demand force the Fed to pivot from restrictive to accommodative.',
        mechanism: 'The Taylor Rule mechanically demands lower rates when output gap widens. Political pressure intensifies. The Fed pivots from inflation-fighting to recession-fighting.',
        confidence: 'likely',
        timeframe: 'months',
        assetImpacts: [
          { asset: 'TLT', name: 'iShares 20+ Year Treasury', direction: 'up', magnitude: 'large', rationale: 'Rate cuts drive bond rally' },
          { asset: 'XLU', name: 'Utilities SPDR', direction: 'up', magnitude: 'moderate', rationale: 'Rate-sensitive defensives benefit' },
          { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'moderate', rationale: 'Lower real yields boost gold' },
        ],
        regionImpacts: [
          { region: 'US Rate-Sensitive', direction: 'positive', severity: 'moderate', rationale: 'REITs, utilities, dividends benefit from cuts' },
          { region: 'Emerging Markets', direction: 'positive', severity: 'moderate', rationale: 'Weaker dollar eases EM debt burden' },
        ],
        secondaryEffects: [
          {
            id: 'recovery-positioning',
            name: 'Recovery Positioning (6-18 Months)',
            description: 'Markets bottom 6-9 months before the economy — the "most hated rally" begins.',
            mechanism: 'Forward-looking investors price the recovery before it happens. Small caps and cyclicals lead because they were most oversold and have highest operating leverage to revenue recovery.',
            confidence: 'probable',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'IWM', name: 'iShares Russell 2000', direction: 'up', magnitude: 'large', rationale: 'Small caps lead recoveries' },
              { asset: 'XLF', name: 'Financial SPDR', direction: 'up', magnitude: 'large', rationale: 'Financials recover with steepening curve' },
              { asset: 'XLI', name: 'Industrial SPDR', direction: 'up', magnitude: 'moderate', rationale: 'Cyclicals lead recovery rotation' },
            ],
            regionImpacts: [
              { region: 'US', direction: 'positive', severity: 'moderate', rationale: 'Recovery rotation begins' },
              { region: 'Emerging Markets', direction: 'positive', severity: 'moderate', rationale: 'Risk-on rotation returns capital to EM' },
            ],
          },
        ],
      },
    ],
    historicalPrecedents: [
      { event: 'Global Financial Crisis', year: 2008, relevance: 'Severe US recession with systemic banking crisis', outcome: 'SPX fell 57%, Fed cut to zero + QE, employment took 4+ years to recover' },
      { event: 'Dot-Com Recession', year: 2001, relevance: 'Sector recession that broadened', outcome: 'NASDAQ fell 78%, mild GDP contraction, Fed cut from 6.5% to 1%' },
      { event: 'COVID Recession', year: 2020, relevance: 'Fastest recession in history', outcome: 'V-shaped market recovery, K-shaped economic recovery, massive fiscal/monetary response' },
      { event: 'S&L Crisis Recession', year: 1990, relevance: 'Credit-driven recession', outcome: 'Relatively mild but showed credit problems cause longer recoveries' },
    ],
    watchlist: [
      { indicator: 'initial_claims', name: 'Initial Jobless Claims', threshold: 'Above 300K sustained = labor market breaking', mcpTool: 'employment_data' },
      { indicator: 'ism_pmi', name: 'ISM Manufacturing PMI', threshold: 'Below 45 for 2+ months = deep contraction', mcpTool: 'recession_indicators' },
      { indicator: 'consumer_sentiment', name: 'Consumer Sentiment', threshold: 'Below 60 = spending pullback imminent', mcpTool: 'market_sentiment' },
      { indicator: 'hy_spreads', name: 'High Yield Spreads', threshold: 'Above 600bps = credit stress becoming systemic' },
      { indicator: 'recession_prob', name: 'Recession Probability', threshold: 'Above 50% with confirmation = recession underway', mcpTool: 'recession_probability' },
      { indicator: 'sahm_rule', name: 'Sahm Rule', threshold: 'Triggered = recession already started', mcpTool: 'sahm_rule' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // #5: CHINA-TAIWAN ESCALATION
  // ═══════════════════════════════════════════════════════════
  {
    id: 'china-taiwan-escalation',
    name: 'China-Taiwan Escalation',
    category: 'geopolitical',
    description: 'Military escalation around Taiwan — from blockade to invasion — disrupting the global semiconductor supply chain and reshaping geopolitical alliances.',
    triggerConditions: [
      'PLA military exercises cross median line or enter Taiwan waters',
      'Naval blockade of Taiwan shipping lanes',
      'Missile strikes on Taiwan infrastructure',
      'Full amphibious invasion attempt',
    ],
    severity: 'critical',
    primaryEffects: [
      {
        id: 'semiconductor-supply-shock',
        name: 'Semiconductor Supply Shock',
        description: 'TSMC produces ~60% of global semiconductors and ~90% of advanced nodes. Any military action halts chip shipments.',
        mechanism: 'Fab operations require continuous power, chemical supply, and logistics. Even a blockade — not invasion — immediately halts shipments. No substitutes exist at scale for advanced nodes.',
        confidence: 'mechanical',
        timeframe: 'immediate',
        assetImpacts: [
          { asset: 'SMH', name: 'VanEck Semiconductor ETF', direction: 'down', magnitude: 'extreme', rationale: 'Global chip supply severed' },
          { asset: 'TSM', name: 'TSMC ADR', direction: 'down', magnitude: 'extreme', rationale: 'Direct target of disruption' },
          { asset: 'NVDA', name: 'NVIDIA', direction: 'down', magnitude: 'extreme', rationale: 'TSMC produces all NVIDIA GPUs' },
          { asset: 'AAPL', name: 'Apple Inc', direction: 'down', magnitude: 'large', rationale: 'iPhone production halts without TSMC chips' },
        ],
        regionImpacts: [
          { region: 'Taiwan', direction: 'negative', severity: 'critical', rationale: 'Direct conflict zone' },
          { region: 'US Tech', direction: 'negative', severity: 'critical', rationale: 'Entire tech sector depends on TSMC' },
          { region: 'South Korea', direction: 'negative', severity: 'high', rationale: 'Samsung/SK Hynix supply chains disrupted' },
        ],
        secondaryEffects: [
          {
            id: 'chip-hoarding',
            name: 'Chip Hoarding and Price Explosion',
            description: 'Panic buying drives available chip prices 5-10x. Companies with existing inventory gain massive advantage.',
            mechanism: 'Existing inventories (30-60 days) deplete rapidly. Governments and corporations hoard remaining supply. Secondary market emerges at extreme premiums.',
            confidence: 'likely',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'INTC', name: 'Intel', direction: 'up', magnitude: 'large', rationale: 'Only advanced US-based fab, suddenly critical' },
              { asset: 'GFS', name: 'GlobalFoundries', direction: 'up', magnitude: 'large', rationale: 'Non-Taiwan foundry becomes essential' },
              { asset: 'ASML', name: 'ASML Holding', direction: 'down', magnitude: 'moderate', rationale: 'Primary customer (TSMC) offline' },
            ],
            regionImpacts: [
              { region: 'US', direction: 'mixed', severity: 'moderate', rationale: 'Intel/GF benefit but downstream suffers' },
              { region: 'China', direction: 'negative', severity: 'high', rationale: 'SMIC can\'t fill the gap at advanced nodes' },
            ],
          },
          {
            id: 'forced-reshoring',
            name: 'Forced Reshoring Acceleration',
            description: 'CHIPS Act funding accelerates from years to months as national security urgency overrides cost concerns.',
            mechanism: 'Emergency authorization for new fab construction. Intel, Samsung, and TSMC Arizona projects get unlimited government backing.',
            confidence: 'probable',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'INTC', name: 'Intel', direction: 'up', magnitude: 'large', rationale: 'Government-backed fab expansion' },
              { asset: 'AMAT', name: 'Applied Materials', direction: 'up', magnitude: 'large', rationale: 'Semiconductor equipment demand surges' },
              { asset: 'LRCX', name: 'Lam Research', direction: 'up', magnitude: 'large', rationale: 'Fab construction equipment maker' },
            ],
            regionImpacts: [
              { region: 'US', direction: 'positive', severity: 'moderate', rationale: 'Fab construction boom' },
              { region: 'Japan', direction: 'positive', severity: 'moderate', rationale: 'Rapidus accelerated' },
            ],
          },
        ],
      },
      {
        id: 'defense-repricing',
        name: 'Defense and Geopolitical Repricing',
        description: 'Defense stocks surge, gold and oil spike on geopolitical risk premium, comprehensive sanctions on China.',
        mechanism: 'Emergency military spending expectations drive defense sector. Geopolitical risk premium added to all assets. Sanctions analogous to Russia package imposed on China.',
        confidence: 'mechanical',
        timeframe: 'immediate',
        assetImpacts: [
          { asset: 'ITA', name: 'iShares US Aerospace & Defense', direction: 'up', magnitude: 'large', rationale: 'Emergency military spending' },
          { asset: 'LMT', name: 'Lockheed Martin', direction: 'up', magnitude: 'large', rationale: 'Primary US defense contractor' },
          { asset: 'RTX', name: 'RTX Corporation', direction: 'up', magnitude: 'large', rationale: 'Missile and defense systems demand' },
          { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'large', rationale: 'Geopolitical safe haven' },
        ],
        regionImpacts: [
          { region: 'US Defense', direction: 'positive', severity: 'moderate', rationale: 'Defense budget expansion' },
          { region: 'EU Defense', direction: 'positive', severity: 'moderate', rationale: 'European rearmament acceleration' },
        ],
        secondaryEffects: [
          {
            id: 'shipping-disruption',
            name: 'Global Shipping Disruption',
            description: 'Taiwan Strait carries 50% of global container traffic. Military activity forces costly rerouting.',
            mechanism: 'Insurance exclusion zones expand. Shipping rates spike 5-10x. Transit times add 7-14 days for Pacific routes.',
            confidence: 'likely',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'ZIM', name: 'ZIM Integrated Shipping', direction: 'up', magnitude: 'extreme', rationale: 'Shipping rates explode' },
              { asset: 'SBLK', name: 'Star Bulk Carriers', direction: 'up', magnitude: 'large', rationale: 'Dry bulk rates surge on rerouting' },
            ],
            regionImpacts: [
              { region: 'Japan', direction: 'negative', severity: 'critical', rationale: 'Island nation dependent on sea lanes' },
              { region: 'South Korea', direction: 'negative', severity: 'high', rationale: 'Trade route disruption severe' },
              { region: 'Global', direction: 'negative', severity: 'high', rationale: 'Supply chain shock worse than Red Sea crisis' },
            ],
          },
          {
            id: 'us-china-decoupling',
            name: 'US-China Full Economic Decoupling',
            description: 'Comprehensive sanctions, asset freezes, and trade embargo force complete economic separation.',
            mechanism: 'US companies with China revenue (Apple 19%, Tesla, Qualcomm, Nike) face permanent market loss. Chinese holdings of US Treasuries ($800B+) become geopolitical weapon.',
            confidence: 'probable',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'FXI', name: 'iShares China Large-Cap', direction: 'down', magnitude: 'extreme', rationale: 'Chinese equities frozen/sanctioned' },
              { asset: 'KWEB', name: 'KraneShares China Internet', direction: 'down', magnitude: 'extreme', rationale: 'Chinese tech becomes uninvestable' },
              { asset: 'AAPL', name: 'Apple Inc', direction: 'down', magnitude: 'large', rationale: '19% revenue from China lost' },
              { asset: 'NKE', name: 'Nike Inc', direction: 'down', magnitude: 'large', rationale: 'China manufacturing and market lost' },
            ],
            regionImpacts: [
              { region: 'China', direction: 'negative', severity: 'critical', rationale: 'Economic isolation from Western markets' },
              { region: 'US', direction: 'negative', severity: 'high', rationale: 'Companies lose China revenue and supply chains' },
              { region: 'ASEAN', direction: 'positive', severity: 'moderate', rationale: 'Supply chain diversion beneficiary' },
            ],
          },
        ],
      },
      {
        id: 'rare-earth-weaponization',
        name: 'Rare Earth Supply Weaponization',
        description: 'China controls 60% of rare earth mining and 90% of processing. Retaliatory export ban cripples Western manufacturing.',
        mechanism: 'Neodymium, dysprosium, and other rare earths are essential for EV motors, wind turbines, and defense systems. No near-term substitutes exist.',
        confidence: 'likely',
        timeframe: 'weeks',
        assetImpacts: [
          { asset: 'REMX', name: 'VanEck Rare Earth ETF', direction: 'up', magnitude: 'extreme', rationale: 'Remaining non-China supply reprices massively' },
          { asset: 'MP', name: 'MP Materials', direction: 'up', magnitude: 'extreme', rationale: 'Only US rare earth mine becomes strategic asset' },
          { asset: 'LIT', name: 'Global X Lithium ETF', direction: 'down', magnitude: 'large', rationale: 'Battery supply chain disrupted' },
        ],
        regionImpacts: [
          { region: 'US', direction: 'negative', severity: 'high', rationale: 'Defense and EV production dependent on rare earths' },
          { region: 'Japan', direction: 'negative', severity: 'critical', rationale: 'Highest per-capita rare earth dependency' },
          { region: 'EU', direction: 'negative', severity: 'high', rationale: 'Green transition blocked without rare earths' },
        ],
      },
    ],
    historicalPrecedents: [
      { event: 'Taiwan Strait Crisis', year: 1996, relevance: 'China fired missiles near Taiwan, US deployed two carrier groups', outcome: 'Brief market dip, no sustained impact — but semiconductor dependency didn\'t exist then' },
      { event: 'Pelosi Taiwan Visit', year: 2022, relevance: 'PLA conducted largest-ever exercises around Taiwan', outcome: 'TSMC fell 7% intraweek, demonstrated symbolic provocations move markets' },
      { event: 'Russia-Ukraine Sanctions', year: 2022, relevance: 'Showed full sanctions on major economy are implementable', outcome: 'Energy/commodity weaponization precedent — key parallel for rare earths' },
      { event: 'Thailand Floods', year: 2011, relevance: 'Localized supply chain disruption caused 18-month HDD shortage', outcome: '30% price increase from single-point failure — Taiwan scenario would be orders of magnitude worse' },
    ],
    watchlist: [
      { indicator: 'pla_exercises', name: 'PLA Military Exercises Near Taiwan', threshold: 'Crossing median line = escalation above baseline' },
      { indicator: 'tsm_stock', name: 'TSMC Stock / Trading Halts', threshold: 'Emergency statements from Taipei = imminent threat' },
      { indicator: 'carrier_deployments', name: 'US Carrier Strike Group Deployments', threshold: 'Western Pacific positioning = military preparation' },
      { indicator: 'shipping_insurance', name: 'Taiwan Strait Shipping Insurance Rates', threshold: 'Spike = market pricing conflict probability' },
      { indicator: 'rare_earth_prices', name: 'Rare Earth Spot Prices', threshold: 'Leading indicator of supply weaponization' },
      { indicator: 'capital_rotation', name: 'Capital Rotation Score', threshold: 'Deep negative = risk-off positioning', mcpTool: 'capital_rotation_score' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // #6: YIELD CURVE INVERSION (SUSTAINED)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'yield-curve-inversion',
    name: 'Yield Curve Inversion (Sustained)',
    category: 'monetary',
    description: 'Sustained inversion of the yield curve (2s10s or 3m10y) signaling market expectations of recession and Fed rate cuts.',
    triggerConditions: [
      '2-year Treasury yield exceeds 10-year for 3+ months',
      '3-month T-bill yield exceeds 10-year Treasury (NY Fed preferred measure)',
      'Inversion depth exceeds -50bps',
    ],
    severity: 'severe',
    primaryEffects: [
      {
        id: 'bank-nim-compression',
        name: 'Bank Net Interest Margin Compression',
        description: 'Banks borrow short and lend long. When short rates exceed long rates, this spread turns negative.',
        mechanism: 'Every day the curve stays inverted, bank profitability erodes mechanically — they lose money on new loans. Regional banks with concentrated lending books are most exposed.',
        confidence: 'mechanical',
        timeframe: 'immediate',
        assetImpacts: [
          { asset: 'KBE', name: 'SPDR S&P Bank ETF', direction: 'down', magnitude: 'moderate', rationale: 'Broad bank profitability declining' },
          { asset: 'KRE', name: 'SPDR S&P Regional Banking', direction: 'down', magnitude: 'large', rationale: 'Regional banks most exposed to NIM compression' },
          { asset: 'XLF', name: 'Financial SPDR', direction: 'down', magnitude: 'moderate', rationale: 'Financial sector broad weakness' },
        ],
        regionImpacts: [
          { region: 'US', direction: 'negative', severity: 'moderate', rationale: 'Banking sector profitability declining' },
        ],
        secondaryEffects: [
          {
            id: 'credit-tightening-cascade',
            name: 'Credit Tightening Cascade',
            description: 'Banks with compressed margins tighten lending standards, starving small businesses of credit.',
            mechanism: 'Loan officer surveys show "significantly tightened" criteria. Small businesses that rely on bank credit face rejection or punitive terms.',
            confidence: 'likely',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'IWM', name: 'iShares Russell 2000', direction: 'down', magnitude: 'moderate', rationale: 'Small caps most bank-dependent' },
              { asset: 'BKLN', name: 'Invesco Senior Loan ETF', direction: 'down', magnitude: 'moderate', rationale: 'Leveraged lending pulls back' },
            ],
            regionImpacts: [
              { region: 'US', direction: 'negative', severity: 'moderate', rationale: 'Small business lending contracts' },
            ],
            secondaryEffects: [
              {
                id: 'small-business-stress',
                name: 'Small Business Stress Wave',
                description: 'Small businesses (50% of US employment) operate on 27-day average cash buffers — credit tightening pushes closures.',
                mechanism: 'Unable to finance inventory, make payroll, or invest. NFIB optimism collapses. Closure rate accelerates, concentrated in retail and services.',
                confidence: 'likely',
                timeframe: 'months',
                assetImpacts: [
                  { asset: 'IWM', name: 'iShares Russell 2000', direction: 'down', magnitude: 'large', rationale: 'Small cap earnings collapse' },
                  { asset: 'XRT', name: 'SPDR S&P Retail', direction: 'down', magnitude: 'moderate', rationale: 'Small retailer closures' },
                ],
                regionImpacts: [
                  { region: 'US', direction: 'negative', severity: 'high', rationale: 'SMEs are backbone of employment' },
                ],
              },
              {
                id: 'cre-stress',
                name: 'Commercial Real Estate Stress',
                description: 'CRE loans maturing can\'t refinance at viable rates. Regional banks hold 70% of CRE loans.',
                mechanism: 'Office vacancy (post-COVID structural) plus higher rates creates double hit. Distressed sales begin as loan extensions expire.',
                confidence: 'likely',
                timeframe: 'months',
                assetImpacts: [
                  { asset: 'VNQ', name: 'Vanguard Real Estate ETF', direction: 'down', magnitude: 'large', rationale: 'CRE valuations declining' },
                  { asset: 'KRE', name: 'SPDR S&P Regional Banking', direction: 'down', magnitude: 'extreme', rationale: 'CRE loan concentration risk' },
                ],
                regionImpacts: [
                  { region: 'US', direction: 'negative', severity: 'high', rationale: 'Office markets in SF, NYC, Chicago most exposed' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'curve-un-inversion',
        name: 'THE CRITICAL SIGNAL: Curve Un-Inversion',
        description: 'The curve un-inverts NOT because long rates rise but because the Fed cuts short rates. THIS is the actual danger signal.',
        mechanism: 'Historically, recession begins 0-3 months AFTER un-inversion, not during inversion. The inversion is the warning; the steepening is the event. By this point, credit tightening has already damaged the real economy.',
        confidence: 'likely',
        timeframe: 'months',
        assetImpacts: [
          { asset: 'SPY', name: 'S&P 500 SPDR', direction: 'down', magnitude: 'large', rationale: 'Recession onset follows un-inversion' },
          { asset: 'IWM', name: 'iShares Russell 2000', direction: 'down', magnitude: 'extreme', rationale: 'Small caps hit hardest in recession' },
          { asset: 'TLT', name: 'iShares 20+ Year Treasury', direction: 'up', magnitude: 'large', rationale: 'Flight to safety as recession begins' },
          { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'moderate', rationale: 'Safe haven demand' },
        ],
        regionImpacts: [
          { region: 'US', direction: 'negative', severity: 'critical', rationale: 'Recession onset — the inversion warned, the steepening confirms' },
          { region: 'Global', direction: 'negative', severity: 'moderate', rationale: 'US recession contagion through trade and capital flows' },
        ],
        secondaryEffects: [
          {
            id: 'bank-recovery-paradox',
            name: 'Bank Sector Recovery Begins',
            description: 'Paradoxically, banks begin recovering once the curve steepens because NIM expands again.',
            mechanism: 'Forward-looking investors buy banks at trough earnings knowing the margin structure is improving. This often marks the sector bottom even as the broader economy weakens.',
            confidence: 'probable',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'KBE', name: 'SPDR S&P Bank ETF', direction: 'up', magnitude: 'moderate', rationale: 'NIM expansion = margin recovery' },
              { asset: 'KRE', name: 'SPDR S&P Regional Banking', direction: 'up', magnitude: 'large', rationale: 'Regionals most sensitive to curve shape' },
            ],
            regionImpacts: [
              { region: 'US Financials', direction: 'positive', severity: 'moderate', rationale: 'Bank profitability structure improving' },
            ],
          },
        ],
      },
    ],
    historicalPrecedents: [
      { event: 'Inversion to GFC', year: 2006, relevance: 'Curve inverted 2006, un-inverted mid-2007, recession Dec 2007', outcome: '18-month lag was textbook — investors who acted on un-inversion saved portfolios' },
      { event: 'Inversion to Dot-Com Recession', year: 2000, relevance: 'Curve inverted mid-1998 to 2000', outcome: 'Recession began March 2001 — bubble masked signal for equity investors' },
      { event: 'Inversion to COVID Recession', year: 2019, relevance: 'Brief inversion August 2019', outcome: 'COVID accelerated timeline — credit was already tightening pre-pandemic' },
      { event: 'Inversion to S&L Recession', year: 1989, relevance: 'Classic inversion → regional bank failures', outcome: 'Template played out exactly — NIM compression → credit tightening → recession' },
    ],
    watchlist: [
      { indicator: '2s10s_spread', name: '2s10s Treasury Spread', threshold: 'Deeper and longer = stronger recession signal', mcpTool: 'yield_curve' },
      { indicator: '3m10y_spread', name: '3-Month/10-Year Spread', threshold: 'NY Fed\'s preferred recession predictor', mcpTool: 'yield_curve' },
      { indicator: 'sloos', name: 'Senior Loan Officer Survey (SLOOS)', threshold: 'Direct measure of credit tightening' },
      { indicator: 'nfib', name: 'NFIB Small Business Optimism', threshold: 'Below 90 = SME stress accelerating' },
      { indicator: 'recession_prob', name: 'Recession Probability', threshold: 'Above 40% during inversion = recession likely within 12 months', mcpTool: 'recession_probability' },
      { indicator: 'interest_rates', name: 'Interest Rate Structure', threshold: 'Watch for un-inversion — that\'s the trigger', mcpTool: 'interest_rates' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // #7: CREDIT MARKET FREEZE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'credit-market-freeze',
    name: 'Credit Market Freeze',
    category: 'credit',
    description: 'Credit markets seize as spreads blow out, bond issuance halts, and forced selling creates cascading defaults.',
    triggerConditions: [
      'Large unexpected corporate default or fund blowup',
      'CRE loan maturity wall with widespread markdowns',
      'Regional bank failure causing contagion',
      'High-yield spreads jumping above 800bps',
    ],
    severity: 'critical',
    primaryEffects: [
      {
        id: 'spread-blowout',
        name: 'Credit Spread Blowout',
        description: 'High-yield spreads jump from ~400bps to 800-1000bps as liquidity evaporates.',
        mechanism: 'A triggering event causes investors to dump corporate bonds simultaneously. Market makers widen bid-ask spreads. ETFs trade at large discounts to NAV as redemption pressure overwhelms liquidity.',
        confidence: 'mechanical',
        timeframe: 'immediate',
        assetImpacts: [
          { asset: 'HYG', name: 'iShares High Yield Corp Bond', direction: 'down', magnitude: 'extreme', rationale: 'High yield bonds dumped en masse' },
          { asset: 'JNK', name: 'SPDR Bloomberg High Yield', direction: 'down', magnitude: 'extreme', rationale: 'Junk bond sell-off' },
          { asset: 'LQD', name: 'iShares Investment Grade Corp', direction: 'down', magnitude: 'large', rationale: 'Contagion from HY to IG' },
          { asset: 'BKLN', name: 'Invesco Senior Loan ETF', direction: 'down', magnitude: 'extreme', rationale: 'Leveraged loan market freezes' },
          { asset: 'EMB', name: 'iShares JP Morgan EM Bond', direction: 'down', magnitude: 'large', rationale: 'EM credit cut off first' },
        ],
        regionImpacts: [
          { region: 'US', direction: 'negative', severity: 'critical', rationale: 'Largest corporate bond market in the world' },
          { region: 'EU', direction: 'negative', severity: 'high', rationale: 'Credit contagion crosses borders' },
          { region: 'Emerging Markets', direction: 'negative', severity: 'critical', rationale: 'EM first to lose market access' },
        ],
        secondaryEffects: [
          {
            id: 'bond-issuance-halt',
            name: 'Bond Issuance Halt',
            description: 'Cost of new issuance becomes prohibitive. Investment banks pull deals. Companies locked out of refinancing.',
            mechanism: 'When spreads blow out, new bonds can\'t be priced. The "new issue" market shuts completely. Companies that needed to refinance maturing debt are stranded.',
            confidence: 'mechanical',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'GS', name: 'Goldman Sachs', direction: 'down', magnitude: 'large', rationale: 'Underwriting revenue collapses' },
              { asset: 'BX', name: 'Blackstone Inc', direction: 'down', magnitude: 'large', rationale: 'PE portfolio companies can\'t refinance' },
            ],
            regionImpacts: [
              { region: 'US', direction: 'negative', severity: 'critical', rationale: 'Corporate refinancing wall hits' },
            ],
            secondaryEffects: [
              {
                id: 'default-cascade',
                name: 'Default Cascade',
                description: 'Defaults are contagious — each triggers CDS payouts that stress protection sellers, forcing more selling.',
                mechanism: 'CLO managers divert cash flows from equity tranches. Rating agencies downgrade entire sectors. Lenders tighten further — a vicious cycle.',
                confidence: 'likely',
                timeframe: 'months',
                assetImpacts: [
                  { asset: 'BKLN', name: 'Invesco Senior Loan ETF', direction: 'down', magnitude: 'extreme', rationale: 'Leveraged loan defaults cascade' },
                  { asset: 'IWM', name: 'iShares Russell 2000', direction: 'down', magnitude: 'large', rationale: 'Small caps have highest leverage' },
                ],
                regionImpacts: [
                  { region: 'US', direction: 'negative', severity: 'critical', rationale: 'Default contagion spreads across sectors' },
                  { region: 'Emerging Markets', direction: 'negative', severity: 'critical', rationale: 'EM dollar defaults accelerate' },
                ],
              },
            ],
          },
          {
            id: 'forced-selling-contagion',
            name: 'Forced Selling and Contagion',
            description: 'Mutual fund redemptions, margin calls, and CLO compliance failures create cascading forced liquidation.',
            mechanism: 'Each forced seller creates the next forced seller. Funds facing redemptions sell into illiquid markets, pushing prices lower, triggering more redemptions.',
            confidence: 'mechanical',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'AGG', name: 'iShares Core US Aggregate', direction: 'down', magnitude: 'moderate', rationale: 'Even investment grade hit by contagion' },
              { asset: 'TLT', name: 'iShares 20+ Year Treasury', direction: 'up', magnitude: 'moderate', rationale: 'Flight to Treasuries' },
            ],
            regionImpacts: [
              { region: 'Global', direction: 'negative', severity: 'high', rationale: 'Credit contagion ignores borders' },
            ],
          },
        ],
      },
      {
        id: 'cre-trigger',
        name: 'Commercial Real Estate Trigger',
        description: 'CRE is the most likely trigger or accelerant — $1.5T in loans maturing, many underwater.',
        mechanism: 'Regional banks hold 70% of CRE loans. A single large CMBS default triggers repricing of the entire sector. Office vacancy at 30-40% means many loans are underwater.',
        confidence: 'likely',
        timeframe: 'weeks',
        assetImpacts: [
          { asset: 'VNQ', name: 'Vanguard Real Estate ETF', direction: 'down', magnitude: 'extreme', rationale: 'CRE valuations collapse' },
          { asset: 'KRE', name: 'SPDR S&P Regional Banking', direction: 'down', magnitude: 'extreme', rationale: 'Regional banks hold 70% of CRE exposure' },
        ],
        regionImpacts: [
          { region: 'US', direction: 'negative', severity: 'critical', rationale: 'Office-heavy cities: SF, NYC, Chicago most exposed' },
        ],
        secondaryEffects: [
          {
            id: 'regional-bank-stress',
            name: 'Regional Bank Stress',
            description: 'SVB contagion template — depositors flee to "too big to fail" banks, creating self-fulfilling runs.',
            mechanism: 'Regional banks with 30-50% CRE exposure face deposit flight. Rational depositor behavior becomes a self-fulfilling bank run.',
            confidence: 'likely',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'KRE', name: 'SPDR S&P Regional Banking', direction: 'down', magnitude: 'extreme', rationale: 'Deposit flight + CRE losses' },
              { asset: 'XLF', name: 'Financial SPDR', direction: 'down', magnitude: 'moderate', rationale: 'Broad financial sector contagion' },
            ],
            regionImpacts: [
              { region: 'US', direction: 'negative', severity: 'critical', rationale: 'Regional banking system under threat' },
            ],
          },
        ],
      },
      {
        id: 'fed-emergency-intervention',
        name: 'Fed Emergency Intervention',
        description: 'Fed activates emergency lending facilities — corporate credit facility, money market backstop, potentially direct bond purchases.',
        mechanism: 'If severe enough, outright corporate bond purchases (March 2020 precedent). The Fed becomes "buyer of last resort" to prevent credit collapse from destroying the real economy.',
        confidence: 'likely',
        timeframe: 'months',
        assetImpacts: [
          { asset: 'HYG', name: 'iShares High Yield Corp Bond', direction: 'up', magnitude: 'large', rationale: 'Fed backstop reprices risk' },
          { asset: 'SPY', name: 'S&P 500 SPDR', direction: 'up', magnitude: 'moderate', rationale: '"Fed put" restored' },
        ],
        regionImpacts: [
          { region: 'US', direction: 'positive', severity: 'moderate', rationale: 'Direct Fed support stabilizes markets' },
          { region: 'EU', direction: 'positive', severity: 'moderate', rationale: 'ECB follows with own facilities' },
        ],
      },
    ],
    historicalPrecedents: [
      { event: 'Global Financial Crisis Credit Freeze', year: 2008, relevance: 'Lehman bankruptcy froze credit globally', outcome: 'HY spreads hit 2000bps, Fed launched TALF/CPFF/AMLF, 18+ months to normalize' },
      { event: 'COVID Credit Freeze', year: 2020, relevance: 'Credit markets froze for ~3 weeks', outcome: 'HY spreads hit 1100bps, Fed announced unlimited QE + corporate bond buying, unfroze in days' },
      { event: 'European Sovereign Credit Crisis', year: 2011, relevance: 'Greek default fear froze European interbank lending', outcome: 'ECB\'s "whatever it takes" was the turning point — verbal intervention works if credible' },
      { event: 'Energy Credit Crisis', year: 2016, relevance: 'Oil collapse caused E&P default wave', outcome: 'HY energy spreads hit 1600bps, showed sector stress can spread to broader credit' },
    ],
    watchlist: [
      { indicator: 'hy_oas', name: 'ICE BofA HY OAS', threshold: 'Above 600bps = stress; above 800bps = potential freeze' },
      { indicator: 'ig_issuance', name: 'IG New Issuance Calendar', threshold: 'Deals being pulled = banks can\'t place paper' },
      { indicator: 'etf_nav_discount', name: 'HYG/JNK NAV Discounts', threshold: 'Exceeding 2% = liquidity breakdown' },
      { indicator: 'discount_window', name: 'Fed Discount Window Borrowing', threshold: 'Surge = interbank trust breakdown' },
      { indicator: 'cmbs_delinquency', name: 'CMBS Delinquency Rates', threshold: 'Leading indicator of CRE stress' },
      { indicator: 'recession_prob', name: 'Recession Probability', threshold: 'Credit stress feeds recession risk', mcpTool: 'recession_probability' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // #8: EM CURRENCY CRISIS
  // ═══════════════════════════════════════════════════════════
  {
    id: 'em-currency-crisis',
    name: 'EM Currency Crisis',
    category: 'currency',
    description: 'Emerging market currencies collapse as capital flight, reserve depletion, and dollar debt create a reflexive doom loop.',
    triggerConditions: [
      'Fed hawkishness strengthens dollar beyond EM central bank defense',
      'Commodity price collapse removes EM export revenue',
      'Political instability or policy misstep (e.g., firing central bank governor)',
      'Current account deficits exceeding 5% of GDP with low reserves',
    ],
    severity: 'severe',
    primaryEffects: [
      {
        id: 'capital-flight',
        name: 'Capital Flight Acceleration',
        description: 'Foreign investors sell EM bonds and equities simultaneously, depreciating the currency and creating a reflexive doom loop.',
        mechanism: 'As investors convert to dollars, selling pressure depreciates the currency further, creating more losses for remaining holders who then also sell.',
        confidence: 'mechanical',
        timeframe: 'immediate',
        assetImpacts: [
          { asset: 'EEM', name: 'iShares MSCI EM', direction: 'down', magnitude: 'large', rationale: 'Broad EM equity sell-off' },
          { asset: 'EMLC', name: 'VanEck EM Local Currency Bond', direction: 'down', magnitude: 'extreme', rationale: 'Local currency bonds = double loss (bond + FX)' },
          { asset: 'EMB', name: 'iShares JP Morgan EM Bond', direction: 'down', magnitude: 'large', rationale: 'Even USD-denominated EM bonds sell off' },
        ],
        regionImpacts: [
          { region: 'Turkey', direction: 'negative', severity: 'critical', rationale: 'Structurally weakest: high inflation, low reserves, political risk' },
          { region: 'Argentina', direction: 'negative', severity: 'critical', rationale: 'Chronic dollar shortage, serial defaulter' },
          { region: 'Egypt', direction: 'negative', severity: 'high', rationale: 'Import-dependent, low reserves' },
        ],
        secondaryEffects: [
          {
            id: 'reserve-depletion',
            name: 'Foreign Reserve Depletion',
            description: 'Central banks burn FX reserves defending currency. Once below 3 months import cover, market confidence collapses.',
            mechanism: 'Reserves accumulated over years drain in weeks. When the market knows the central bank is running out, the attack intensifies.',
            confidence: 'mechanical',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'UUP', name: 'Invesco DB USD Index', direction: 'up', magnitude: 'large', rationale: 'Dollar strengthens as EM sells reserves' },
              { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'moderate', rationale: 'Central banks revalue remaining reserves to gold' },
            ],
            regionImpacts: [
              { region: 'Affected EM', direction: 'negative', severity: 'critical', rationale: 'Running out of ammunition' },
            ],
            secondaryEffects: [
              {
                id: 'forced-devaluation',
                name: 'Forced Devaluation or Float',
                description: 'When reserves hit critical levels, the central bank abandons defense — currency crashes 30-50% overnight.',
                mechanism: 'The choice: let the currency crash or impose capital controls that trap foreign money. Either destroys investor confidence for years.',
                confidence: 'likely',
                timeframe: 'months',
                assetImpacts: [
                  { asset: 'EMLC', name: 'VanEck EM Local Currency Bond', direction: 'down', magnitude: 'extreme', rationale: 'Currency collapse destroys local bond value' },
                  { asset: 'EEM', name: 'iShares MSCI EM', direction: 'down', magnitude: 'large', rationale: 'Even strong EMs get sold on contagion' },
                ],
                regionImpacts: [
                  { region: 'Affected Country', direction: 'negative', severity: 'critical', rationale: 'Currency devaluation imports massive inflation' },
                  { region: 'Neighboring EMs', direction: 'negative', severity: 'high', rationale: 'Contagion fear spreads' },
                ],
              },
            ],
          },
          {
            id: 'dollar-debt-spiral',
            name: 'Dollar-Denominated Debt Spiral',
            description: 'A 50% devaluation doubles the local-currency cost of dollar debt service. Solvency turns to insolvency.',
            mechanism: 'EM sovereigns and corporates with USD debt see repayment burden increase proportionally with depreciation. Entities that were solvent become insolvent at the new exchange rate.',
            confidence: 'mechanical',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'EMB', name: 'iShares JP Morgan EM Bond', direction: 'down', magnitude: 'extreme', rationale: 'EM sovereign defaults on USD bonds' },
              { asset: 'JPM', name: 'JPMorgan Chase', direction: 'down', magnitude: 'moderate', rationale: 'EM loan exposure hits bank capital' },
            ],
            regionImpacts: [
              { region: 'Affected EM', direction: 'negative', severity: 'critical', rationale: 'Dollar debt mathematically unsustainable' },
              { region: 'European Banks', direction: 'negative', severity: 'moderate', rationale: '$3T+ in EM exposure at European banks' },
            ],
          },
        ],
      },
      {
        id: 'em-contagion',
        name: 'Contagion to Other EMs',
        description: 'Investors treat EM as an asset class — crisis in one causes redemptions from EM-dedicated funds that force selling across ALL EMs.',
        mechanism: '"Innocent bystander" countries with strong fundamentals get sold because they\'re in the same index. The "Fragile Five" pattern — weakness in one exposes the next-weakest.',
        confidence: 'likely',
        timeframe: 'weeks',
        assetImpacts: [
          { asset: 'EEM', name: 'iShares MSCI EM', direction: 'down', magnitude: 'large', rationale: 'Index-based selling hits all EMs' },
          { asset: 'VWO', name: 'Vanguard FTSE EM', direction: 'down', magnitude: 'large', rationale: 'Broad EM outflows' },
          { asset: 'INDA', name: 'iShares MSCI India', direction: 'down', magnitude: 'moderate', rationale: 'Even strong EMs sold in contagion' },
          { asset: 'EWZ', name: 'iShares MSCI Brazil', direction: 'down', magnitude: 'large', rationale: 'Commodity EM hit by demand + sentiment' },
        ],
        regionImpacts: [
          { region: 'Brazil', direction: 'negative', severity: 'high', rationale: 'Twin deficits make it vulnerable' },
          { region: 'South Africa', direction: 'negative', severity: 'high', rationale: 'Structural weakness exposed' },
          { region: 'India', direction: 'negative', severity: 'moderate', rationale: 'Strong fundamentals provide some cushion' },
        ],
        secondaryEffects: [
          {
            id: 'em-forced-hikes',
            name: 'EM Central Banks Forced to Hike into Weakness',
            description: 'Central banks raise rates 500-1000bps in single meetings to defend currencies — crushing domestic demand.',
            mechanism: 'They choose currency stability over growth because hyperinflation is worse. Each hike crushes housing, kills lending, pushes economy into recession.',
            confidence: 'likely',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'EEM', name: 'iShares MSCI EM', direction: 'down', magnitude: 'moderate', rationale: 'Rate hikes kill EM equity valuations' },
            ],
            regionImpacts: [
              { region: 'All Vulnerable EMs', direction: 'negative', severity: 'high', rationale: 'Choosing currency stability over growth' },
            ],
          },
          {
            id: 'imf-intervention',
            name: 'IMF Intervention',
            description: 'Countries exhaust reserves and lose market access, forcing IMF emergency loan requests with harsh conditionality.',
            mechanism: 'IMF demands fiscal austerity, structural reforms, currency float — painful medicine that reduces growth short-term but theoretically restores stability.',
            confidence: 'probable',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'EMB', name: 'iShares JP Morgan EM Bond', direction: 'up', magnitude: 'small', rationale: 'IMF backstop provides floor' },
            ],
            regionImpacts: [
              { region: 'Affected EM', direction: 'mixed', severity: 'high', rationale: 'Stabilization comes with 2-3 years of austerity pain' },
            ],
          },
        ],
      },
      {
        id: 'dm-spillovers',
        name: 'Developed Market Spillovers',
        description: 'European banks have $3T+ in EM exposure. EM defaults hit DM bank capital ratios.',
        mechanism: 'BBVA in Turkey, Standard Chartered in Asia, SocGen in Africa — EM defaults hit DM bank balance sheets. Commodity exporters lose EM demand.',
        confidence: 'probable',
        timeframe: 'months',
        assetImpacts: [
          { asset: 'EUFN', name: 'iShares MSCI Europe Financials', direction: 'down', magnitude: 'large', rationale: 'European banks have heaviest EM exposure' },
          { asset: 'EWA', name: 'iShares MSCI Australia', direction: 'down', magnitude: 'moderate', rationale: 'Commodity demand from EMs falls' },
        ],
        regionImpacts: [
          { region: 'EU', direction: 'negative', severity: 'moderate', rationale: 'Bank channel transmits EM stress' },
          { region: 'Australia', direction: 'negative', severity: 'moderate', rationale: 'Commodity demand destruction' },
        ],
      },
    ],
    historicalPrecedents: [
      { event: 'Asian Financial Crisis', year: 1997, relevance: 'Classic EM currency crisis — baht broke, contagion swept Asia', outcome: 'GDP contractions 5-13%, IMF bailouts, 5+ year recovery, proved contagion treats EM as one asset class' },
      { event: 'Turkey/Argentina Crisis', year: 2018, relevance: 'Fed tightening + political risk caused lira/peso collapse', outcome: 'Currencies lost 40-50%, showed EM vulnerability persists even in moderate DM tightening' },
      { event: 'Taper Tantrum', year: 2013, relevance: 'Mere mention of Fed tapering caused EM rout', outcome: '"Fragile Five" sold off 15-25%, showed Fed COMMUNICATION alone triggers EM stress' },
      { event: 'Mexican Peso Crisis', year: 1994, relevance: 'Unsustainable peg broke, contagion to Latin America', outcome: 'Peso devalued 50%, US $50B rescue required, showed even US neighbors are vulnerable' },
    ],
    watchlist: [
      { indicator: 'dxy', name: 'US Dollar Index (DXY)', threshold: 'Above 110 = single biggest EM stress indicator', mcpTool: 'capital_rotation_instruments' },
      { indicator: 'em_cds', name: 'EM Sovereign CDS Spreads', threshold: 'Above 500bps = market pricing default' },
      { indicator: 'fx_reserves', name: 'FX Reserve Changes (Monthly IMF Data)', threshold: 'Depletion rate indicates defense intensity' },
      { indicator: 'current_account', name: 'Current Account Deficits', threshold: 'Above 5% GDP = structural vulnerability' },
      { indicator: 'real_rate_diff', name: 'Real Rate Differentials (EM vs US)', threshold: 'When US offers higher real yields, capital flows reverse' },
      { indicator: 'capital_rotation', name: 'Capital Rotation Score', threshold: 'Risk-off signal = EM outflows', mcpTool: 'capital_rotation_score' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // #9: TRADE WAR ESCALATION (US-CHINA)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'trade-war-escalation',
    name: 'Trade War Escalation (US-China)',
    category: 'geopolitical',
    description: 'Major escalation in US-China tariffs and trade restrictions, disrupting supply chains, spiking consumer prices, and forcing economic decoupling.',
    triggerConditions: [
      'Tariff increases of 25-60%+ on Chinese imports',
      'China retaliates with tariffs on US agriculture and technology',
      'US expands entity list / export controls on semiconductors',
      'Trade negotiations collapse or political escalation',
    ],
    severity: 'severe',
    primaryEffects: [
      {
        id: 'tariff-shock',
        name: 'Tariff Shock and Supply Chain Chaos',
        description: 'Tariff increases of 25-60% immediately raise landed costs for US importers. Uncertainty freezes capex.',
        mechanism: 'Companies face margin compression or pass costs to consumers. Uncertainty about further escalation freezes purchasing decisions and capital expenditure.',
        confidence: 'mechanical',
        timeframe: 'immediate',
        assetImpacts: [
          { asset: 'FXI', name: 'iShares China Large-Cap', direction: 'down', magnitude: 'large', rationale: 'Chinese exporters lose US market access' },
          { asset: 'SPY', name: 'S&P 500 SPDR', direction: 'down', magnitude: 'moderate', rationale: 'US companies face higher input costs' },
          { asset: 'XRT', name: 'SPDR S&P Retail', direction: 'down', magnitude: 'large', rationale: 'Retailers most exposed to import costs' },
        ],
        regionImpacts: [
          { region: 'China', direction: 'negative', severity: 'high', rationale: 'Export-dependent sectors hit' },
          { region: 'US', direction: 'negative', severity: 'moderate', rationale: 'Higher costs, uncertainty' },
          { region: 'ASEAN', direction: 'positive', severity: 'moderate', rationale: 'Alternative sourcing destination' },
          { region: 'Mexico', direction: 'positive', severity: 'moderate', rationale: 'Nearshoring beneficiary' },
        ],
        secondaryEffects: [
          {
            id: 'consumer-price-spike',
            name: 'US Consumer Price Spike',
            description: 'Tariffs are a consumption tax. Categories with high China sourcing see 10-25% price increases.',
            mechanism: 'Electronics, furniture, clothing, toys all heavily China-sourced. Price increases hit lower-income households hardest.',
            confidence: 'likely',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'XLY', name: 'Consumer Discretionary SPDR', direction: 'down', magnitude: 'large', rationale: 'Consumer spending squeezed' },
              { asset: 'TGT', name: 'Target Corporation', direction: 'down', magnitude: 'large', rationale: 'Import-heavy retailer margin pressure' },
              { asset: 'TLT', name: 'iShares 20+ Year Treasury', direction: 'down', magnitude: 'moderate', rationale: 'Inflation fears push yields up' },
            ],
            regionImpacts: [
              { region: 'US', direction: 'negative', severity: 'moderate', rationale: 'Consumer price inflation from tariffs' },
            ],
            secondaryEffects: [
              {
                id: 'fed-paralysis',
                name: 'Fed Policy Paralysis',
                description: 'The Fed faces stagflation lite — tariff inflation argues for higher rates while economic slowdown argues for lower rates.',
                mechanism: 'The Fed\'s tools are designed for demand shocks, not supply shocks. Result is policy paralysis and elevated volatility.',
                confidence: 'probable',
                timeframe: 'months',
                assetImpacts: [
                  { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'large', rationale: 'Uncertainty hedge when Fed is paralyzed' },
                  { asset: 'VIX', name: 'CBOE Volatility Index', direction: 'up', magnitude: 'large', rationale: 'Markets can\'t price the reaction function' },
                ],
                regionImpacts: [
                  { region: 'US', direction: 'negative', severity: 'moderate', rationale: 'Policy uncertainty compounds economic stress' },
                ],
              },
            ],
          },
          {
            id: 'agriculture-retaliation',
            name: 'US Agriculture Retaliation',
            description: 'China retaliates with tariffs on US agriculture — soybeans, pork, corn. US farmers lose their largest export market.',
            mechanism: 'China is the #1 buyer of US soybeans ($14B annually). Crop prices crash domestically. Farm bankruptcies accelerate in Midwest.',
            confidence: 'mechanical',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'SOYB', name: 'Teucrium Soybean Fund', direction: 'down', magnitude: 'large', rationale: 'US soybean demand collapses' },
              { asset: 'MOO', name: 'VanEck Agribusiness ETF', direction: 'down', magnitude: 'large', rationale: 'US agriculture sector hit' },
              { asset: 'DE', name: 'Deere & Company', direction: 'down', magnitude: 'large', rationale: 'Farm equipment demand drops with farm income' },
            ],
            regionImpacts: [
              { region: 'US Midwest', direction: 'negative', severity: 'high', rationale: 'Farm income collapses, political feedback loop' },
              { region: 'Brazil', direction: 'positive', severity: 'high', rationale: 'Substitutes as China\'s soybean supplier' },
              { region: 'Argentina', direction: 'positive', severity: 'moderate', rationale: 'Alternative agricultural supplier' },
            ],
          },
          {
            id: 'tech-decoupling',
            name: 'Technology Decoupling',
            description: 'US expands export controls. China retaliates with rare earth restrictions. Two parallel tech ecosystems begin forming.',
            mechanism: 'US restricts semiconductor equipment and AI chips to China. China bans US tech from government procurement. Parallel technology stacks emerge.',
            confidence: 'likely',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'NVDA', name: 'NVIDIA', direction: 'down', magnitude: 'large', rationale: 'China is 20%+ of NVIDIA revenue' },
              { asset: 'SOXX', name: 'iShares Semiconductor ETF', direction: 'down', magnitude: 'moderate', rationale: 'Lost China revenue across sector' },
              { asset: 'KWEB', name: 'KraneShares China Internet', direction: 'down', magnitude: 'large', rationale: 'Chinese tech cut off from Western tools' },
            ],
            regionImpacts: [
              { region: 'China', direction: 'negative', severity: 'high', rationale: 'Tech access restricted' },
              { region: 'US', direction: 'negative', severity: 'moderate', rationale: 'Lost market revenue' },
            ],
          },
        ],
      },
      {
        id: 'currency-weaponization',
        name: 'Currency Weaponization',
        description: 'China allows yuan depreciation to offset tariff impact. Other Asian currencies follow in competitive devaluation.',
        mechanism: 'A weaker yuan makes Chinese exports cheaper, partially neutralizing tariffs. US labels China a "currency manipulator." Asian currencies depreciate competitively.',
        confidence: 'probable',
        timeframe: 'months',
        assetImpacts: [
          { asset: 'FXI', name: 'iShares China Large-Cap', direction: 'down', magnitude: 'moderate', rationale: 'Yuan depreciation hurts dollar-based returns' },
          { asset: 'UUP', name: 'Invesco DB USD Index', direction: 'up', magnitude: 'moderate', rationale: 'Dollar strengthens vs devaluing currencies' },
          { asset: 'EEM', name: 'iShares MSCI EM', direction: 'down', magnitude: 'moderate', rationale: 'Asian devaluation cascade' },
        ],
        regionImpacts: [
          { region: 'China', direction: 'negative', severity: 'moderate', rationale: 'Controlled depreciation, some relief' },
          { region: 'Asia', direction: 'negative', severity: 'moderate', rationale: 'Competitive devaluation hurts all' },
        ],
        secondaryEffects: [
          {
            id: 'dedollarization',
            name: 'De-dollarization Acceleration',
            description: 'Weaponization of dollar system pushes China to accelerate alternative payment systems and gold accumulation.',
            mechanism: 'CIPS expansion, bilateral swap lines, central bank gold buying. Multi-decade trend but trade wars accelerate the timeline.',
            confidence: 'speculative',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'moderate', rationale: 'Central bank gold buying accelerates' },
              { asset: 'BTC', name: 'Bitcoin', direction: 'up', magnitude: 'moderate', rationale: 'Alternative store of value narrative' },
            ],
            regionImpacts: [
              { region: 'China', direction: 'positive', severity: 'low', rationale: 'Financial independence progress' },
              { region: 'US', direction: 'negative', severity: 'low', rationale: 'Very long-term privilege erosion' },
            ],
          },
        ],
      },
    ],
    historicalPrecedents: [
      { event: 'US-China Trade War', year: 2018, relevance: 'Tariffs escalated from $50B to $550B in goods', outcome: 'SPX fell 20% in Q4 2018, farmers got $28B subsidies, Phase 1 resolved little' },
      { event: 'Smoot-Hawley Tariff Act', year: 1930, relevance: 'Massive protectionist tariff increase', outcome: 'Global trade fell 66% by 1934, widely credited with deepening the Great Depression' },
      { event: 'Liberation Day Tariffs', year: 2025, relevance: 'Tariffs of 25-145% on Chinese goods', outcome: 'Markets dropped 10-15% in days, China retaliated with rare earth restrictions' },
      { event: 'Plaza Accord', year: 1985, relevance: 'US forced dollar devaluation against yen/mark', outcome: 'Showed currency manipulation as trade weapon, contributed to Japan\'s lost decades' },
    ],
    watchlist: [
      { indicator: 'ustr_filings', name: 'USTR Tariff Announcements', threshold: 'New tariff rounds or rate increases' },
      { indicator: 'usd_cny', name: 'USD/CNY Exchange Rate', threshold: 'Above 7.35 = currency weaponization underway' },
      { indicator: 'soybean_exports', name: 'US Soybean Export Inspections', threshold: 'Weekly USDA data shows retaliation impact' },
      { indicator: 'container_rates', name: 'Container Shipping Rates', threshold: 'Spike = supply chain disruption severity' },
      { indicator: 'pce_goods', name: 'PCE Deflator Goods Component', threshold: 'Tariff pass-through to consumer prices' },
      { indicator: 'inflation_data', name: 'Inflation Data', threshold: 'Tariff-driven inflation pressure', mcpTool: 'inflation_data' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // #10: SOVEREIGN DEBT CRISIS (DEVELOPED MARKET)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'sovereign-debt-crisis',
    name: 'Sovereign Debt Crisis (Developed Market)',
    category: 'structural',
    description: 'Bond vigilantes attack a developed market sovereign — yields spike uncontrollably, triggering a funding cost spiral, banking stress, and forced austerity.',
    triggerConditions: [
      'Failed sovereign bond auction or surprise deficit revision',
      'Political crisis destroying fiscal credibility (Liz Truss template)',
      'Central bank credibility loss or forced policy reversal',
      'Debt-to-GDP trajectory becoming mathematically unsustainable',
    ],
    severity: 'critical',
    primaryEffects: [
      {
        id: 'bond-vigilante-attack',
        name: 'Bond Vigilante Attack',
        description: 'Sovereign bond holders dump government debt. Yields spike 100-300bps in days as the market demands a fiscal credibility premium.',
        mechanism: 'A triggering event causes loss of confidence in fiscal sustainability. Automated risk systems amplify the move as VaR models force position reductions. Selling begets selling.',
        confidence: 'mechanical',
        timeframe: 'immediate',
        assetImpacts: [
          { asset: 'TLT', name: 'iShares 20+ Year Treasury', direction: 'down', magnitude: 'large', rationale: 'If US — sovereign bonds sold off' },
          { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'large', rationale: 'Gold as alternative to sovereign paper' },
          { asset: 'BTC', name: 'Bitcoin', direction: 'up', magnitude: 'moderate', rationale: 'Fiat alternative narrative strengthens' },
        ],
        regionImpacts: [
          { region: 'Affected Country', direction: 'negative', severity: 'critical', rationale: 'Government funding costs explode' },
          { region: 'Similar Fiscal Profiles', direction: 'negative', severity: 'high', rationale: 'Contagion to other high-debt sovereigns' },
        ],
        secondaryEffects: [
          {
            id: 'funding-cost-spiral',
            name: 'Funding Cost Spiral',
            description: 'Higher yields increase debt service cost, worsening the deficit, which worsens creditworthiness — a death spiral.',
            mechanism: 'For a country with 100%+ debt/GDP, every 100bps yield increase adds 1%+ of GDP to annual interest expense. The math becomes self-reinforcing.',
            confidence: 'mechanical',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'KBE', name: 'SPDR S&P Bank ETF', direction: 'down', magnitude: 'extreme', rationale: 'Banks hold 20-40% of own sovereign bonds' },
            ],
            regionImpacts: [
              { region: 'Affected Country', direction: 'negative', severity: 'critical', rationale: 'Debt servicing consumes growing share of revenue' },
            ],
            secondaryEffects: [
              {
                id: 'banking-system-stress',
                name: 'Banking System Stress (Doom Loop)',
                description: 'Domestic banks hold 20-40% of own government bonds. Sovereign losses destroy bank capital ratios.',
                mechanism: 'The "sovereign-bank doom loop" — bank losses weaken the sovereign\'s implicit guarantee, which weakens bonds, which weakens banks further.',
                confidence: 'likely',
                timeframe: 'months',
                assetImpacts: [
                  { asset: 'EUFN', name: 'iShares MSCI Europe Financials', direction: 'down', magnitude: 'large', rationale: 'European bank sovereign exposure' },
                  { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'moderate', rationale: 'Safe haven from banking stress' },
                ],
                regionImpacts: [
                  { region: 'Affected Country', direction: 'negative', severity: 'critical', rationale: 'Banking system becomes victim and amplifier' },
                ],
              },
              {
                id: 'rating-downgrade-cascade',
                name: 'Credit Rating Downgrade Cascade',
                description: 'Sovereign downgrade mechanically triggers downgrades of all entities rated at the sovereign ceiling.',
                mechanism: 'Banks, utilities, and state-owned enterprises cannot be rated higher than their sovereign. Forced selling by mandated IG-only investors creates another wave.',
                confidence: 'likely',
                timeframe: 'months',
                assetImpacts: [
                  { asset: 'SPY', name: 'S&P 500 SPDR', direction: 'down', magnitude: 'moderate', rationale: 'If US — broad market confidence shaken' },
                ],
                regionImpacts: [
                  { region: 'All DM Sovereigns', direction: 'negative', severity: 'moderate', rationale: 'Investors reassess all fiscal positions' },
                ],
              },
            ],
          },
          {
            id: 'currency-crisis-component',
            name: 'Currency Crisis Component',
            description: 'Foreign holders sell bonds AND the currency. For countries with own currency, it crashes 10-20%.',
            mechanism: 'Dual selling pressure — both the bonds and the FX. Currency depreciation imports inflation, which raises rate expectations, worsening the bond selloff.',
            confidence: 'likely',
            timeframe: 'weeks',
            assetImpacts: [
              { asset: 'UUP', name: 'Invesco DB USD Index', direction: 'volatile', magnitude: 'extreme', rationale: 'If US is affected — dollar crisis; if other DM — dollar strengthens' },
              { asset: 'GLD', name: 'SPDR Gold Shares', direction: 'up', magnitude: 'large', rationale: 'Gold benefits regardless of which currency crashes' },
            ],
            regionImpacts: [
              { region: 'Affected Country', direction: 'negative', severity: 'critical', rationale: 'Currency crash compounds bond crisis' },
            ],
          },
        ],
      },
      {
        id: 'forced-austerity',
        name: 'Forced Austerity and Political Instability',
        description: 'Markets and/or institutions demand fiscal consolidation. Austerity during weakness deepens the downturn.',
        mechanism: 'Spending cuts and tax increases are the price of continued financing. But austerity during economic weakness reduces tax revenue and can worsen the debt ratio — the "austerity paradox."',
        confidence: 'likely',
        timeframe: 'months',
        assetImpacts: [
          { asset: 'SPY', name: 'S&P 500 SPDR', direction: 'down', magnitude: 'moderate', rationale: 'Austerity kills growth' },
        ],
        regionImpacts: [
          { region: 'Affected Country', direction: 'negative', severity: 'high', rationale: 'Public service cuts while unemployment rises' },
          { region: 'EU', direction: 'negative', severity: 'moderate', rationale: 'Political contagion, exit risk resurfaces' },
        ],
        secondaryEffects: [
          {
            id: 'social-instability',
            name: 'Social and Political Instability',
            description: 'Austerity drives protests, government collapse, and rise of populist movements.',
            mechanism: 'Cutting healthcare, education, pensions while unemployment rises creates social crisis. Political extremism gains support.',
            confidence: 'probable',
            timeframe: 'months',
            assetImpacts: [
              { asset: 'VNQ', name: 'Vanguard Real Estate ETF', direction: 'down', magnitude: 'large', rationale: 'Capital flight from affected country real estate' },
            ],
            regionImpacts: [
              { region: 'Affected Country', direction: 'negative', severity: 'high', rationale: 'Political instability adds risk premium' },
            ],
          },
        ],
      },
    ],
    historicalPrecedents: [
      { event: 'UK Gilt Crisis (Liz Truss)', year: 2022, relevance: 'Unfunded tax cuts triggered 150bps gilt spike in 4 days', outcome: 'Pension fund LDI crisis, BOE emergency buying, PM resigned in 45 days' },
      { event: 'European Sovereign Debt Crisis', year: 2010, relevance: 'Greece, Ireland, Portugal, Spain, Italy yield spikes', outcome: 'Greek 10Y hit 35%, ECB "whatever it takes" was turning point, deep recessions from austerity' },
      { event: 'US Debt Ceiling / S&P Downgrade', year: 2011, relevance: 'S&P downgraded US from AAA to AA+', outcome: 'Paradoxically Treasuries RALLIED — no alternative at scale; unique US dynamic' },
      { event: 'Russia Sovereign Default', year: 1998, relevance: 'Defaulted on domestic ruble debt', outcome: 'Triggered LTCM collapse, showed sovereign defaults have unpredictable second-order effects' },
    ],
    watchlist: [
      { indicator: 'jgb_10y', name: 'Japan 10Y JGB Yields', threshold: 'Above 2% = BOJ losing yield curve control' },
      { indicator: 'btp_bund_spread', name: 'Italy-Germany 10Y Spread', threshold: 'Above 300bps = EU fragmentation risk' },
      { indicator: 'us_10y', name: 'US 10Y Treasury Yield', threshold: 'Above 5.5% without Fed tightening = bond vigilantes', mcpTool: 'interest_rates' },
      { indicator: 'auction_btc', name: 'Debt Auction Bid-to-Cover Ratios', threshold: 'Below 2.0x = weakening demand for sovereign paper' },
      { indicator: 'dm_cds', name: 'DM Sovereign CDS Spreads', threshold: 'Above 100bps = historically extreme for developed markets' },
      { indicator: 'yield_curve', name: 'Yield Curve Shape', threshold: 'Sovereign stress distorts term structure', mcpTool: 'yield_curve' },
    ],
  },
]

// ─── Lookup Helpers ───────────────────────────────────────────

export function getCatalystById(id: string): CatalystTree | undefined {
  return catalystTrees.find((c) => c.id === id)
}

export function getCatalystsByCategory(category: CatalystCategory): CatalystTree[] {
  return catalystTrees.filter((c) => c.category === category)
}

export function listCatalysts(): Array<{ id: string; name: string; category: string; severity: string }> {
  return catalystTrees.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    severity: c.severity,
  }))
}

export function searchCatalysts(query: string): CatalystTree[] {
  const q = query.toLowerCase()
  return catalystTrees.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.triggerConditions.some((t) => t.toLowerCase().includes(q))
  )
}
