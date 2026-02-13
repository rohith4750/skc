import { formatCurrency, formatDate, formatDateTime } from './utils'

export interface PDFTemplateData {
  type: 'bill' | 'expense' | 'workforce'
  billNumber?: string
  date: string
  customer?: {
    name?: string
    phone?: string
    email?: string
    address?: string
  }
  eventDetails?: {
    eventName?: string
    functionDate?: string
    functionTime?: string
    functionVenue?: string
  }
  mealDetails?: {
    tiffins?: { persons?: number; rate?: number }
    lunchDinner?: { type?: string; persons?: number; rate?: number }
    snacks?: { persons?: number; rate?: number }
  }
  mealTypeAmounts?: Record<string, { amount: number; date: string; services?: string[]; numberOfMembers?: number } | number>
  stalls?: Array<{ category: string; description: string; cost: number | string }>
  discount?: number
  services?: string[]
  numberOfMembers?: number
  financial?: {
    sariAmount?: number
    transport?: number
    waterBottlesCost?: number
    extra?: number
    totalAmount: number
    advancePaid?: number
    balanceAmount?: number
    paidAmount?: number
    remainingAmount?: number
    discount?: number
  }
  status?: 'pending' | 'partial' | 'paid'
  expenseDetails?: {
    category?: string
    recipient?: string
    description?: string
    amount: number
    paidAmount?: number
    paymentStatus?: 'pending' | 'partial' | 'paid'
    paymentDate?: string
    eventDate?: string
    notes?: string
    calculationDetails?: any
  }
  workforceDetails?: {
    name?: string
    role?: string
    totalAmount?: number
    totalPaid?: number
    expenses?: Array<{
      date: string
      amount: number
      description?: string
      status?: string
    }>
  }
  orderId?: string
  supervisor?: string
}

export function generatePDFTemplate(data: PDFTemplateData): string {
  const companyName = 'SRIVATSASA & KOUNDINYA CATERERS'
  const subtitle = '(Pure Vegetarian)'
  const regdNo = 'Regd. No. 236190310003331'
  const address = 'Plot No. 115, Padmavathi Nagar, Bank Colony, Saheb Nagar. Varsthalipuram, Hyderabad - 500070.'
  const contact = 'Email: pujyasri1989cya@gmail.com, Cell: 9866525102, 9963691393, 9390015302'
  const topLeft = 'Telidevara Rajendraprasad'
  const topRight = 'ART FOOD ZONE'

  const statusColors = {
    paid: { bg: '#10b981', text: '#ffffff', label: 'PAID' },
    partial: { bg: '#f59e0b', text: '#ffffff', label: 'PARTIAL' },
    pending: { bg: '#ef4444', text: '#ffffff', label: 'PENDING' },
  }
  const statusColor = data.status ? statusColors[data.status] : statusColors.pending

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          margin: 0;
          size: A4;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          background: #fff;
          padding: 10mm 8mm;
        }
        .container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          border-left: 2px solid #000;
          border-right: 2px solid #000;
          padding: 0 15mm;
          min-height: 277mm;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .header-main {
          font-size: 28px;
          font-weight: bold;
          margin: 10px 0 5px 0;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .header-subtitle {
          font-size: 14px;
          margin-bottom: 8px;
          font-style: italic;
        }
        .header-details {
          font-size: 9px;
          line-height: 1.6;
          margin-top: 8px;
        }
        .header-details div {
          margin-bottom: 3px;
        }
        .divider {
          margin: 15px 0;
        }
        .section-title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          margin: 15px 0 10px 0;
          text-transform: uppercase;
        }
        .form-section {
          margin-bottom: 15px;
        }
        .form-row {
          display: flex;
          margin-bottom: 8px;
          align-items: baseline;
        }
        .form-label {
          font-weight: 500;
          min-width: 140px;
          margin-right: 10px;
        }
        .form-value {
          flex: 1;
          padding-bottom: 2px;
          min-height: 16px;
        }
        .form-value-inline {
          display: inline-block;
          padding-bottom: 2px;
          min-width: 100px;
          margin-left: 5px;
        }
        .financial-section {
          margin-top: 20px;
        }
        .financial-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 5px;
        }
        .financial-label {
          font-weight: 500;
        }
        .financial-value {
          font-weight: bold;
          min-width: 120px;
          text-align: right;
          padding-bottom: 2px;
        }
        .terms-section {
          margin-top: 20px;
        }
        .terms-title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          margin: 15px 0 10px 0;
          text-transform: uppercase;
        }
        .terms-list {
          font-size: 10px;
          line-height: 1.8;
          margin-left: 15px;
        }
        .terms-list li {
          margin-bottom: 5px;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 20px;
        }
        .signature-box {
          width: 45%;
        }
        .signature-line {
          border-top: 1px dotted #000;
          margin-top: 50px;
          padding-top: 5px;
          font-size: 11px;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          padding: 5px 12px;
          border-radius: 15px;
          font-weight: bold;
          font-size: 11px;
          margin-left: 10px;
        }
        .bill-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .bill-number {
          font-size: 14px;
          font-weight: bold;
        }
        .expense-details {
          background: #fff;
          padding: 10px;
          border: 1px solid #000;
          margin: 10px 0;
        }
        .workforce-summary {
          background: #fff;
          padding: 10px;
          border: 1px solid #000;
          margin: 10px 0;
        }
        .expense-item {
          padding: 5px 0;
          border-bottom: 1px solid #ddd;
        }
        .expense-item:last-child {
          border-bottom: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="header-top">
            <div>${topLeft}</div>
            <div>${topRight}</div>
          </div>
          <div class="header-main">${companyName}</div>
          <div class="header-subtitle">${subtitle}</div>
          <div class="header-details">
            <div>${regdNo}</div>
            <div>${address}</div>
            <div>${contact}</div>
          </div>
        </div>

        <div class="divider"></div>

        ${data.type === 'bill' ? generateBillContent(data) : ''}
        ${data.type === 'expense' ? generateExpenseContent(data) : ''}
        ${data.type === 'workforce' ? generateWorkforceContent(data) : ''}

        <!-- Terms & Conditions -->
        ${generateTermsAndConditions(data.type)}

        <!-- Signatures -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">Authorized Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Customer Signature</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  return htmlContent
}

