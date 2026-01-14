'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import { 
  FaFileInvoiceDollar,
  FaCalculator,
  FaDownload,
  FaInfoCircle,
  FaExclamationTriangle,
  FaChartBar,
  FaReceipt
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Indian Income Tax Slabs (Old Regime - FY 2024-25 / AY 2025-26)
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
]

// Indian Income Tax Slabs (New Regime - FY 2024-25 / AY 2025-26)
const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 5 },
  { min: 700000, max: 1000000, rate: 10 },
  { min: 1000000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
]

// Standard Deduction (Old Regime)
const STANDARD_DEDUCTION_OLD = 50000

// Rebate under Section 87A (Old Regime)
const REBATE_87A_OLD = {
  maxIncome: 500000,
  rebateAmount: 12500,
  maxRebate: 12500
}

// Rebate under Section 87A (New Regime)
const REBATE_87A_NEW = {
  maxIncome: 700000,
  rebateAmount: 25000,
  maxRebate: 25000
}

// Health and Education Cess
const CESS_RATE = 4 // 4% on tax

// Section 44AD - Presumptive Taxation (for businesses with turnover < 2 crores)
const PRESUMPTIVE_TAX_RATE = 8 // 8% of turnover as presumptive income (6% if digital receipts)

interface TaxData {
  bills: any[]
  expenses: any[]
}

