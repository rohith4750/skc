import { formatCurrency, formatDate, formatDateTime, sanitizeMealLabel } from './utils'

export interface PDFTemplateData {
  type: 'bill' | 'expense' | 'workforce' | 'statement' | 'inventory'
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
    eventName?: string
    notes?: string
    calculationDetails?: any
    isBulkExpense?: boolean
    bulkAllocations?: any[]
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
      orderName?: string
      customerName?: string
      calculationDetails?: any
      isBulkExpense?: boolean
      bulkAllocations?: any[]
    }>
  }
  orderId?: string
  supervisor?: string
  options?: {
    splitByDate?: boolean
  }
  statementDetails?: {
    customerName: string
    customerPhone?: string
    bills: Array<{
      serialNumber: string
      date: string
      eventName: string
      total: number
      paid: number
      balance: number
    }>
    grandTotal: number
    totalPaid: number
    totalBalance: number
  }
  inventoryDetails?: {
    items: Array<{
      name: string
      category: string
      quantity: number
      unit: string
      condition: string
      location?: string
      pricePerUnit?: number
      totalValue?: number
    }>
    grandTotalValue?: number
  }
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
          overflow: visible;
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
        .details-grid {
          display: flex;
          justify-content: space-between;
          border: 1px solid #000;
          padding: 8px;
          margin-bottom: 10px;
        }
        .grid-item {
          flex: 1;
        }
        .grid-label {
          font-weight: 500;
          font-size: 10px;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 3px;
        }
        .grid-value {
          font-size: 12px;
          font-weight: 600;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 15px;
        }
        .details-table th, .details-table td {
          border: 1px solid #000;
          padding: 6px 8px;
          text-align: left;
          font-size: 11px;
        }
        .details-table th {
          background-color: #f8fafc;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 10px;
        }
        .text-right { text-align: right !important; }
        .stamp-image {
          position: absolute;
          width: 100px;
          height: auto;
          opacity: 0.8;
          top: -45px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
        }
        .signature-box {
          width: 45%;
          position: relative;
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
        ${data.type === 'statement' ? generateStatementContent(data) : ''}
        ${data.type === 'inventory' ? generateInventoryContent(data) : ''}

        <!-- Terms & Conditions -->
        ${generateTermsAndConditions(data.type)}

        <!-- Signatures -->
        <div class="signature-section">
          <div class="signature-box">
            ${(data.type === 'workforce' || (data.type === 'expense' && ['supervisor', 'chef', 'labours', 'boys', 'transport', 'gas', 'pan', 'store', 'other'].includes(data.expenseDetails?.category?.toLowerCase() || ''))) ? `
              <img src="/images/billstamp.png" class="stamp-image" alt="Stamp" />
            ` : ''}
            <div class="signature-line">Authorized Signatory & Stamp</div>
          </div>
          ${(data.type !== 'inventory' && data.type !== 'workforce' &&
      !(data.type === 'expense' && ['supervisor', 'chef', 'labours', 'boys', 'transport', 'gas', 'pan', 'store', 'other'].includes(data.expenseDetails?.category?.toLowerCase() || ''))) ? `
          <div class="signature-box">
            <div class="signature-line">Customer Signature</div>
          </div>
          ` : ''}
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
  const mealTypeAmounts = data.mealTypeAmounts || {}
  const stalls = data.stalls || []
  const financial = data.financial || { totalAmount: 0 }
  const splitByDate = data.options?.splitByDate || false

  // Group sessions by date
  const groupedByDate: Record<string, any[]> = {}
  Object.entries(mealTypeAmounts).forEach(([key, mealData]) => {
    const dataObj = typeof mealData === 'object' && mealData !== null ? mealData : { amount: typeof mealData === 'number' ? mealData : 0 } as any
    const date = dataObj.date || 'Other'
    if (!groupedByDate[date]) groupedByDate[date] = []
    groupedByDate[date].push({ key, ...dataObj })
  })

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    if (a === 'Other') return 1
    if (b === 'Other') return -1
    const da = new Date(a).getTime()
    const db = new Date(b).getTime()
    return (isNaN(da) ? Infinity : da) - (isNaN(db) ? Infinity : db)
  })

  // If we are NOT splitting, we just run the existing logic once for all dates
  // If we ARE splitting, we loop through dates and generate a full bill section for each.

  const renderDateBill = (targetDate: string | null) => {
    const mealTypeRows: string[] = []
    const priorityOrder = ['breakfast', 'tiffins', 'lunch', 'snacks', 'dinner', 'supper'];

    // Filter sessions if we are splitting
    const datesToRender = targetDate ? [targetDate] : sortedDates;

    datesToRender.forEach(date => {
      // Add date header if not splitting (grouped view)
      if (!splitByDate && sortedDates.length > 1) {
        mealTypeRows.push(`
          <div class="form-row" style="background: #f9f9f9; padding: 4px; font-weight: bold; font-size: 11px; margin-top: 10px; border-bottom: 1px solid #eee;">
            Event Date: ${formatDate(date)}
          </div>
        `)
      }

      const sessions = groupedByDate[date].sort((a, b) => {
        const typeA = (a.menuType || a.key).toLowerCase()
        const typeB = (b.menuType || b.key).toLowerCase()
        const indexA = priorityOrder.indexOf(typeA);
        const indexB = priorityOrder.indexOf(typeB);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return typeA.localeCompare(typeB);
      })

      sessions.forEach(session => {
        const persons = session.numberOfMembers || 0
        const amount = session.amount || 0
        const pricingMethod = session.pricingMethod || 'manual'
        const platePrice = session.platePrice || 0
        const manualAmount = session.manualAmount || 0

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

        const menuType = session.menuType || session.key
        const mealTypeName = sanitizeMealLabel(menuType)

        mealTypeRows.push(`
          <div class="form-row">
            <span class="form-label">${mealTypeName} No of Persons:${(!splitByDate && sortedDates.length > 1) ? `<br><small style="color:#666;font-weight:normal">${formatDate(date)}</small>` : ''}</span>
            <span class="form-value-inline" style="width: 50px;">${persons || ''}</span>
            <span style="font-size: 10px; margin-left: 10px;">Rate:</span>
            <span class="form-value-inline" style="width: 80px;">${rateDisplay}</span>
            <span style="font-size: 10px; margin-left: 10px;">Total:</span>
            <span class="form-value-inline" style="width: 100px;">${displayAmount > 0 ? formatCurrency(displayAmount) : ''}</span>
          </div>
        `)
      })
    })

    // Calculate subtotal for this specific bill section
    let currentTotal = 0
    if (splitByDate && targetDate) {
      currentTotal = groupedByDate[targetDate].reduce((sum, s) => sum + (s.amount || 0), 0)
    } else {
      currentTotal = financial.totalAmount
    }

    // Determine what to show for financial footer
    // If splitting, we show a simplified footer per page
    // If grouped, we show the full financial breakdown
    const showFullFinancial = !splitByDate || (splitByDate && sortedDates.length === 1)

    // Stall rows (only on first page if splitting or all if grouped)
    const stallsRows: string[] = []
    if (stalls.length > 0 && (!splitByDate || (splitByDate && targetDate === sortedDates[0]))) {
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
      <div class="bill-page-section" style="${splitByDate && targetDate !== sortedDates[sortedDates.length - 1] ? 'page-break-after: always;' : ''}">
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
            <span class="form-label">Name:</span>
            <span class="form-value">${customer.name || ''}</span>
          </div>
          <div class="form-row" style="margin-bottom: 2px;">
            <span class="form-label">Address:</span>
            <span class="form-value" style="font-size: 10px;">${customer.address || ''}</span>
          </div>
          <div class="form-row">
            <span class="form-label">Contact No:</span>
            <span class="form-value">${customer.phone || ''}</span>
          </div>
          <div class="form-row">
            <span class="form-label">Function Date:</span>
            <span class="form-value">${splitByDate && targetDate ? formatDate(targetDate) : (eventDetails.functionDate || '')}</span>
          </div>
        </div>

        <!-- Bill Summary -->
        <div class="form-section" style="border: 2px solid #000; padding: 12px; margin: 15px 0; min-height: 120mm; overflow: visible;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; text-align: center;">
            ${splitByDate ? 'PARTIAL BILL SUMMARY' : 'BILL SUMMARY'}
          </div>
          
          ${mealTypeRows.length > 0 ? mealTypeRows.join('') : ''}
          
          ${stallsRows.length > 0 ? `
            <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 5px;">
              <div style="font-weight: 600; font-size: 11px; margin-bottom: 5px;">STALLS / EXTRAS</div>
              ${stallsRows.join('')}
            </div>
          ` : ''}
          
          <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
            ${showFullFinancial && financial.waterBottlesCost ? `
            <div class="financial-row">
              <span class="financial-label">Water Bottles:</span>
              <span class="financial-value">${formatCurrency(financial.waterBottlesCost)}</span>
            </div>
            ` : ''}
            ${showFullFinancial && financial.transport ? `
            <div class="financial-row">
              <span class="financial-label">Transport:</span>
              <span class="financial-value">${formatCurrency(financial.transport)}</span>
            </div>
            ` : ''}
            
            ${showFullFinancial ? `
              <div class="financial-row">
                <span class="financial-label">Advance Paid:</span>
                <span class="financial-value">${financial.advancePaid ? formatCurrency(financial.advancePaid) : formatCurrency(0)}</span>
              </div>
              ${(financial.paidAmount || 0) > (financial.advancePaid || 0) ? `
              <div class="financial-row">
                <span class="financial-label">Additional Paid:</span>
                <span class="financial-value">${formatCurrency((financial.paidAmount || 0) - (financial.advancePaid || 0))}</span>
              </div>
              ` : ''}
            ` : ''}

            <div class="financial-row" style="border-top: 2px solid #000; padding-top: 8px; margin-top: 8px;">
              <span class="financial-label" style="font-weight: bold;">${splitByDate ? 'Date Total:' : 'Grand Total:'}</span>
              <span class="financial-value" style="font-weight: bold;">${formatCurrency(currentTotal)}</span>
            </div>
            ${showFullFinancial ? `
              <div class="financial-row">
                <span class="financial-label">Balance Amount:</span>
                <span class="financial-value">${formatCurrency(financial.balanceAmount || financial.remainingAmount || 0)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `
  }

  if (splitByDate && sortedDates.length > 1) {
    return sortedDates.map(date => renderDateBill(date)).join('')
  } else {
    return renderDateBill(null)
  }
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
    </div>

    <!-- Expense Details -->
    <div class="expense-details" style="border: none; padding: 0;">
      <div class="section-title">EXPENSE DETAILS</div>
      
      <div class="details-grid">
        <div class="grid-item">
          <div class="grid-label">Category</div>
          <div class="grid-value">${expense.category ? expense.category.charAt(0).toUpperCase() + expense.category.slice(1) : ''}</div>
        </div>
        <div class="grid-item">
          <div class="grid-label">Recipient</div>
          <div class="grid-value">${expense.recipient || 'N/A'}</div>
        </div>
        <div class="grid-item">
          <div class="grid-label">Event Date</div>
          <div class="grid-value">${expense.eventDate ? formatDate(expense.eventDate) : 'N/A'}</div>
        </div>
      </div>

      ${expense.description ? `
      <div class="form-row" style="margin-bottom: 10px;">
        <span class="form-label" style="min-width: 100px;">Description:</span>
        <span class="form-value">${expense.description}</span>
      </div>
      ` : ''}

      ${expense.isBulkExpense && expense.bulkAllocations && expense.bulkAllocations.length > 0 ? `
      <div class="section-title" style="margin-top: 20px; font-size: 12px;">EVENT BREAKDOWN</div>
      <table class="details-table">
        <thead>
          <tr>
            <th>Event / Order</th>
            <th class="text-right">${expense.category === 'chef' ? 'Plates' : 'Percentage'}</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${expense.bulkAllocations.map((alloc: any) => `
          <tr>
            <td>${alloc.orderName}</td>
            <td class="text-right">${expense.category === 'chef' ? (alloc.plates || '-') : (alloc.percentage ? alloc.percentage.toFixed(1) + '%' : '-')}</td>
            <td class="text-right">${formatCurrency(alloc.amount)}</td>
          </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="font-weight: bold; text-align: right;">Total Allocated:</td>
            <td style="font-weight: bold;" class="text-right">${formatCurrency(expense.amount)}</td>
          </tr>
        </tfoot>
      </table>
      ` : ''}

      ${!expense.isBulkExpense && expense.calculationDetails ? `
        ${expense.category === 'boys' ? `
          <div class="details-grid" style="margin-top: 10px;">
            <div class="grid-item">
              <div class="grid-label">Dressed Boys</div>
              <div class="grid-value">${expense.calculationDetails.dressedBoys || 0} @ ${formatCurrency(expense.calculationDetails.dressedBoyAmount || 0)}</div>
            </div>
            <div class="grid-item">
              <div class="grid-label">Non-Dressed Boys</div>
              <div class="grid-value">${expense.calculationDetails.nonDressedBoys || 0} @ ${formatCurrency(expense.calculationDetails.nonDressedBoyAmount || 0)}</div>
            </div>
          </div>
        ` : `
          <div class="details-grid" style="margin-top: 10px;">
            <div class="grid-item">
              <div class="grid-label">Calculation Method</div>
              <div class="grid-value">${expense.calculationDetails.method || 'N/A'}</div>
            </div>
            ${expense.calculationDetails.method === 'plate-wise' ? `
            <div class="grid-item">
              <div class="grid-label">Plate Details</div>
              <div class="grid-value">${expense.calculationDetails.plates || 0} plates @ ${formatCurrency(expense.calculationDetails.perPlateAmount || 0)}</div>
            </div>
            ` : ''}
          </div>
        `}
      ` : ''}

      ${expense.notes ? `
      <div class="form-row">
        <span class="form-label" style="min-width: 100px;">Notes:</span>
        <span class="form-value">${expense.notes}</span>
      </div>
      ` : ''}
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
  const role = (workforce.role || '').toLowerCase()
  const isChefOrSupervisor = role === 'chef' || role === 'supervisor'

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
          <span class="form-value" style="text-transform: capitalize;">${workforce.role || ''}</span>
        </div>
      </div>
    </div>

    ${expenses.length > 0 ? `
    <!-- Expense Items -->
    <div class="form-section">
      <div class="section-title">${isChefOrSupervisor ? 'EVENT WISE BREAKDOWN' : 'EXPENSE ITEMS'}</div>
      
      ${isChefOrSupervisor ? `
        <table class="details-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Event / Customer</th>
              ${role === 'chef' ? '<th>Plates</th>' : ''}
              ${role === 'chef' ? '<th>Rate</th>' : ''}
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.flatMap(exp => {
    if (exp.isBulkExpense && exp.bulkAllocations && exp.bulkAllocations.length > 0) {
      return exp.bulkAllocations.map((alloc: any) => ({
        date: exp.date,
        orderName: alloc.orderName,
        customerName: alloc.customerName || '',
        amount: alloc.amount,
        plates: alloc.plates,
        rate: exp.calculationDetails?.perPlateAmount,
        description: exp.description,
        isAllocation: true
      }))
    }
    return [{
      date: exp.date,
      orderName: exp.orderName,
      customerName: exp.customerName,
      amount: exp.amount,
      plates: exp.calculationDetails?.plates,
      rate: exp.calculationDetails?.perPlateAmount,
      description: exp.description,
      isAllocation: false
    }]
  }).map(item => {
    const eventInfo = [item.orderName, item.customerName].filter(Boolean).join(' - ')

    return `
                <tr>
                  <td>${formatDate(item.date)}</td>
                  <td>
                    <div style="font-weight: bold;">${eventInfo || 'General Expense'}</div>
                    ${item.description ? `<div style="font-size: 9px; color: #666; margin-top: 2px;">${item.description}</div>` : ''}
                  </td>
                  ${role === 'chef' ? `<td>${item.plates || '-'}</td>` : ''}
                  ${role === 'chef' ? `<td>${item.rate ? formatCurrency(item.rate) : '-'}</td>` : ''}
                  <td class="text-right">${formatCurrency(item.amount)}</td>
                </tr>
              `
  }).join('')}
          </tbody>
        </table>
      ` : `
        ${expenses.map((exp, idx) => {
    const calc = exp.calculationDetails || {}
    return `
            <div class="expense-item">
              <div class="form-row">
                <span class="form-label">Date:</span>
                <span class="form-value">${formatDate(exp.date)}</span>
                <span style="margin-left: 20px;" class="form-label">Amount:</span>
                <span class="form-value">${formatCurrency(exp.amount)}</span>
              </div>
              
              ${role === 'boys' && (calc.method === 'per-member-type' || (calc.dressedBoys !== undefined)) ? `
                <div class="form-row" style="font-size: 10px; color: #666; margin-top: 2px;">
                  <span>Dressed: ${calc.dressedBoys || 0} (@ ${formatCurrency(calc.dressedBoyAmount || 0)})</span>
                  <span style="margin-left: 15px;">Non-Dressed: ${calc.nonDressedBoys || 0} (@ ${formatCurrency(calc.nonDressedBoyAmount || 0)})</span>
                </div>
              ` : ''}

              ${exp.description ? `
              <div class="form-row">
                <span class="form-label">Description:</span>
                <span class="form-value">${exp.description}</span>
              </div>
              ` : ''}
              
              ${exp.orderName ? `
              <div class="form-row" style="font-size: 10px; color: #444;">
                <span class="form-label">Event:</span>
                <span class="form-value">${exp.orderName} ${exp.customerName ? `(${exp.customerName})` : ''}</span>
              </div>
              ` : ''}
            </div>
          `
  }).join('')}
      `}
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

function generateTermsAndConditions(type: 'bill' | 'expense' | 'workforce' | 'statement' | 'inventory'): string {
  if (type === 'bill' || type === 'statement') {
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
  } else if (type === 'inventory') {
    return `
      <div class="terms-section">
        <div class="terms-title">REPORT NOTES</div>
        <ol class="terms-list">
          <li>This is a computer-generated inventory report of current physical stock.</li>
          <li>In case of any discrepancy between physical stock and this report, please inform management immediately.</li>
          <li>All kitchen equipment and items listed are the property of SKC Caterers.</li>
          <li>Authorized personnel only should handle the movement of inventory items.</li>
        </ol>
      </div>
    `
  }
  return ''
}
function generateStatementContent(data: PDFTemplateData): string {
  const details = data.statementDetails
  if (!details) return ''

  return `
    <div class="section-title">STATEMENT OF ACCOUNT</div>
    
    <div style="margin-bottom: 25px;">
      <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">Customer: ${details.customerName}</div>
      ${details.customerPhone ? `<div style="font-size: 11px;">Phone: ${details.customerPhone}</div>` : ''}
      <div style="font-size: 11px; margin-top: 5px;">Date: ${formatDate(new Date().toISOString())}</div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: left;">Bill ID</th>
          <th style="text-align: left;">Date</th>
          <th style="text-align: left;">Event Name</th>
          <th style="text-align: right;">Total Amount</th>
          <th style="text-align: right;">Paid</th>
          <th style="text-align: right;">Balance</th>
        </tr>
      </thead>
      <tbody>
        ${details.bills.map(bill => `
          <tr>
            <td>#${bill.serialNumber}</td>
            <td>${formatDate(bill.date)}</td>
            <td>${bill.eventName || 'N/A'}</td>
            <td style="text-align: right;">${formatCurrency(bill.total)}</td>
            <td style="text-align: right;">${formatCurrency(bill.paid)}</td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(bill.balance)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f8fafc; font-weight: bold;">
          <td colspan="3" style="text-align: right; padding: 10px;">GRAND TOTAL:</td>
          <td style="text-align: right; padding: 10px;">${formatCurrency(details.grandTotal)}</td>
          <td style="text-align: right; padding: 10px; color: #10b981;">${formatCurrency(details.totalPaid)}</td>
          <td style="text-align: right; padding: 10px; color: #ef4444; font-size: 16px;">${formatCurrency(details.totalBalance)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 20px;">
      <div style="font-size: 10px; color: #666; font-style: italic;">
        * This statement summarizes the selected outstanding and paid bills for the customer listed above.
      </div>
    </div>
  `
}

function generateInventoryContent(data: PDFTemplateData): string {
  const details = data.inventoryDetails
  if (!details) return ''

  return `
    <div class="section-title">INVENTORY REPORT</div>
    
    <div style="margin-bottom: 25px;">
      <div style="font-size: 11px;">Reporting Date: ${formatDate(data.date)}</div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background-color: #f8fafc; border-bottom: 2px solid #000;">
          <th style="text-align: left; padding: 10px; font-weight: bold; border: 1px solid #000;">Item Name</th>
          <th style="text-align: center; padding: 10px; font-weight: bold; border: 1px solid #000;">Quantity</th>
          <th style="text-align: right; padding: 10px; font-weight: bold; border: 1px solid #000;">Price/Unit</th>
          <th style="text-align: right; padding: 10px; font-weight: bold; border: 1px solid #000;">Total Value</th>
          <th style="text-align: left; padding: 10px; font-weight: bold; border: 1px solid #000;">Condition</th>
        </tr>
      </thead>
      <tbody>
        ${details.items.map(item => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; border: 1px solid #000;">
              <div style="font-weight: bold;">${item.name}</div>
              <div style="font-size: 9px; color: #666; text-transform: capitalize;">${item.category.replace('_', ' ')} | ${item.location || '-'}</div>
            </td>
            <td style="padding: 10px; border: 1px solid #000; text-align: center; font-weight: bold;">${item.quantity} ${item.unit}</td>
            <td style="padding: 10px; border: 1px solid #000; text-align: right;">${item.pricePerUnit ? formatCurrency(item.pricePerUnit) : '-'}</td>
            <td style="padding: 10px; border: 1px solid #000; text-align: right; font-weight: bold;">${item.totalValue ? formatCurrency(item.totalValue) : '-'}</td>
            <td style="padding: 10px; border: 1px solid #000; text-transform: capitalize; font-size: 10px;">${item.condition}</td>
          </tr>
        `).join('')}
      </tbody>
      ${details.grandTotalValue ? `
      <tfoot>
        <tr style="background-color: #f8fafc; font-weight: bold;">
          <td colspan="3" style="text-align: right; padding: 10px; border: 1px solid #000;">GRAND TOTAL VALUE:</td>
          <td style="text-align: right; padding: 10px; border: 1px solid #000; font-size: 14px; color: #3366ff;">${formatCurrency(details.grandTotalValue)}</td>
          <td style="border: 1px solid #000;"></td>
        </tr>
      </tfoot>
      ` : ''}
    </table>

    <div style="margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 20px;">
      <div style="font-size: 10px; color: #666; font-style: italic;">
        * This report contains details of ${details.items.length} items currently in inventory.
      </div>
    </div>
  `
}
