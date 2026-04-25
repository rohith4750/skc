import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { transformDecimal } from "@/lib/decimal-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      customersCount,
      stockCount,
      ordersCount,
      billsCount,
      todayOrders,
      todayRevenue,
      outstandingAmount,
      recentOrders
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.stock.count(),
      prisma.order.count(),
      prisma.bill.count(),
      prisma.order.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      prisma.bill.aggregate({
        where: {
          createdAt: {
            gte: today,
          },
        },
        _sum: {
          paidAmount: true,
        },
      }),
      prisma.bill.aggregate({
        _sum: {
          remainingAmount: true,
        },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          customer: true,
        },
      }),
    ]);

    return NextResponse.json(transformDecimal({
      stats: {
        customers: customersCount,
        stock: stockCount,
        orders: ordersCount,
        bills: billsCount,
        todayOrders,
        todayRevenue: todayRevenue._sum.paidAmount || 0,
        outstanding: outstandingAmount._sum.remainingAmount || 0,
      },
      recentOrders,
    }));
  } catch (error) {
    console.error("Error fetching mobile dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
