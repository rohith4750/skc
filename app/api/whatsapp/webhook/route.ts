import { NextRequest, NextResponse } from "next/server";

/**
 * WhatsApp Webhook Handler
 * Path: /api/whatsapp/webhook
 * 
 * Supports both:
 * 1. Verification (GET): Standard Meta handshake
 * 2. Event Handling (POST): Receiving messages and status updates
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      console.log("WhatsApp Webhook Verified!");
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.warn("WhatsApp Webhook Verification Failed: Token Mismatch");
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Log the incoming message for diagnostics
    // In production, you might want to store this in a database
    console.log("Incoming WhatsApp Webhook Payload:", JSON.stringify(body, null, 2));

    // Meta sends many types of notifications (messages, status, etc.)
    // We only care about actual messages for now
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      const message = value.messages[0];
      const from = message.from; // Sender's phone number
      const text = message.text?.body; // Message content

      console.log(`Received WhatsApp from ${from}: ${text}`);

      // TODO: Handle the message logic here (e.g., trigger AI bot, save to DB, alert admin)
    }

    // Always respond with 200 OK to Meta to acknowledge receipt
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("WhatsApp Webhook Error:", error);
    // Even on error, we usually return 200 to Meta to avoid retries, 
    // unless it's a critical infrastructure failure.
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
