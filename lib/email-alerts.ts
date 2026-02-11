/**
 * Email Alerts System
 * Sends email notifications to all internal users for important events
 */

import { sendEmail } from './email-server'
import { prisma } from './prisma'
import { formatCurrency, formatDateTime } from './utils'

interface AlertEmailData {
  type: 'order_created' | 'order_tomorrow' | 'payment_received' | 'low_stock' | 'expense_created'
  title: string
  message: string
  details?: Record<string, any>
  link?: string
}

/**
 * Get all active internal users' email addresses
 */
async function getInternalUserEmails(): Promise<string[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        email: true,
      },
    })

    return users
      .map(u => u.email)
      .filter((email): email is string => email !== null && email !== undefined && email.includes('@'))
  } catch (error) {
    console.error('Failed to fetch user emails:', error)
    return []
  }
}

/**
 * Generate HTML email template for alerts
 */
function generateAlertEmailHTML(data: AlertEmailData): string {
  const typeConfig: Record<string, { emoji: string; color: string; label: string }> = {
    order_created: { emoji: '🎉', color: '#10b981', label: 'New Order Created' },
    order_tomorrow: { emoji: '📅', color: '#3b82f6', label: 'Tomorrow\'s Orders' },
    payment_received: { emoji: '💰', color: '#10b981', label: 'Payment Received' },
    low_stock: { emoji: '⚠️', color: '#f59e0b', label: 'Low Stock Alert' },
    expense_created: { emoji: '💸', color: '#ef4444', label: 'New Expense' },
  }

  const config = typeConfig[data.type] || { emoji: '🔔', color: '#6b7280', label: 'Notification' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://skc-tan.vercel.app'
  const logoUrl = `${appUrl}/images/logo.jpg`
  
  console.log('[Email Alert] Logo URL:', logoUrl)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #fff;
          border: 2px solid #000;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 18px;
          font-weight: bold;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 10px;
          display: block;
          border-radius: 50%;
          border: 2px solid #000;
        }
        .alert-badge {
          background: #f3f4f6;
          border: 2px solid #000;
          padding: 10px 15px;
          margin: 15px 0;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
        }
        .content {
          margin: 20px 0;
        }
        .details {
          background: #f9fafb;
          border: 1px solid #000;
          padding: 15px;
          margin: 15px 0;
        }
        .detail-row {
          padding: 5px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-label {
          font-weight: bold;
          display: inline-block;
          min-width: 150px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #000;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background: #000;
          color: #fff;
          text-decoration: none;
          border-radius: 5px;
          margin: 15px 0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 10px;">
            <tr>
              <td align="center">
                <img src="${logoUrl}" alt="SKC Caterers Logo" width="80" height="80" style="display: block; border-radius: 50%; border: 2px solid #000; max-width: 80px;" />
              </td>
            </tr>
          </table>
          <h1>SRIVATSASA & KOWNDINYA CATERERS</h1>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Management System Alert</p>
        </div>

        <div class="alert-badge">
          ${config.emoji} ${config.label}
        </div>

        <div class="content">
          <h2 style="font-size: 16px; margin: 0 0 10px 0;">${data.title}</h2>
          <p style="font-size: 14px;">${data.message}</p>
        </div>

        ${data.details ? `
        <div class="details">
          <h3 style="font-size: 14px; margin: 0 0 10px 0;">Details:</h3>
          ${Object.entries(data.details).map(([key, value]) => `
            <div class="detail-row">
              <span class="detail-label">${key}:</span>
              <span>${value}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${data.link ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${data.link}" class="button">View Details</a>
        </div>
        ` : ''}

        <div class="footer">
          <p>This is an automated notification from SKC Caterers Management System</p>
          <p style="margin: 5px 0;">📞 9866652150, 9900119302, 9656501388</p>
          <p style="margin: 5px 0;">📧 pujyasri1989cya@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send alert email to all internal users
 */
export async function sendAlertToUsers(data: AlertEmailData): Promise<void> {
  try {
    const userEmails = await getInternalUserEmails()

    if (userEmails.length === 0) {
      console.log('No internal users with email addresses found. Skipping email alert.')
      return
    }

    const emailHTML = generateAlertEmailHTML(data)
    const subject = `[SKC Caterers] ${data.title}`

    console.log(`Sending alert to ${userEmails.length} users: ${data.title}`)

    // Send email to each user
    const promises = userEmails.map(email =>
      sendEmail({
        to: email,
        subject,
        html: emailHTML,
      }).catch(error => {
        console.error(`Failed to send email to ${email}:`, error)
        return false
      })
    )

    await Promise.all(promises)
    console.log(`Alert sent to ${userEmails.length} users`)
  } catch (error) {
    console.error('Failed to send alert emails:', error)
  }
}

/**
 * Check for tomorrow's orders and send email alert
 */
export async function checkTomorrowOrders(): Promise<void> {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    // Find orders with meal dates for tomorrow
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['pending', 'in_progress'],
        },
      },
      include: {
        customer: true,
      },
    })

    // Filter orders that have meal dates for tomorrow
    const tomorrowOrders = orders.filter(order => {
      if (!order.mealTypeAmounts) return false
      
      const mealTypeAmounts = order.mealTypeAmounts as Record<string, any>
      
      return Object.values(mealTypeAmounts).some((mealData: any) => {
        if (!mealData || typeof mealData !== 'object' || !mealData.date) return false
        
        const mealDate = new Date(mealData.date)
        mealDate.setHours(0, 0, 0, 0)
        
        return mealDate.getTime() === tomorrow.getTime()
      })
    })

    if (tomorrowOrders.length === 0) {
      console.log('No orders for tomorrow')
      return
    }

    // Generate order details for email
    const orderDetails: Record<string, string> = {}
    tomorrowOrders.forEach((order, index) => {
      const customerName = order.customer?.name || 'Unknown'
      const mealTypes = order.mealTypeAmounts 
        ? Object.keys(order.mealTypeAmounts as Record<string, any>).join(', ')
        : 'N/A'
      
      orderDetails[`Order ${index + 1}`] = `${customerName} - ${mealTypes}`
    })

    await sendAlertToUsers({
      type: 'order_tomorrow',
      title: `${tomorrowOrders.length} Order(s) Scheduled for Tomorrow`,
      message: `You have ${tomorrowOrders.length} order(s) scheduled for tomorrow. Please review and prepare.`,
      details: orderDetails,
      link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/history`,
    })
  } catch (error) {
    console.error('Failed to check tomorrow orders:', error)
  }
}

/**
 * Send order created notification
 */
export async function sendOrderCreatedAlert(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
      },
    })

    if (!order) return

    const customerName = order.customer?.name || 'Customer'
    const totalAmount = Number(order.totalAmount || 0)
    
    // Get meal types and dates
    const mealTypeAmounts = order.mealTypeAmounts as Record<string, any> | null
    const mealTypes: string[] = []
    const eventDates: string[] = []
    
    if (mealTypeAmounts) {
      Object.entries(mealTypeAmounts).forEach(([type, data]) => {
        mealTypes.push(type)
        if (data && typeof data === 'object' && data.date) {
          eventDates.push(new Date(data.date).toLocaleDateString())
        }
      })
    }

    await sendAlertToUsers({
      type: 'order_created',
      title: 'New Order Created',
      message: `A new order has been created for ${customerName}`,
      details: {
        'Customer': customerName,
        'Customer Phone': order.customer?.phone || 'N/A',
        'Event Name': (order as any).eventName || 'N/A',
        'Meal Types': mealTypes.join(', ') || 'N/A',
        'Event Dates': eventDates.join(', ') || 'N/A',
        'Total Amount': formatCurrency(totalAmount),
        'Advance Paid': formatCurrency(Number(order.advancePaid || 0)),
        'Balance': formatCurrency(totalAmount - Number(order.advancePaid || 0)),
      },
      link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/history`,
    })
  } catch (error) {
    console.error('Failed to send order created alert:', error)
  }
}

/**
 * Send payment received notification
 */
export async function sendPaymentReceivedAlert(orderId: string, amount: number): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
      },
    })

    if (!order) return

    const customerName = order.customer?.name || 'Customer'

    await sendAlertToUsers({
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment of ${formatCurrency(amount)} received from ${customerName}`,
      details: {
        'Customer': customerName,
        'Amount Received': formatCurrency(amount),
        'Total Advance': formatCurrency(Number(order.advancePaid || 0)),
        'Balance Remaining': formatCurrency(Number(order.totalAmount || 0) - Number(order.advancePaid || 0)),
      },
      link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bills`,
    })
  } catch (error) {
    console.error('Failed to send payment received alert:', error)
  }
}

/**
 * Send low stock notification
 */
export async function sendLowStockAlert(stockId: string): Promise<void> {
  try {
    const stock = await (prisma as any).stock.findUnique({
      where: { id: stockId },
    })

    if (!stock) return

    await sendAlertToUsers({
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${stock.name} is running low on stock`,
      details: {
        'Item': stock.name,
        'Current Stock': `${stock.currentStock || 0} ${stock.unit || ''}`,
        'Minimum Required': `${stock.minimumStock || 0} ${stock.unit || ''}`,
      },
      link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/inventory`,
    })
  } catch (error) {
    console.error('Failed to send low stock alert:', error)
  }
}

/**
 * Send expense created notification
 */
export async function sendExpenseCreatedAlert(expenseId: string): Promise<void> {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    })

    if (!expense) return

    await sendAlertToUsers({
      type: 'expense_created',
      title: 'New Expense Created',
      message: `New expense of ${formatCurrency(Number(expense.amount || 0))} for ${expense.category}`,
      details: {
        'Category': expense.category || 'N/A',
        'Recipient': expense.recipient || 'N/A',
        'Amount': formatCurrency(Number(expense.amount || 0)),
        'Description': expense.description || 'N/A',
      },
      link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/expenses`,
    })
  } catch (error) {
    console.error('Failed to send expense created alert:', error)
  }
}
