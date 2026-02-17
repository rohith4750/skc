import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    // Find all orders that don't have a bill and are NOT pending
    const unbilledOrders = await prisma.order.findMany({
      where: {
        ...({ billId: null } as any),
        status: {
          not: "pending",
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      } as any,
      orderBy: { eventDate: "asc" } as any,
    });

    // Group by customer
    const grouped: Record<string, { customer: any; orders: any[] }> = {};
    unbilledOrders.forEach((order) => {
      if (!grouped[order.customerId]) {
        grouped[order.customerId] = {
          customer: order.customer,
          orders: [],
        };
      }
      grouped[order.customerId].orders.push(order);
    });

    return NextResponse.json(Object.values(grouped));
  } catch (error) {
    console.error("Unbilled fetch error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
