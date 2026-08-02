import { NextResponse } from 'next/server';
import { sendMetaWhatsAppMessage, formatWhatsAppPhone } from '@/lib/whatsapp';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone') || '917396531079';
  const token = searchParams.get('token') || undefined;
  const phoneId = searchParams.get('phone_id') || undefined;

  const cleanPhone = formatWhatsAppPhone(phone);
  const testMessage = `*SKC CATERERS* 🍽️\nTest Notification from SKC WhatsApp Integration.\nTime: ${new Date().toLocaleTimeString()}\nStatus: Meta WhatsApp Cloud API Active ✅`;

  console.log(`[WhatsApp Test] Sending test message to ${cleanPhone}...`);

  const result = await sendMetaWhatsAppMessage({
    to: cleanPhone,
    message: testMessage,
    customToken: token,
    customPhoneId: phoneId,
  });

  return NextResponse.json({
    phone: cleanPhone,
    result,
    configuredPhoneNumberId: phoneId || process.env.WHATSAPP_PHONE_NUMBER_ID,
    tokenConfigured: Boolean(token || process.env.WHATSAPP_TOKEN),
  });
}