function generateBillContent(data: PDFTemplateData): string {
  const customer = data.customer || {}
  const eventDetails = data.eventDetails || {}
  const mealDetails = data.mealDetails || {}
  const financial = data.financial || { totalAmount: 0 }
  const mealTypeAmounts = data.mealTypeAmounts || {}
  const stalls = data.stalls || []

  // Process all meal types dynamically from mealTypeAmounts
  const mealTypeRows: string[] = []
  if (Object.keys(mealTypeAmounts).length > 0) {
    Object.entries(mealTypeAmounts).forEach(([mealType, mealData]) => {
      const dataObj = typeof mealData === 'object' && mealData !== null ? mealData : { amount: typeof mealData === 'number' ? mealData : 0 }
      const persons = (typeof dataObj === 'object' && 'numberOfMembers' in dataObj) ? (dataObj.numberOfMembers || 0) : 0
      const amount = (typeof dataObj === 'object' && 'amount' in dataObj) ? dataObj.amount : (typeof mealData === 'number' ? mealData : 0)

      const pricingMethod = (dataObj as any).pricingMethod || 'manual'
      const platePrice = (dataObj as any).platePrice || 0
      const manualAmount = (dataObj as any).manualAmount || 0

      let displayAmount = amount
      if (pricingMethod === 'manual' && manualAmount > 0) {
        displayAmount = manualAmount
      }

      let rateDisplay = ''

      if (pricingMethod === 'plate-based' && platePrice > 0) {
        rateDisplay = formatCurrency(platePrice)
        if (!displayAmount || displayAmount === 0) {
          displayAmount = persons * platePrice
        }
      }

      // Format meal type name (capitalize first letter)
      const mealTypeName = mealType.charAt(0).toUpperCase() + mealType.slice(1).toLowerCase()

      mealTypeRows.push(`
        <div class="form-row">
          <span class="form-label">${mealTypeName} No of Persons:</span>
          <span class="form-value-inline" style="width: 50px;">${persons || ''}</span>
          <span style="margin-left: 10px;">Rate:</span>
          <span class="form-value-inline" style="width: 80px;">${rateDisplay}</span>
          <span style="margin-left: 10px;">Total:</span>
          <span class="form-value-inline" style="width: 100px;">${displayAmount > 0 ? formatCurrency(displayAmount) : ''}</span>
        </div>
      `)
    })
  } else {
    // Fallback to mealDetails if mealTypeAmounts is not provided
    if (mealDetails.tiffins?.persons) {
      mealTypeRows.push(`
        <div class="form-row">
          <span class="form-label">Tiffins number of Persons:</span>
          <span class="form-value-inline">${mealDetails.tiffins.persons}</span>
          <span style="margin-left: 10px;">Rate per Head:</span>
          <span class="form-value-inline">${mealDetails.tiffins.rate ? formatCurrency(mealDetails.tiffins.rate) : ''}</span>
        </div>
      `)
    }
    if (mealDetails.lunchDinner?.persons) {
      mealTypeRows.push(`
        <div class="form-row">
          <span class="form-label">Lunch / Dinner:</span>
          <span class="form-value-inline">${mealDetails.lunchDinner.type || ''}</span>
          <span style="margin-left: 10px;">Number of Persons:</span>
          <span class="form-value-inline">${mealDetails.lunchDinner.persons}</span>
          <span style="margin-left: 10px;">Rate per Head:</span>
          <span class="form-value-inline">${mealDetails.lunchDinner.rate ? formatCurrency(mealDetails.lunchDinner.rate) : ''}</span>
        </div>
      `)
    }
    if (mealDetails.snacks?.persons) {
      mealTypeRows.push(`
        <div class="form-row">
          <span class="form-label">Snacks Number of Persons:</span>
          <span class="form-value-inline">${mealDetails.snacks.persons}</span>
          <span style="margin-left: 10px;">Rate per Head:</span>
          <span class="form-value-inline">${mealDetails.snacks.rate ? formatCurrency(mealDetails.snacks.rate) : ''}</span>
        </div>
      `)
    }
  }

  // Process stalls for extra charges
  const stallsRows: string[] = []
  if (stalls.length > 0) {
    stalls.forEach((stall) => {
      const cost = typeof stall.cost === 'string' ? parseFloat(stall.cost) : (stall.cost || 0)
      if (cost > 0) {
        stallsRows.push(`
          <div class="form-row">
            <span class="form-label">${stall.category || 'Stall'}:</span>
            <span class="form-value">${stall.description || ''} - ${formatCurrency(cost)}</span>
          </div>
        `)
      }
    })
  }

  return `
    <!-- Bill Info -->
    <div class="bill-info">
      <div>
        <div class="bill-number">Bill No: SKC-${data.billNumber || 'N/A'}</div>
        <div style="font-size: 10px; margin-top: 3px;">Date: ${formatDate(data.date)}</div>
      </div>
    </div>

    <!-- Customer Details -->
    <div class="form-section">
      <div class="section-title">CUSTOMER DETAILS</div>
      <div class="form-row">
        <span class="form-label">Bill No:</span>
        <span class="form-value">SKC-${data.billNumber || ''}</span>
      </div>
      <div class="form-row">
        <span class="form-label">Name:</span>
        <span class="form-value">${customer.name || ''}</span>
      </div>
      <div class="form-row">
        <span class="form-label">Address:</span>
        <span class="form-value">${customer.address || ''}</span>
      </div>
      <div class="form-row">
        <span class="form-label">Contact No:</span>
        <span class="form-value">${customer.phone || ''}</span>
      </div>
      <div class="form-row">
        <span class="form-label">Function Date:</span>
        <span class="form-value">${eventDetails.functionDate || ''}</span>
      </div>
    </div>



    <!-- Bill Summary -->
    <div class="form-section" style="border: 2px solid #000; padding: 12px; margin: 15px 0;">
      <div style="font-weight: bold; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; text-align: center;">BILL SUMMARY</div>
      ${mealTypeRows.length > 0 ? mealTypeRows.join('') : ''}
      
      <!-- Financial Details inside Bill Summary -->
      <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
        ${financial.waterBottlesCost ? `
        <div class="financial-row">
          <span class="financial-label">Water Bottles:</span>
          <span class="financial-value">${formatCurrency(financial.waterBottlesCost)}</span>
        </div>
        ` : ''}
        ${financial.transport ? `
        <div class="financial-row">
          <span class="financial-label">Transport:</span>
          <span class="financial-value">${formatCurrency(financial.transport)}</span>
        </div>
        ` : ''}
        <div class="financial-row" style="border-top: 2px solid #000; padding-top: 8px; margin-top: 8px;">
          <span class="financial-label" style="font-weight: bold;">Grand Total:</span>
          <span class="financial-value" style="font-weight: bold;">${formatCurrency(financial.totalAmount)}</span>
        </div>
        <div class="financial-row">
          <span class="financial-label">Advance Paid:</span>
          <span class="financial-value">${financial.advancePaid ? formatCurrency(financial.advancePaid) : formatCurrency(0)}</span>
        </div>
        <div class="financial-row">
          <span class="financial-label">Balance Amount:</span>
          <span class="financial-value">${formatCurrency(financial.balanceAmount || financial.remainingAmount || 0)}</span>
        </div>
      </div>
    </div>
  `
}

