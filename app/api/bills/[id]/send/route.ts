import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { sendEmail } from "@/lib/email-server";
import { generateBillEmailHTML } from "@/lib/email-customer";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const data = await request.json().catch(() => ({}));
    const bill = await prisma.bill.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: { customer: true },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const customerEmail = bill.order?.customer?.email;
    const to = data.email || customerEmail;
    if (!to) {
      return NextResponse.json(
        { error: "Customer email not found" },
        { status: 400 },
      );
    }

    const order = bill.order;
    const customer = order?.customer;
    const customerName = customer?.name || "Customer";
    const eventName = order?.eventName || "Catering Event";
    const total = formatCurrency(Number(bill.totalAmount || 0));
    const paid = formatCurrency(Number(bill.paidAmount || 0));
    const remaining = formatCurrency(Number(bill.remainingAmount || 0));
    const billNumber =
      (bill as any).serialNumber?.toString() ||
      bill.id.slice(0, 8).toUpperCase();

    const mealTypeAmounts = order?.mealTypeAmounts as Record<
      string,
      any
    > | null;
    const mealRows =
      mealTypeAmounts && Object.keys(mealTypeAmounts).length > 0
        ? `<table style="width:100%; border-collapse:collapse; margin-top:12px;">
        <thead>
          <tr>
            <th style="text-align:left; font-size:12px; color:#6b7280; padding-bottom:6px;">Meal Type</th>
            <th style="text-align:right; font-size:12px; color:#6b7280; padding-bottom:6px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(mealTypeAmounts)
            .map(([type, d]) => {
              const detail =
                typeof d === "object" && d !== null
                  ? d
                  : { amount: Number(d) || 0 };
              const amount = Number(detail.amount || 0);
              const members = detail.numberOfMembers
                ? ` · Members: ${detail.numberOfMembers}`
                : "";
              return `<tr>
                <td style="padding:6px 0; text-transform: capitalize;">${type}</td>
                <td style="padding:6px 0; text-align:right;">${formatCurrency(amount)}${members}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>`
        : "";

    const html = generateBillEmailHTML({
      customerName,
      eventName,
      total,
      paid,
      remaining,
      billNumber,
      mealRows,
      hasOrderMenu: !!data.orderPdfBase64,
    });

    const subject = `Your Bill from SKC Caterers · ${eventName}`;

    const attachments: { filename: string; content: Buffer | string }[] = [];
    if (data.pdfBase64) {
      attachments.push({
        filename: `SKC-Bill-${billNumber}.pdf`,
        content: data.pdfBase64,
      });
    }
    if (data.orderPdfBase64 && order) {
      const orderId =
        (order as any).serialNumber?.toString() ||
        order.id.slice(0, 8).toUpperCase();
      attachments.push({
        filename: `SKC-Order-Menu-${orderId}.pdf`,
        content: data.orderPdfBase64,
      });
    }

    const sent = await sendEmail({
      to,
      subject,
      html,
      text: `SKC Caterers - Bill for ${eventName}\nTotal: ${total}\nPaid: ${paid}\nRemaining: ${remaining}\nBill No: SKC-${billNumber}`,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (!sent) {
      return NextResponse.json(
        {
          error:
            "Email service not configured. Please set up RESEND_API_KEY or SMTP in environment.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to send bill email:", error);
    return NextResponse.json(
      { error: "Failed to send bill email", details: error.message },
      { status: 500 },
    );
  }
}
