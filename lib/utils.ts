import { v4 as uuidv4 } from 'uuid'

export function generateId(): string {
  return uuidv4()
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function sendEmail(email: string, subject: string, message: string) {
  // Free email sending using mailto: protocol
  // This opens the user's default email client with pre-filled content
  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
  window.open(mailtoLink)
}

export function sendWhatsAppMessage(phone: string, message: string) {
  // Format phone number for WhatsApp (handles Indian numbers)
  let cleanPhone = phone.replace(/[^0-9]/g, '')

  // If it's a 10-digit Indian number, add country code +91
  if (cleanPhone.length === 10 && !cleanPhone.startsWith('91')) {
    cleanPhone = '91' + cleanPhone
  }

  // Remove leading 0 if present (e.g., 091 -> 91)
  if (cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.substring(1)
  }

  // Create WhatsApp link - works with both WhatsApp and WhatsApp Business
  // On mobile: Opens WhatsApp/WhatsApp Business app directly with message pre-filled
  // On desktop: Opens WhatsApp Web
  const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  if (isMobile) {
    // On mobile: Open directly (will open WhatsApp Business app if installed, otherwise regular WhatsApp)
    // User just needs to tap "Send" button
    window.location.href = whatsappLink
  } else {
    // On desktop: Open WhatsApp Web in new tab
    window.open(whatsappLink, '_blank')
  }
}

export function sendSMS(phone: string, message: string) {
  // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
  // For now, use sms: protocol
  const smsLink = `sms:${phone}?body=${encodeURIComponent(message)}`
  window.location.href = smsLink
}

export function sanitizeMealLabel(label: string): string {
  if (!label) return ''

  // If it's a long string with hyphens (likely a UUID), return generic label
  if (label.length > 20 && label.includes('-')) return 'Meal'

  let workingLabel = label
  // Strip tracking suffixes like session_NAME_serial
  if (workingLabel.startsWith('session_')) {
    const parts = workingLabel.split('_')
    if (parts.length > 1 && parts[1] !== 'merged') {
      workingLabel = parts[1]
    } else {
      workingLabel = 'Meal'
    }
  }

  const cleanLabel = workingLabel.split('_')[0]
  // If still too long, it's likely a technical ID
  if (cleanLabel.length > 20) return 'Meal'

  // Capitalize for consistent display
  return cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1).toLowerCase()
}
