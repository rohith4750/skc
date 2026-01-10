'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import { Bill, Order, Customer } from '@/types'
import { FaPrint, FaCheck } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Table from '@/components/Table'
import { getBillTableConfig } from '@/components/table-configs'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function BillsPage() {
  const [bills, setBills] = useState<Array<Bill & { order?: Order & { customer?: Customer } }>>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    loadBills()
    
    // Refresh bills when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadBills()
      }
    }
    
    // Refresh bills when window gains focus
    const handleFocus = () => {
      loadBills()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadBills = async (showToast = false) => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/bills?t=${timestamp}`, {
        cache: 'no-store',
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
      if (!response.ok) throw new Error('Failed to fetch bills')
      const allBills = await response.json()
      setBills(allBills)
      if (showToast) {
        toast.success('Bills refreshed')
      }
    } catch (error) {
      console.error('Failed to load bills:', error)
      toast.error('Failed to load bills. Please try again.')
    }
  }

  const handleMarkPaid = async (billId: string) => {
    const bill = bills.find((b: any) => b.id === billId)
    if (!bill) return

    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidAmount: bill.totalAmount,
          remainingAmount: 0,
          status: 'paid',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update bill')
      }

      const updatedBill = await response.json()
      
      // Update the specific bill in the list immediately
      setBills(prevBills => 
        prevBills.map((b: any) => 
          b.id === billId 
            ? { ...b, ...updatedBill }
            : b
        )
      )
      
      // Also refresh from server after a short delay to ensure consistency
      setTimeout(() => {
        loadBills(false)
      }, 500)
      
      toast.success('Bill marked as paid successfully!')
    } catch (error: any) {
      console.error('Failed to update bill:', error)
      toast.error(error.message || 'Failed to update bill. Please try again.')
    }
  }

  const handleGeneratePDF = async (bill: any) => {
    const order = bill.order
    const customer = order?.customer

    // Convert logo to base64 data URL
    let logoDataUrl = ''
    try {
      const logoResponse = await fetch('/logo.png')
      const logoBlob = await logoResponse.blob()
      const reader = new FileReader()
      logoDataUrl = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(logoBlob)
      })
    } catch (error) {
      console.error('Failed to load logo:', error)
    }

    // Create a temporary HTML element to render properly
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm' // A4 width
    tempDiv.style.padding = '20mm'
    tempDiv.style.fontFamily = 'Poppins, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    tempDiv.style.fontSize = '11px'
    tempDiv.style.lineHeight = '1.6'
    tempDiv.style.background = 'white'
    tempDiv.style.color = '#333'
    
    const billNumber = `BILL-${bill.id.slice(0, 8).toUpperCase()}`
    const statusColors = {
      paid: { bg: '#10b981', text: '#ffffff', label: 'PAID' },
      partial: { bg: '#f59e0b', text: '#ffffff', label: 'PARTIAL' },
      pending: { bg: '#ef4444', text: '#ffffff', label: 'PENDING' },
    }
    const statusColor = statusColors[bill.status as keyof typeof statusColors] || statusColors.pending
    
    let htmlContent = `
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { font-family: 'Poppins', sans-serif !important; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1a1a1a; background: #1e3a8a; padding: 20px; border-radius: 8px; }
        .header-logo-container { width: 100%; margin-bottom: 15px; display: block; }
        .header-logo { width: 100%; height: auto; display: block; }
        .header-top { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 12px; color: #fff; }
        .header-main { font-size: 36px; font-weight: 800; margin: 18px 0 10px 0; letter-spacing: 3px; color: #fff; }
        .header-subtitle { font-size: 16px; color: #fff; margin-bottom: 14px; font-style: italic; font-weight: 500; }
        .header-details { font-size: 10px; line-height: 1.8; color: #fff; margin-top: 12px; }
        .header-details div { margin-bottom: 4px; }
        .bill-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding: 15px; background: #f9fafb; border-radius: 8px; }
        .bill-number { font-size: 18px; font-weight: 700; color: #1a1a1a; }
        .bill-date { font-size: 12px; color: #666; margin-top: 5px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 12px; letter-spacing: 1px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #ddd; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
        .info-row { margin-bottom: 8px; }
        .info-label { font-weight: 600; display: inline-block; width: 140px; color: #555; }
        .info-value { color: #1a1a1a; font-weight: 500; }
        .financial-section { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 25px; }
        .financial-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .financial-label { font-weight: 600; color: #555; }
        .financial-value { font-weight: 600; color: #1a1a1a; }
        .financial-row.total { border-top: 3px solid #1a1a1a; border-bottom: 3px solid #1a1a1a; margin-top: 10px; padding-top: 15px; padding-bottom: 15px; }
        .financial-row.total .financial-label { font-size: 16px; font-weight: 800; }
        .financial-row.total .financial-value { font-size: 18px; font-weight: 800; color: #1a1a1a; }
        .payment-summary { background: #fff7ed; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 15px; }
        .payment-summary-title { font-weight: 700; font-size: 14px; margin-bottom: 10px; color: #1a1a1a; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; font-size: 10px; color: #666; }
        .amount-paid { color: #10b981; font-weight: 700; }
        .amount-remaining { color: #ef4444; font-weight: 700; }
      </style>
      
      <div class="header">
        ${logoDataUrl ? `
        <div class="header-logo-container">
          <img src="${logoDataUrl}" alt="SKC Caterers Logo" class="header-logo" />
        </div>
        ` : ''}
        <div class="header-top">
          <div>Telidevara Rajendraprasad</div>
          <div>ART FOOD ZONE (A Food Caterers)</div>
        </div>
        <div class="header-main">SRIVATSASA & KOWNDINYA CATERERS</div>
        <div class="header-subtitle">(Pure Vegetarian)</div>
        <div class="header-details">
          <div>Regd. No: 2361930100031</div>
          <div>Plot No. 115, Padmavathi Nagar, Bank Colony, Saheb Nag Vanathalipuram, Hyderabad - 500070.</div>
          <div>Email: pujaysri1989@gmail.com | Cell: 98666521502, 9900119302, 9656501388</div>
        </div>
      </div>
      
      <div class="bill-info">
        <div>
          <div class="bill-number">${billNumber}</div>
          <div class="bill-date">Date: ${formatDate(bill.createdAt)}</div>
          ${order?.eventName ? `<div class="bill-date" style="margin-top: 5px;">Event: ${order.eventName}</div>` : ''}
        </div>
        <div class="status-badge" style="background-color: ${statusColor.bg}; color: ${statusColor.text};">
          ${statusColor.label}
        </div>
      </div>
      
      <div class="info-grid">
        <div class="section">
          <div class="section-title">Bill To</div>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${customer?.name || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${customer?.phone || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${customer?.email || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span class="info-value">${customer?.address || 'N/A'}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Order Details</div>
          <div class="info-row">
            <span class="info-label">Order ID:</span>
            <span class="info-value">${order?.id ? order.id.slice(0, 8).toUpperCase() : 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Order Date:</span>
            <span class="info-value">${order?.createdAt ? formatDate(order.createdAt) : 'N/A'}</span>
          </div>
          ${order?.supervisor ? `
          <div class="info-row">
            <span class="info-label">Supervisor:</span>
            <span class="info-value">${order.supervisor.name || 'N/A'}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="financial-section">
        <div class="section-title" style="margin-bottom: 15px; border-bottom: none; padding-bottom: 0;">Payment Summary</div>
        <div class="financial-row">
          <span class="financial-label">Total Amount:</span>
          <span class="financial-value">${formatCurrency(bill.totalAmount)}</span>
        </div>
        <div class="financial-row">
          <span class="financial-label">Advance Paid:</span>
          <span class="financial-value amount-paid">${formatCurrency(bill.advancePaid)}</span>
        </div>
        ${bill.paidAmount > 0 ? `
        <div class="financial-row">
          <span class="financial-label">Amount Paid:</span>
          <span class="financial-value amount-paid">${formatCurrency(bill.paidAmount)}</span>
        </div>
        ` : ''}
        <div class="financial-row total">
          <span class="financial-label">Remaining Balance:</span>
          <span class="financial-value amount-remaining">${formatCurrency(bill.remainingAmount)}</span>
        </div>
        
        ${bill.status === 'partial' ? `
        <div class="payment-summary">
          <div class="payment-summary-title">Payment Status: Partial Payment</div>
          <div style="font-size: 11px; color: #666; line-height: 1.6;">
            This bill has been partially paid. Please pay the remaining balance of ${formatCurrency(bill.remainingAmount)} to complete the payment.
          </div>
        </div>
        ` : bill.status === 'pending' ? `
        <div class="payment-summary" style="background: #fef2f2; border-left-color: #ef4444;">
          <div class="payment-summary-title" style="color: #991b1b;">Payment Status: Pending</div>
          <div style="font-size: 11px; color: #666; line-height: 1.6;">
            This bill is pending payment. Total amount due: ${formatCurrency(bill.totalAmount)}.
          </div>
        </div>
        ` : `
        <div class="payment-summary" style="background: #f0fdf4; border-left-color: #10b981;">
          <div class="payment-summary-title" style="color: #065f46;">Payment Status: Paid in Full</div>
          <div style="font-size: 11px; color: #666; line-height: 1.6;">
            Thank you for your payment. This bill has been paid in full.
          </div>
        </div>
        `}
      </div>
      
      <div class="footer">
        <div style="margin-bottom: 8px; font-weight: 600;">Thank you for your business!</div>
        <div>This is a computer-generated bill. For any queries, please contact us at the above address.</div>
        <div style="margin-top: 8px;">Generated on ${formatDateTime(new Date().toISOString())}</div>
      </div>
    `
    
    tempDiv.innerHTML = htmlContent
    document.body.appendChild(tempDiv)
    
    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      // Remove temporary element
      document.body.removeChild(tempDiv)
      
      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
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
      
      pdf.save(`bill-${bill.id.slice(0, 8)}.pdf`)
      toast.success('Bill PDF generated successfully!')
    } catch (error) {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv)
      }
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  const tableConfig = getBillTableConfig()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Bills</h1>
        <p className="text-gray-600 mt-2">View and manage customer bills</p>
      </div>

      <Table
        columns={tableConfig.columns}
        data={bills}
        emptyMessage={tableConfig.emptyMessage}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalItems={bills.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemName={tableConfig.itemName}
        getItemId={tableConfig.getItemId}
        renderActions={(bill) => (
          <div className="flex items-center gap-2">
            {bill.status !== 'paid' && (
              <button
                onClick={() => handleMarkPaid(bill.id)}
                className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 rounded"
                title="Mark as Paid"
              >
                <FaCheck />
              </button>
            )}
            <button
              onClick={() => handleGeneratePDF(bill)}
              className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 rounded"
              title="Generate PDF"
            >
              <FaPrint />
            </button>
          </div>
        )}
      />
    </div>
  )
}
