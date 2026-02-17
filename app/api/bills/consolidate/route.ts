import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const { customerId, orderIds } = await request.json();

    if (!customerId || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        customerId: customerId,
        ...({ billId: null } as any),
      },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "No valid unbilled orders found" },
        { status: 400 },
      );
    }

    const totalAmount = orders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );
    const totalAdvance = orders.reduce(
      (sum, o) => sum + Number(o.advancePaid),
      0,
    );
    const remainingAmount = Math.max(0, totalAmount - totalAdvance);

    const eventDates = orders.map((o) => o.eventDate).filter(Boolean) as Date[];
    const startDate =
      eventDates.length > 0
        ? new Date(Math.min(...eventDates.map((d) => d.getTime())))
        : null;
    const endDate =
      eventDates.length > 0
        ? new Date(Math.max(...eventDates.map((d) => d.getTime())))
        : null;

    const result = await prisma.$transaction(async (tx) => {
      // Create the consolidated bill
      const bill = await tx.bill.create({
        data: {
          customerId,
          totalAmount,
          advancePaid: totalAdvance,
          paidAmount: totalAdvance,
          remainingAmount,
          status:
            remainingAmount <= 0
              ? "paid"
              : totalAdvance > 0
                ? "partial"
                : "pending",
          startDate,
          endDate,
          paymentHistory:
            totalAdvance > 0
              ? [
                  {
                    amount: totalAdvance,
                    totalPaid: totalAdvance,
                    remainingAmount,
                    status: remainingAmount <= 0 ? "paid" : "partial",
                    date: new Date().toISOString(),
                    source: "consolidation",
                    method: "mixed",
                    notes: "Consolidated from multiple orders",
                  },
                ]
              : [],
        } as any,
      });

      // Link orders to the bill
      await (tx.order as any).updateMany({
        where: { id: { in: orders.map((o) => o.id) } },
        data: { billId: bill.id },
      });

      return bill;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Consolidation error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