function generateExpenseContent(data: PDFTemplateData): string {
  const expense = data.expenseDetails || { amount: 0 }
  const customer = data.customer || {}
  const paymentStatus = expense.paymentStatus || 'pending'

  return `
    <!-- Expense Info -->
    <div class="bill-info">
      <div>
        <div class="bill-number">Expense Receipt No: ${data.billNumber || 'N/A'}</div>
        <div style="font-size: 10px; margin-top: 3px;">Date: ${formatDate(data.date)}</div>
      </div>
      <div class="status-badge" style="background-color: #fff; color: #000; border: 1px solid #000;">
        ${paymentStatus.toUpperCase()}
      </div>
    </div>

    <!-- Expense Details -->
    <div class="expense-details">
      <div class="form-section">
        <div class="section-title">EXPENSE DETAILS</div>
        <div class="form-row">
          <span class="form-label">Category:</span>
          <span class="form-value">${expense.category || ''}</span>
        </div>
        <div class="form-row">
          <span class="form-label">Recipient:</span>
          <span class="form-value">${expense.recipient || ''}</span>
        </div>
        <div class="form-row">
          <span class="form-label">Description:</span>
          <span class="form-value">${expense.description || ''}</span>
        </div>
        ${expense.eventDate ? `
        <div class="form-row">
          <span class="form-label">Event Date:</span>
          <span class="form-value">${formatDate(expense.eventDate)}</span>
        </div>
        ` : ''}
        <div class="form-row">
          <span class="form-label">Payment Date:</span>
          <span class="form-value">${expense.paymentDate ? formatDate(expense.paymentDate) : formatDate(data.date)}</span>
        </div>
        ${expense.notes ? `
        <div class="form-row">
          <span class="form-label">Notes:</span>
          <span class="form-value">${expense.notes}</span>
        </div>
        ` : ''}
        ${expense.calculationDetails ? `
        <div class="form-row">
          <span class="form-label">Calculation Method:</span>
          <span class="form-value">${expense.calculationDetails.method || 'N/A'}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Financial Summary -->
    <div class="financial-section">
      <div class="financial-row">
        <span class="financial-label">Total Amount:</span>
        <span class="financial-value">${formatCurrency(expense.amount)}</span>
      </div>
      ${expense.paidAmount !== undefined ? `
      <div class="financial-row">
        <span class="financial-label">Paid Amount:</span>
        <span class="financial-value">${formatCurrency(expense.paidAmount)}</span>
      </div>
      <div class="financial-row">
        <span class="financial-label">Balance:</span>
        <span class="financial-value">${formatCurrency(expense.amount - (expense.paidAmount || 0))}</span>
      </div>
      ` : ''}
    </div>
  `
}

function generateWorkforceContent(data: PDFTemplateData): string {
  const workforce = data.workforceDetails || {}
  const expenses = workforce.expenses || []

  return `
    <!-- Workforce Info -->
    <div class="bill-info">
      <div>
        <div class="bill-number">Workforce Receipt No: ${data.billNumber || 'N/A'}</div>
        <div style="font-size: 10px; margin-top: 3px;">Date: ${formatDate(data.date)}</div>
      </div>
    </div>

    <!-- Workforce Details -->
    <div class="workforce-summary">
      <div class="form-section">
        <div class="section-title">WORKFORCE DETAILS</div>
        <div class="form-row">
          <span class="form-label">Name:</span>
          <span class="form-value">${workforce.name || ''}</span>
        </div>
        <div class="form-row">
          <span class="form-label">Role:</span>
          <span class="form-value">${workforce.role || ''}</span>
        </div>
      </div>
    </div>

    ${expenses.length > 0 ? `
    <!-- Expense Items -->
    <div class="form-section">
      <div class="section-title">EXPENSE ITEMS</div>
      ${expenses.map((exp, idx) => `
        <div class="expense-item">
          <div class="form-row">
            <span class="form-label">Date:</span>
            <span class="form-value">${formatDate(exp.date)}</span>
            <span style="margin-left: 20px;" class="form-label">Amount:</span>
            <span class="form-value">${formatCurrency(exp.amount)}</span>
          </div>
          ${exp.description ? `
          <div class="form-row">
            <span class="form-label">Description:</span>
            <span class="form-value">${exp.description}</span>
          </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Financial Summary -->
    <div class="financial-section">
      <div class="financial-row">
        <span class="financial-label">Total Amount:</span>
        <span class="financial-value">${formatCurrency(workforce.totalAmount || 0)}</span>
      </div>
      <div class="financial-row">
        <span class="financial-label">Total Paid:</span>
        <span class="financial-value">${formatCurrency(workforce.totalPaid || 0)}</span>
      </div>
      <div class="financial-row">
        <span class="financial-label">Balance:</span>
        <span class="financial-value">${formatCurrency((workforce.totalAmount || 0) - (workforce.totalPaid || 0))}</span>
      </div>
    </div>
  `
}

function generateTermsAndConditions(type: 'bill' | 'expense' | 'workforce'): string {
  if (type === 'bill') {
    return `
      <div class="terms-section">
        <div class="terms-title">TERMS & CONDITIONS</div>
        <ol class="terms-list">
          <li>70% Advance Amount should be paid at the time of booking.</li>
          <li>The Remaining 30% will be paid after the function based on the party menu.</li>
          <li>Advance amount will not be refunded. (4) Childrens will be charged as same as adults.</li>
          <li>Preparation of Seasonal/Revelantables veg food is sololy handled by Srivatsaa & Kowndinya Caterers only.</li>
        </ol>
      </div>
    `
  } else if (type === 'expense') {
    return `
      <div class="terms-section">
        <div class="terms-title">TERMS & CONDITIONS</div>
        <ol class="terms-list">
          <li>This receipt acknowledges the payment made for the expense mentioned above.</li>
          <li>All payments are subject to verification and approval.</li>
          <li>In case of any discrepancy, please contact the accounts department within 7 days.</li>
          <li>This is a computer-generated receipt and does not require a physical signature.</li>
          <li>Please retain this receipt for your records and future reference.</li>
        </ol>
      </div>
    `
  } else if (type === 'workforce') {
    return `
      <div class="terms-section">
        <div class="terms-title">TERMS & CONDITIONS</div>
        <ol class="terms-list">
          <li>This receipt acknowledges all payments made to the workforce member mentioned above.</li>
          <li>All payments are subject to verification and approval by the management.</li>
          <li>Payment status reflects the current balance and may be updated based on future transactions.</li>
          <li>In case of any discrepancy, please contact the accounts department within 7 days.</li>
          <li>This is a computer-generated receipt and does not require a physical signature.</li>
          <li>Please retain this receipt for your records and future reference.</li>
        </ol>
      </div>
    `
  }
  return ''
}
