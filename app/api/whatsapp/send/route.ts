import { NextRequest, NextResponse } from "next/server";
import { whatsappClient } from "@/lib/whatsapp/client";

/**
 * Internal API to send WhatsApp messages from the frontend.
 * This route should be protected by authentication in a real application.
 */

export async function POST(req: NextRequest) {
  try {
    const { to, message, template, components } = await req.json();

    if (!to) {
      return NextResponse.json(
        { error: "Recipient number (to) is required" },
        { status: 400 }
      );
    }

    let response;

    if (template) {
      // Send template message
      response = await whatsappClient.sendTemplateMessage(
        to,
        template,
        "en_US",
        components || []
      );
    } else if (message) {
      // Send simple text message
      response = await whatsappClient.sendTextMessage(to, message);
    } else {
      return NextResponse.json(
        { error: "Either message or template must be provided" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error("API Send WhatsApp Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send WhatsApp message",
        details: error,
      },
      { status: 500 }
    );
  }
}
