import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMetaWhatsAppMessage, buildOrderWhatsAppMessage, formatWhatsAppPhone } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, message, orderId, order: bodyOrder } = body;

    let targetPhone = phone;
    let finalMessage = message;
    let fetchedOrder = bodyOrder;

    // If orderId is provided, fetch order details from database
    if (orderId && !fetchedOrder) {
      fetchedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
        },
      });
    }

    // If order is present, format message and phone number automatically
    if (fetchedOrder) {
      targetPhone = targetPhone || fetchedOrder.customer?.phone;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.skccaterers.in';
      finalMessage = buildOrderWhatsAppMessage(fetchedOrder, appUrl);
    }

    if (!targetPhone) {
      return NextResponse.json(
        { error: 'Customer phone number is required to send WhatsApp message' },
        { status: 400 }
      );
    }

    if (!finalMessage) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const cleanPhone = formatWhatsAppPhone(targetPhone);
    const fallbackUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMessage)}`;

    // Send via Meta Cloud API
    const result = await sendMetaWhatsAppMessage({
      to: cleanPhone,
      message: finalMessage,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          warning: 'Meta API send failed or test token expired. Use fallback link.',
          error: result.error,
          fallbackUrl,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp notification sent successfully',
      data: result.data,
      fallbackUrl,
    });
  } catch (error: any) {
    console.error('Error in WhatsApp API route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
