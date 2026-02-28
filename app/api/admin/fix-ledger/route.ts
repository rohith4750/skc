import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const bills = await prisma.bill.findMany();
    let updatedBillsCount = 0;
    let totalEntriesFixed = 0;

    for (const bill of bills) {
      if (!bill.paymentHistory || !Array.isArray(bill.paymentHistory)) continue;

      let billNeedsUpdate = false;
      const history = bill.paymentHistory as any[];

      const newHistory = history.map((entry) => {
        if (!entry.id) {
          billNeedsUpdate = true;
          totalEntriesFixed++;
          return { ...entry, id: generateId() };
        }
        return entry;
      });

      if (billNeedsUpdate) {
        await prisma.bill.update({
          where: { id: bill.id },
          data: { paymentHistory: newHistory },
        });
        updatedBillsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedBillsCount} bills and fixed ${totalEntriesFixed} ledger entries.`,
      updatedBillsCount,
      totalEntriesFixed,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
