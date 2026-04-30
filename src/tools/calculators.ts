import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

const READ_ONLY = { readOnlyHint: true, destructiveHint: false } as const

function monthlyMortgagePayment(principal: number, annualRatePct: number, termYears: number): number {
  if (principal <= 0 || termYears <= 0) return 0
  const monthlyRate = annualRatePct / 100 / 12
  const numPayments = termYears * 12
  if (monthlyRate === 0) return principal / numPayments
  const factor = Math.pow(1 + monthlyRate, numPayments)
  return principal * (monthlyRate * factor) / (factor - 1)
}

function round(n: number, decimals = 2): number {
  if (!Number.isFinite(n)) return n
  const m = Math.pow(10, decimals)
  return Math.round(n * m) / m
}

export function registerCalculatorTools(server: McpServer) {
  server.tool(
    'investment_property_analysis',
    'Analyze a rental investment property. Returns cap rate, cash-on-cash ROI, monthly cash flow, NOI, DSCR, 1% rule check, and full expense breakdown. Pure local calculation — no API call.',
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
    READ_ONLY,
    async (input) => {
      const downPayment = input.purchasePrice * (input.downPaymentPct / 100)
      const loanAmount = input.purchasePrice - downPayment
      const monthlyPI = monthlyMortgagePayment(loanAmount, input.interestRate, input.loanTermYears)

      const annualGross = input.monthlyRent * 12
      const vacancyLoss = annualGross * (input.vacancyRatePct / 100)
      const effectiveGross = annualGross - vacancyLoss

      const annualMaintenance = input.purchasePrice * (input.maintenancePct / 100)
      const annualMgmt = effectiveGross * (input.propertyMgmtPct / 100)
      const annualHoa = input.monthlyHoa * 12
      const operatingExpenses =
        input.annualPropertyTax + input.annualInsurance + annualHoa + annualMaintenance + annualMgmt

      const noi = effectiveGross - operatingExpenses
      const annualDebtService = monthlyPI * 12
      const annualCashFlow = noi - annualDebtService
      const monthlyCashFlow = annualCashFlow / 12

      const closingCosts = input.purchasePrice * (input.closingCostsPct / 100)
      const cashInvested = downPayment + closingCosts

      const capRate = (noi / input.purchasePrice) * 100
      const cashOnCash = cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0
      const dscr = annualDebtService > 0 ? noi / annualDebtService : Infinity
      const onePercentRatio = (input.monthlyRent / input.purchasePrice) * 100

      const result = {
        loan: {
          downPayment: round(downPayment),
          loanAmount: round(loanAmount),
          monthlyPI: round(monthlyPI),
          annualDebtService: round(annualDebtService),
        },
        income: {
          annualGross: round(annualGross),
          vacancyLoss: round(vacancyLoss),
          effectiveGross: round(effectiveGross),
        },
        expenses: {
          propertyTax: round(input.annualPropertyTax),
          insurance: round(input.annualInsurance),
          hoa: round(annualHoa),
          maintenance: round(annualMaintenance),
          management: round(annualMgmt),
          totalOperating: round(operatingExpenses),
        },
        cashFlow: {
          noi: round(noi),
          monthlyCashFlow: round(monthlyCashFlow),
          annualCashFlow: round(annualCashFlow),
        },
        returns: {
          capRate: round(capRate, 2),
          cashOnCash: round(cashOnCash, 2),
          dscr: Number.isFinite(dscr) ? round(dscr, 2) : null,
          cashInvested: round(cashInvested),
        },
        rules: {
          onePercentRatio: round(onePercentRatio, 3),
          onePercentRulePass: onePercentRatio >= 1.0,
        },
      }

      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.tool(
    'brrrr_analysis',
    'Analyze a BRRRR (Buy, Rehab, Rent, Refinance, Repeat) real estate deal. Returns all-in cost, ARV margin, refinance cash-out, monthly cash flow, BRRRR Score (0-100), 70% rule check, and full breakdown. Pure local calculation — no API call.',
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
    READ_ONLY,
    async (input) => {
      const closingCostsBuy = input.purchasePrice * (input.closingCostsBuyPct / 100)
      const allInCost = input.purchasePrice + closingCostsBuy + input.rehabCosts + input.holdingCosts

      const refiLoan = input.arv * (input.refiLtvPct / 100)
      const refiClosingCosts = refiLoan * (input.refiClosingCostsPct / 100)
      const initialPayoff = input.useInitialLoan ? input.initialLoanAmount : 0
      const cashOutNet = refiLoan - refiClosingCosts - initialPayoff
      const cashLeftInDeal = allInCost - cashOutNet
      const arvMargin = ((input.arv - allInCost) / input.arv) * 100

      const refiMonthlyPI = monthlyMortgagePayment(refiLoan, input.refiRate, input.refiTermYears)

      const annualGross = input.monthlyRent * 12
      const vacancyLoss = annualGross * (input.vacancyRatePct / 100)
      const effectiveGross = annualGross - vacancyLoss
      const annualMaintenance = input.arv * (input.maintenancePct / 100)
      const annualMgmt = effectiveGross * (input.propertyMgmtPct / 100)
      const annualHoa = input.monthlyHoa * 12
      const annualUtilities = input.monthlyUtilities * 12
      const annualOther = input.monthlyOtherExpenses * 12
      const operatingExpenses =
        input.annualPropertyTax +
        input.annualInsurance +
        annualHoa +
        annualMaintenance +
        annualMgmt +
        annualUtilities +
        annualOther

      const noi = effectiveGross - operatingExpenses
      const annualDebtService = refiMonthlyPI * 12
      const annualCashFlow = noi - annualDebtService
      const monthlyCashFlow = annualCashFlow / 12
      const dscr = annualDebtService > 0 ? noi / annualDebtService : Infinity
      const cashOnCash = cashLeftInDeal > 0 ? (annualCashFlow / cashLeftInDeal) * 100 : Infinity
      const capRate = (noi / input.arv) * 100

      const seventyPctMaxBudget = input.arv * 0.7
      const purchasePlusRehab = input.purchasePrice + input.rehabCosts
      const seventyPctRulePass = purchasePlusRehab <= seventyPctMaxBudget

      // BRRRR Score (0-100)
      const cashLeftPoints = cashLeftInDeal <= 0 ? 30 : cashLeftInDeal <= 5000 ? 25 : cashLeftInDeal <= 15000 ? 20 : cashLeftInDeal <= 30000 ? 10 : 0
      const cashOnCashScore = !Number.isFinite(cashOnCash) ? 25 : cashOnCash >= 15 ? 25 : cashOnCash >= 10 ? 20 : cashOnCash >= 5 ? 15 : cashOnCash > 0 ? 10 : 0
      const dscrScore = !Number.isFinite(dscr) ? 20 : dscr >= 1.5 ? 20 : dscr >= 1.25 ? 15 : dscr >= 1.0 ? 10 : dscr >= 0.9 ? 5 : 0
      const arvMarginScore = arvMargin >= 30 ? 15 : arvMargin >= 20 ? 12 : arvMargin >= 10 ? 8 : arvMargin > 0 ? 4 : 0
      const cfScore = monthlyCashFlow > 200 ? 10 : monthlyCashFlow > 0 ? 5 : 0
      const brrrrScore = cashLeftPoints + cashOnCashScore + dscrScore + arvMarginScore + cfScore

      const result = {
        deal: {
          allInCost: round(allInCost),
          closingCostsBuy: round(closingCostsBuy),
          rehabCosts: round(input.rehabCosts),
          holdingCosts: round(input.holdingCosts),
          arvMargin: round(arvMargin, 2),
        },
        refinance: {
          refiLoan: round(refiLoan),
          refiClosingCosts: round(refiClosingCosts),
          initialPayoff: round(initialPayoff),
          cashOutNet: round(cashOutNet),
          cashLeftInDeal: round(cashLeftInDeal),
          refiMonthlyPI: round(refiMonthlyPI),
        },
        rentalAnalysis: {
          effectiveGross: round(effectiveGross),
          operatingExpenses: round(operatingExpenses),
          noi: round(noi),
          monthlyCashFlow: round(monthlyCashFlow),
          annualCashFlow: round(annualCashFlow),
          capRate: round(capRate, 2),
          dscr: Number.isFinite(dscr) ? round(dscr, 2) : null,
          cashOnCash: Number.isFinite(cashOnCash) ? round(cashOnCash, 2) : null,
        },
        rules: {
          seventyPctMaxBudget: round(seventyPctMaxBudget),
          purchasePlusRehab: round(purchasePlusRehab),
          seventyPctRulePass,
        },
        brrrrScore: {
          total: brrrrScore,
          breakdown: {
            cashLeftInDeal: cashLeftPoints,
            cashOnCash: cashOnCashScore,
            dscr: dscrScore,
            arvMargin: arvMarginScore,
            monthlyCashFlow: cfScore,
          },
          interpretation:
            brrrrScore >= 80 ? 'Excellent BRRRR opportunity'
            : brrrrScore >= 60 ? 'Good deal, worth pursuing'
            : brrrrScore >= 40 ? 'Marginal — proceed with caution'
            : 'Poor BRRRR economics',
        },
      }

      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )
}
