import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiPost } from '../lib/api-client.js'

export function registerCalculatorTools(server: McpServer) {
  server.tool(
    'investment_property_analysis',
    'Analyze a rental investment property. Returns cap rate, cash-on-cash ROI, monthly cash flow, NOI, DSCR, 1% rule evaluation, and full expense breakdown.',
    {
      purchasePrice: z.number().describe('Purchase price in dollars'),
      monthlyRent: z.number().describe('Expected monthly rent in dollars'),
      downPaymentPct: z.number().default(20).describe('Down payment percentage (default 20)'),
      interestRate: z.number().default(7.0).describe('Annual interest rate (default 7.0)'),
      loanTermYears: z.number().default(30).describe('Loan term in years (default 30)'),
      vacancyRatePct: z.number().default(8).describe('Vacancy rate percentage (default 8)'),
      annualPropertyTax: z.number().default(0).describe('Annual property tax'),
      annualInsurance: z.number().default(0).describe('Annual insurance'),
      monthlyHoa: z.number().default(0).describe('Monthly HOA fees'),
      maintenancePct: z.number().default(1).describe('Maintenance as % of value per year'),
      propertyMgmtPct: z.number().default(0).describe('Property management as % of rent'),
      closingCostsPct: z.number().default(3).describe('Closing costs percentage'),
    },
    async (input) => {
      const data = await apiPost('/v1/calculators/investment-property', input)
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'brrrr_analysis',
    'Analyze a BRRRR (Buy, Rehab, Rent, Refinance, Repeat) real estate deal. Returns all-in cost, ARV margin, refinance cash-out, monthly cash flow, BRRRR Score (0-100), 70% rule check, and full breakdown.',
    {
      purchasePrice: z.number().describe('Purchase price in dollars'),
      arv: z.number().describe('After Repair Value in dollars'),
      monthlyRent: z.number().describe('Expected monthly rent in dollars'),
      rehabCosts: z.number().default(0).describe('Total rehab costs'),
      closingCostsBuyPct: z.number().default(3).describe('Closing costs percentage on purchase'),
      holdingCosts: z.number().default(0).describe('Total holding costs during rehab'),
      vacancyRatePct: z.number().default(8).describe('Vacancy rate percentage'),
      annualPropertyTax: z.number().default(0).describe('Annual property tax'),
      annualInsurance: z.number().default(0).describe('Annual insurance'),
      propertyMgmtPct: z.number().default(0).describe('Property management as % of rent'),
      maintenancePct: z.number().default(1).describe('Maintenance as % of ARV per year'),
      monthlyHoa: z.number().default(0).describe('Monthly HOA'),
      monthlyUtilities: z.number().default(0).describe('Monthly utilities'),
      monthlyOtherExpenses: z.number().default(0).describe('Other monthly expenses'),
      refiLtvPct: z.number().default(75).describe('Refinance LTV percentage'),
      refiRate: z.number().default(7.0).describe('Refinance interest rate'),
      refiTermYears: z.number().default(30).describe('Refinance loan term'),
      refiClosingCostsPct: z.number().default(2).describe('Refinance closing costs percentage'),
      useInitialLoan: z.boolean().default(false).describe('Whether initial purchase used a loan'),
      initialLoanAmount: z.number().default(0).describe('Initial loan amount if used'),
    },
    async (input) => {
      const data = await apiPost('/v1/calculators/brrrr', input)
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    },
  )
}
