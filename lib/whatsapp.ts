/**
 * WhatsApp Cloud API Integration Helper (Meta Graph API)
 */

export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  // If 10-digit Indian mobile number, add country code +91
  if (clean.length === 10 && !clean.startsWith('91')) {
    clean = '91' + clean;
  }
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  return clean;
}

export async function sendMetaWhatsAppMessage({
  to,
  message,
  customToken,
  customPhoneId,
}: {
  to: string;
  message: string;
  customToken?: string;
  customPhoneId?: string;
}) {
  const token = customToken || process.env.WHATSAPP_TOKEN;
  const phoneNumberId = customPhoneId || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId || phoneNumberId === 'your_phone_id_here') {
    console.warn('WhatsApp API credentials not configured in environment variables.');
    return {
      success: false,
      error: 'WhatsApp Cloud API credentials (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID) not configured.',
    };
  }

  const cleanPhone = formatWhatsAppPhone(to);
  if (!cleanPhone) {
    return { success: false, error: 'Invalid phone number provided' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: message,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Meta WhatsApp API Error Response:', data);
      return {
        success: false,
        error: data.error?.message || 'Failed to send WhatsApp message via Meta API',
        data,
      };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error in sendMetaWhatsAppMessage:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred while calling Meta WhatsApp API',
    };
  }
}

export function buildOrderWhatsAppMessage(order: any, appUrl: string): string {
  const customerName = order.customer?.name || order.customerName || 'Valued Customer';
  const eventName = order.eventName || 'Catering Event';
  
  let dateStr = 'N/A';
  if (order.eventDate) {
    try {
      dateStr = new Date(order.eventDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      dateStr = String(order.eventDate);
    }
  }

  const totalAmount = Number(order.totalAmount || 0).toLocaleString('en-IN');
  const advancePaid = Number(order.advancePaid || 0).toLocaleString('en-IN');
  const remainingAmount = Number(order.remainingAmount || 0).toLocaleString('en-IN');

  const orderId = order.id || order._id || '';
  const summaryUrl = orderId ? `${appUrl.replace(/\/$/, '')}/orders/summary/${orderId}` : `${appUrl.replace(/\/$/, '')}/orders`;

  let sessionText = '';
  if (order.mealTypeAmounts && typeof order.mealTypeAmounts === 'object') {
    sessionText = Object.entries(order.mealTypeAmounts)
      .map(([key, mt]: [string, any]) => {
        const name = (mt.menuType || key).toUpperCase();
        const members = mt.numberOfMembers || mt.numberOfPlates || '';
        return `  • ${name}${members ? ` (${members} Guests)` : ''}`;
      })
      .join('\n');
  }

  return `*SRIVATSASA & KOWNDINYA CATERERS*
Dear *${customerName}*,

Thank you for choosing SKC Caterers! Your order has been successfully created.

📌 *Order Details:*
• *Event:* ${eventName}
• *Date:* ${dateStr}
${sessionText ? `\n🍽️ *Sessions:*\n${sessionText}\n` : ''}
💰 *Financial Summary:*
• *Total Amount:* ₹${totalAmount}
• *Advance Paid:* ₹${advancePaid}
• *Balance Due:* ₹${remainingAmount}

📄 *View Menu & Bill PDF:*
${summaryUrl}

For any modifications or queries, please contact us.`;
}
