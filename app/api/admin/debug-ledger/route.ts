import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const bills = await prisma.bill.findMany();
    const billsWithMissingIds = bills.filter((bill) => {
      if (!bill.paymentHistory || !Array.isArray(bill.paymentHistory))
        return false;
      return (bill.paymentHistory as any[]).some((entry) => !entry.id);
    });

    return NextResponse.json({
      count: billsWithMissingIds.length,
      sample:
        billsWithMissingIds.length > 0
          ? {
              id: billsWithMissingIds[0].id,
              history: billsWithMissingIds[0].paymentHistory,
            }
          : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    );
  }
}
