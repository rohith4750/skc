// Email sending using EmailJS (free tier: 200 emails/month)
// Alternative: Use mailto: for completely free but requires user email client

export async function sendEmailViaService(
  toEmail: string,
  toName: string,
  subject: string,
  message: string
): Promise<boolean> {
  try {
    // Check if EmailJS is configured
    const emailjsPublicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    const emailjsServiceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const emailjsTemplateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID

    if (!emailjsPublicKey || !emailjsServiceId || !emailjsTemplateId) {
      // Fallback to mailto: if EmailJS is not configured
      return false
    }

    const emailjs = (await import('@emailjs/browser')).default
    
    const templateParams = {
      to_email: toEmail,
      to_name: toName,
      subject: subject,
      message: message,
    }

    await emailjs.send(
      emailjsServiceId,
      emailjsTemplateId,
      templateParams,
      emailjsPublicKey
    )

    return true
  } catch (error) {
    console.error('EmailJS error:', error)
    return false
  }
}

export function sendEmailViaMailto(email: string, subject: string, message: string) {
  // Free email sending using mailto: protocol
  // This opens the user's default email client with pre-filled content
  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
  window.open(mailtoLink)
}
