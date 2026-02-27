import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isNonNegativeNumber, validateEnum } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });
    if (!bill)
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    return NextResponse.json(bill);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const data = await request.json();

    const existingBill = await prisma.bill.findUnique({
      where: { id },
    });

    if (!existingBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const paidAmount = parseFloat(data.paidAmount) || 0;
    const remainingAmount = parseFloat(data.remainingAmount) || 0;
    const status = data.status;
    const paymentMethod = data.paymentMethod || "cash";
    const paymentNotes = data.paymentNotes || "";
    const billNote =
      typeof data.billNote === "string" ? data.billNote.trim() : undefined;

    if (!validateEnum(status, ["pending", "partial", "paid"])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (
      !isNonNegativeNumber(paidAmount) ||
      !isNonNegativeNumber(remainingAmount)
    ) {
      return NextResponse.json({ error: "Invalid amounts" }, { status: 400 });
    }
    if (
      paidAmount > Number(existingBill.totalAmount) ||
      remainingAmount > Number(existingBill.totalAmount)
    ) {
      return NextResponse.json(
        { error: "Amounts exceed total bill" },
        { status: 400 },
      );
    }
    if (
      !validateEnum(paymentMethod, [
        "cash",
        "upi",
        "card",
        "bank_transfer",
        "other",
      ])
    ) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }

    const paymentHistory = Array.isArray(existingBill.paymentHistory)
      ? existingBill.paymentHistory
      : [];
    const deltaPaid = paidAmount - Number(existingBill.paidAmount);
    const paymentHistoryWithPayment =
      deltaPaid > 0
        ? [
            ...paymentHistory,
            {
              amount: deltaPaid,
              totalPaid: paidAmount,
              remainingAmount,
              status,
              date: new Date().toISOString(),
              source: "payment",
              method: paymentMethod,
              notes: paymentNotes,
            },
          ]
        : paymentHistory;

    let updatedPaymentHistory = paymentHistoryWithPayment;
    if (billNote !== undefined) {
      const historyWithoutBillNote = updatedPaymentHistory.filter(
        (entry: any) => entry?.source !== "bill_note",
      );
      updatedPaymentHistory = billNote
        ? [
            ...historyWithoutBillNote,
            {
              amount: 0,
              totalPaid: paidAmount,
              remainingAmount,
              status,
              date: new Date().toISOString(),
              source: "bill_note",
              method: paymentMethod,
              notes: billNote,
            },
          ]
        : historyWithoutBillNote;
    }

    const bill = await prisma.bill.update({
      where: { id },
      data: {
        paidAmount: paidAmount,
        advancePaid:
          Number(existingBill.advancePaid) > 0
            ? existingBill.advancePaid
            : paidAmount,
        remainingAmount: remainingAmount,
        status: status,
        paymentHistory: updatedPaymentHistory,
      },
    });

    const updatedBill = await prisma.bill.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedBill);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update bill", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Find the bill first to ensure it exists
    const bill = await prisma.bill.findUnique({
      where: { id },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Delete the bill
    await prisma.bill.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Bill deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete bill", details: error.message },
      { status: 500 },
    );
  }
}