export default function TaxPage() {
  const [data, setData] = useState<TaxData>({
    bills: [],
    expenses: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [taxRegime, setTaxRegime] = useState<'old' | 'new'>('old')
  const [usePresumptive, setUsePresumptive] = useState(false)
  const [presumptiveDigitalReceipts, setPresumptiveDigitalReceipts] = useState(false)
  const [otherIncome, setOtherIncome] = useState('')
  const [deductions, setDeductions] = useState({
    section80C: '', // PPF, ELSS, Life Insurance, etc. (max 1.5L)
    section80D: '', // Health Insurance (max 25k/50k)
    section24: '', // Home Loan Interest (max 2L)
    section80G: '', // Donations
    section80TTA: '', // Interest on Savings Account (max 10k)
    otherDeductions: '', // Other deductions
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [billsRes, expensesRes] = await Promise.all([
        fetch('/api/bills'),
        fetch('/api/expenses'),
      ])

      const [bills, expenses] = await Promise.all([
        billsRes.ok ? billsRes.json() : [],
        expensesRes.ok ? expensesRes.json() : [],
      ])

      setData({ bills, expenses })
    } catch (error) {
      console.error('Failed to load tax data:', error)
      toast.error('Failed to load tax data')
    } finally {
      setLoading(false)
    }
  }

  // Filter data by financial year (April to March)
  const financialYearData = useMemo(() => {
    const year = parseInt(selectedYear)
    const financialYearStart = new Date(year, 3, 1) // April 1
    const financialYearEnd = new Date(year + 1, 2, 31, 23, 59, 59) // March 31

    const filteredBills = data.bills.filter((bill: any) => {
      const billDate = new Date(bill.createdAt)
      return billDate >= financialYearStart && billDate <= financialYearEnd
    })

    const filteredExpenses = data.expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.paymentDate)
      return expenseDate >= financialYearStart && expenseDate <= financialYearEnd
    })

    return { bills: filteredBills, expenses: filteredExpenses }
  }, [data, selectedYear])

  // Calculate Business Income
  const businessIncome = useMemo(() => {
    if (usePresumptive) {
      const turnover = financialYearData.bills.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0)
      const presumptiveRate = presumptiveDigitalReceipts ? 6 : 8
      return turnover * (presumptiveRate / 100)
    } else {
      // Normal computation: Revenue - Expenses
      const revenue = financialYearData.bills.reduce((sum: number, b: any) => sum + (b.paidAmount || 0), 0)
      const expenses = financialYearData.expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
      return Math.max(0, revenue - expenses)
    }
  }, [financialYearData, usePresumptive, presumptiveDigitalReceipts])

  // Calculate Total Income
  const totalIncome = useMemo(() => {
    const otherIncomeAmount = parseFloat(otherIncome) || 0
    return businessIncome + otherIncomeAmount
  }, [businessIncome, otherIncome])

  // Calculate Total Deductions
  const totalDeductions = useMemo(() => {
    const section80C = Math.min(parseFloat(deductions.section80C) || 0, 150000) // Max 1.5L
    const section80D = Math.min(parseFloat(deductions.section80D) || 0, 50000) // Max 50k (25k for self, 25k for parents)
    const section24 = Math.min(parseFloat(deductions.section24) || 0, 200000) // Max 2L
    const section80G = parseFloat(deductions.section80G) || 0
    const section80TTA = Math.min(parseFloat(deductions.section80TTA) || 0, 10000) // Max 10k
    const otherDeductions = parseFloat(deductions.otherDeductions) || 0

    if (taxRegime === 'new') {
      // New regime has limited deductions
      return section80C + section80D + section24 + section80G + section80TTA + otherDeductions
    } else {
      // Old regime - standard deduction applied separately
      return section80C + section80D + section24 + section80G + section80TTA + otherDeductions
    }
  }, [deductions, taxRegime])

  // Calculate Taxable Income
  const taxableIncome = useMemo(() => {
    if (taxRegime === 'old') {
      return Math.max(0, totalIncome - totalDeductions - STANDARD_DEDUCTION_OLD)
    } else {
      return Math.max(0, totalIncome - totalDeductions)
    }
  }, [totalIncome, totalDeductions, taxRegime])

  // Calculate Tax
  const taxCalculation = useMemo(() => {
    const slabs = taxRegime === 'old' ? OLD_REGIME_SLABS : NEW_REGIME_SLABS
    let tax = 0
    let remainingIncome = taxableIncome

    for (const slab of slabs) {
      if (remainingIncome <= 0) break
      const slabIncome = Math.min(remainingIncome, slab.max - slab.min)
      tax += (slabIncome * slab.rate) / 100
      remainingIncome -= slabIncome
    }

    // Apply rebate under Section 87A
    const rebate = taxRegime === 'old' ? REBATE_87A_OLD : REBATE_87A_NEW
    let rebateAmount = 0
    if (taxableIncome <= rebate.maxIncome) {
      rebateAmount = Math.min(tax, rebate.maxRebate)
    }
    tax = Math.max(0, tax - rebateAmount)

    // Add Health and Education Cess (4%)
    const cess = (tax * CESS_RATE) / 100
    const totalTax = tax + cess

    return {
      taxBeforeRebate: tax + rebateAmount,
      rebateAmount,
      taxAfterRebate: tax,
      cess,
      totalTax,
      effectiveRate: taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0
    }
  }, [taxableIncome, taxRegime])

  // Calculate Turnover for Presumptive Taxation
  const turnover = useMemo(() => {
    return financialYearData.bills.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0)
  }, [financialYearData])

  const canUsePresumptive = turnover < 20000000 // 2 crores

  const handleGeneratePDF = async () => {
    try {
      const element = document.getElementById('tax-report')
      if (!element) {
        toast.error('Report content not found')
        return
      }

      const canvas = await html2canvas(element, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`Income-Tax-Return-${selectedYear}-${selectedYear + 1}.pdf`)
      toast.success('Tax report generated successfully!')
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <FaFileInvoiceDollar className="text-primary-500" />
            Income Tax Return (ITR)
          </h1>
          <p className="text-gray-600">Calculate and prepare your income tax return as per Indian Income Tax Act</p>
        </div>
        <button
          onClick={handleGeneratePDF}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          <FaDownload /> Generate PDF
        </button>
      </div>

      {/* Financial Year Selection */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Financial Year (April - March)
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - i
            return (
              <option key={year} value={year}>
                FY {year}-{year + 1} (AY {year + 1}-{year + 2})
              </option>
            )
          })}
        </select>
      </div>

      {/* Tax Regime Selection */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tax Regime
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="regime"
              value="old"
              checked={taxRegime === 'old'}
              onChange={(e) => setTaxRegime('old')}
              className="w-4 h-4 text-primary-500"
            />
            <span className="font-medium">Old Regime</span>
            <span className="text-xs text-gray-500">(With all deductions)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="regime"
              value="new"
              checked={taxRegime === 'new'}
              onChange={(e) => setTaxRegime('new')}
              className="w-4 h-4 text-primary-500"
            />
            <span className="font-medium">New Regime</span>
            <span className="text-xs text-gray-500">(Lower rates, limited deductions)</span>
          </label>
        </div>
      </div>

      {/* Presumptive Taxation Option */}
      {canUsePresumptive && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-blue-500 text-xl mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-900">Presumptive Taxation (Section 44AD)</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePresumptive}
                    onChange={(e) => setUsePresumptive(e.target.checked)}
                    className="w-4 h-4 text-primary-500"
                  />
                  <span className="text-sm font-medium">Use Presumptive Taxation</span>
                </label>
              </div>
              <p className="text-sm text-blue-800 mb-2">
                Turnover: {formatCurrency(turnover)} (Less than ₹2 Crores - Eligible)
              </p>
              <p className="text-xs text-blue-700">
                Under Section 44AD, you can declare {presumptiveDigitalReceipts ? '6%' : '8%'} of turnover as presumptive income.
                No need to maintain books of accounts or get them audited.
              </p>
              {usePresumptive && (
                <div className="mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={presumptiveDigitalReceipts}
                      onChange={(e) => setPresumptiveDigitalReceipts(e.target.checked)}
                      className="w-4 h-4 text-primary-500"
                    />
                    <span className="text-sm">Digital receipts/transactions (6% rate)</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Income Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Business Income */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaChartBar className="text-primary-500" />
            Business Income
          </h2>
          {usePresumptive ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700 font-medium">Total Turnover</span>
                <span className="font-bold text-gray-800">{formatCurrency(turnover)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700 font-medium">Presumptive Rate</span>
                <span className="font-bold text-gray-800">{presumptiveDigitalReceipts ? '6%' : '8%'}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                <span className="text-gray-800 font-bold">Presumptive Income</span>
                <span className="text-xl font-bold text-primary-600">{formatCurrency(businessIncome)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * No need to show expenses under presumptive taxation
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700 font-medium">Total Revenue (Paid)</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(financialYearData.bills.reduce((sum: number, b: any) => sum + (b.paidAmount || 0), 0))}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-gray-700 font-medium">Total Business Expenses</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(financialYearData.expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0))}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                <span className="text-gray-800 font-bold">Net Business Income</span>
                <span className="text-xl font-bold text-primary-600">{formatCurrency(businessIncome)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Other Income & Deductions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaCalculator className="text-primary-500" />
            Other Income & Deductions
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other Income (Interest, Dividends, etc.)
              </label>
              <input
                type="number"
                step="0.01"
                value={otherIncome}
                onChange={(e) => setOtherIncome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>

            {taxRegime === 'old' && (
              <div className="pt-3 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Deductions (Old Regime)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Section 80C (PPF, ELSS, Life Insurance) - Max ₹1,50,000
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={deductions.section80C}
                      onChange={(e) => setDeductions({ ...deductions, section80C: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Section 80D (Health Insurance) - Max ₹50,000
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={deductions.section80D}
                      onChange={(e) => setDeductions({ ...deductions, section80D: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Section 24 (Home Loan Interest) - Max ₹2,00,000
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={deductions.section24}
                      onChange={(e) => setDeductions({ ...deductions, section24: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Section 80G (Donations)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={deductions.section80G}
                      onChange={(e) => setDeductions({ ...deductions, section80G: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Section 80TTA (Savings Interest) - Max ₹10,000
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={deductions.section80TTA}
                      onChange={(e) => setDeductions({ ...deductions, section80TTA: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Other Deductions</label>
                    <input
                      type="number"
                      step="0.01"
                      value={deductions.otherDeductions}
                      onChange={(e) => setDeductions({ ...deductions, otherDeductions: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            )}

            {taxRegime === 'new' && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  New regime has limited deductions. Most deductions are not available, but tax rates are lower.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tax Calculation Summary */}
      <div id="tax-report" className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FaReceipt className="text-primary-500" />
          Income Tax Calculation Summary
        </h2>

        <div className="space-y-4">
          {/* Total Income */}
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-lg font-semibold text-gray-700">Total Income</span>
            <span className="text-xl font-bold text-gray-800">{formatCurrency(totalIncome)}</span>
          </div>

          {/* Deductions */}
          {taxRegime === 'old' && (
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700 font-medium">Standard Deduction</span>
              <span className="font-bold text-blue-600">{formatCurrency(STANDARD_DEDUCTION_OLD)}</span>
            </div>
          )}
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <span className="text-gray-700 font-medium">Total Deductions (Section 80C, 80D, etc.)</span>
            <span className="font-bold text-blue-600">{formatCurrency(totalDeductions)}</span>
          </div>

          {/* Taxable Income */}
          <div className="flex justify-between items-center p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
            <span className="text-lg font-bold text-gray-800">Taxable Income</span>
            <span className="text-2xl font-bold text-primary-600">{formatCurrency(taxableIncome)}</span>
          </div>

          {/* Tax Calculation */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Income Tax (before rebate)</span>
              <span className="font-bold text-gray-800">{formatCurrency(taxCalculation.taxBeforeRebate)}</span>
            </div>
            {taxCalculation.rebateAmount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>Less: Rebate under Section 87A</span>
                <span className="font-bold">-{formatCurrency(taxCalculation.rebateAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Income Tax (after rebate)</span>
              <span className="font-bold text-gray-800">{formatCurrency(taxCalculation.taxAfterRebate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Add: Health & Education Cess (4%)</span>
              <span className="font-bold text-gray-800">{formatCurrency(taxCalculation.cess)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <span className="text-lg font-bold text-gray-800">Total Tax Liability</span>
              <span className="text-2xl font-bold text-red-600">{formatCurrency(taxCalculation.totalTax)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Effective Tax Rate</span>
              <span className="font-semibold text-gray-700">{taxCalculation.effectiveRate.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <FaExclamationTriangle className="text-yellow-600" />
            Important Notes
          </h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>This is an estimated calculation based on Indian Income Tax rules for FY {selectedYear}-{parseInt(selectedYear) + 1}</li>
            <li>Consult with a qualified CA or tax advisor before filing your returns</li>
            <li>This calculation does not include TDS credits, advance tax, or self-assessment tax</li>
            <li>Actual tax liability may vary based on specific circumstances and applicable exemptions</li>
            {usePresumptive && (
              <li>Under Section 44AD, you are not required to maintain books of accounts or get them audited</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
