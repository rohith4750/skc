import { NextResponse } from 'next/server';

/**
 * Meta WhatsApp Cloud API Webhook Endpoint
 * 
 * 1. GET: Used by Meta Developers Dashboard to verify Callback URL & Verify Token
 * 2. POST: Used by Meta to send real-time delivery receipts and incoming customer messages
 */

// GET endpoint for Meta Webhook Verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'skc_whatsapp_verify_2026';

  // Check if mode and token are sent and match WHATSAPP_VERIFY_TOKEN
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WhatsApp Webhook verified successfully with Meta!');
    // Respond with challenge token as plain text as required by Meta
    return new Response(challenge, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } else {
    console.warn('❌ WhatsApp Webhook verification failed. Token mismatch.');
    return NextResponse.json(
      { error: 'Verification failed. Verify token mismatch.' },
      { status: 403 }
    );
  }
}

// POST endpoint for incoming Meta Webhook Notifications (message status / responses)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Log incoming webhook data (delivery status updates / customer messages)
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          const value = change.value;
          if (value?.statuses) {
            value.statuses.forEach((status: any) => {
              console.log(`📱 WhatsApp Message Status update [${status.id}]: ${status.status}`);
            });
          }
          if (value?.messages) {
            value.messages.forEach((msg: any) => {
              console.log(`📩 Incoming WhatsApp Message from ${msg.from}:`, msg.text?.body);
            });
          }
        });
      });
    }

    // Always respond 200 OK to Meta
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing WhatsApp webhook event:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
