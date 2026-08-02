import { NextResponse } from 'next/server';
import { sendMetaWhatsAppMessage, formatWhatsAppPhone } from '@/lib/whatsapp';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone') || '917396531079';

  const cleanPhone = formatWhatsAppPhone(phone);
  const testMessage = `*SKC CATERERS* 🍽️\nTest Message from API endpoint.\nTime: ${new Date().toLocaleTimeString()}\nStatus: WhatsApp API Active ✅`;

  console.log(`[WhatsApp Test] Sending test message to ${cleanPhone}...`);

  const result = await sendMetaWhatsAppMessage({
    to: cleanPhone,
    message: testMessage,
  });

  return NextResponse.json({
    phone: cleanPhone,
    result,
    configuredPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    tokenConfigured: Boolean(process.env.WHATSAPP_TOKEN),
  });
}
