import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transformDecimal } from "@/lib/decimal-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id: billId } = params;
    const { entryId, amount, date, method, notes } = await request.json();

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { order: true },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const paymentHistory = (bill.paymentHistory as any[]) || [];
    const entryIndex = paymentHistory.findIndex((e) => e.id === entryId);

    if (entryIndex === -1) {
      return NextResponse.json(
        { error: "Ledger entry not found" },
        { status: 404 },
      );
    }

    // Update the entry
    const updatedEntry = {
      ...paymentHistory[entryIndex],
      amount: parseFloat(amount) || 0,
      date: date || paymentHistory[entryIndex].date,
      method: method || paymentHistory[entryIndex].method,
      notes: notes || paymentHistory[entryIndex].notes,
    };

    const newHistory = [...paymentHistory];
    newHistory[entryIndex] = updatedEntry;

    // Recalculate totals
    const newPaidAmount = newHistory.reduce(
      (sum, e) => sum + (parseFloat(e.amount) || 0),
      0,
    );
    const totalAmount = Number(bill.totalAmount);
    const newRemainingAmount = Math.max(0, totalAmount - newPaidAmount);

    // For advancePaid: usually it's the first 'booking' or first payment
    // We'll keep it as the first entry's amount if it was a booking, or similar logic
    let newAdvancePaid = Number(bill.advancePaid);
    const firstEntry = newHistory[0];
    if (
      firstEntry &&
      (firstEntry.source === "booking" || firstEntry.source === "initial")
    ) {
      newAdvancePaid = parseFloat(firstEntry.amount) || 0;
    }

    const updatedBill = await prisma.$transaction(async (tx) => {
      const b = await tx.bill.update({
        where: { id: billId },
        data: {
          paidAmount: newPaidAmount,
          advancePaid: newAdvancePaid,
          remainingAmount: newRemainingAmount,
          paymentHistory: newHistory,
          status:
            newRemainingAmount <= 0
              ? "paid"
              : newPaidAmount > 0
                ? "partial"
                : "pending",
        },
      });

      if (bill.orderId) {
        await tx.order.update({
          where: { id: bill.orderId },
          data: {
            advancePaid: newAdvancePaid,
            remainingAmount: newRemainingAmount,
          },
        });
      }
      return b;
    });

    return NextResponse.json(transformDecimal(updatedBill));
  } catch (error: any) {
    console.error("Ledger update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id: billId } = params;
    const { entryId } = await request.json();

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { order: true },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const paymentHistory = (bill.paymentHistory as any[]) || [];
    const newHistory = paymentHistory.filter((e) => e.id !== entryId);

    if (newHistory.length === paymentHistory.length) {
      return NextResponse.json(
        { error: "Ledger entry not found" },
        { status: 404 },
      );
    }

    // Recalculate totals
    const newPaidAmount = newHistory.reduce(
      (sum, e) => sum + (parseFloat(e.amount) || 0),
      0,
    );
    const totalAmount = Number(bill.totalAmount);
    const newRemainingAmount = Math.max(0, totalAmount - newPaidAmount);

    let newAdvancePaid = Number(bill.advancePaid);
    const firstEntry = newHistory[0];
    if (
      firstEntry &&
      (firstEntry.source === "booking" || firstEntry.source === "initial")
    ) {
      newAdvancePaid = parseFloat(firstEntry.amount) || 0;
    } else if (newHistory.length === 0) {
      newAdvancePaid = 0;
    }

    const updatedBill = await prisma.$transaction(async (tx) => {
      const b = await tx.bill.update({
        where: { id: billId },
        data: {
          paidAmount: newPaidAmount,
          advancePaid: newAdvancePaid,
          remainingAmount: newRemainingAmount,
          paymentHistory: newHistory,
          status:
            newRemainingAmount <= 0
              ? "paid"
              : newPaidAmount > 0
                ? "partial"
                : "pending",
        },
      });

      if (bill.orderId) {
        await tx.order.update({
          where: { id: bill.orderId },
          data: {
            advancePaid: newAdvancePaid,
            remainingAmount: newRemainingAmount,
          },
        });
      }
      return b;
    });

    return NextResponse.json(transformDecimal(updatedBill));
  } catch (error: any) {
    console.error("Ledger delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
