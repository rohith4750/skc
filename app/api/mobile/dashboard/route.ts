import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { transformDecimal } from "@/lib/decimal-utils";
import { OrderStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`[DashboardAPI] Fetching stats for date range: ${today.toISOString()} to ${tomorrow.toISOString()}`);

    const [
      customersCount,
      stockCount,
      ordersCount,
      billsCount,
      todayOrders,
      activeOrdersCount,
      todayStats,
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
            lt: tomorrow,
          },
        },
      }),
      prisma.order.count({
        where: {
          status: {
            notIn: [OrderStatus.completed, OrderStatus.cancelled]
          }
        }
      }),
      prisma.bill.aggregate({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        _sum: {
          paidAmount: true,
          totalAmount: true,
          remainingAmount: true,
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

    const stats = {
      customers: customersCount,
      stock: stockCount,
      orders: ordersCount,
      bills: billsCount,
      todayOrders,
      activeOrders: activeOrdersCount,
      todayRevenue: Number(todayStats._sum.paidAmount || 0),
      todayTotalAmount: Number(todayStats._sum.totalAmount || 0),
      todayPendingAmount: Number(todayStats._sum.remainingAmount || 0),
      outstanding: Number(outstandingAmount._sum.remainingAmount || 0),
    };

    console.log(`[DashboardAPI] Response Stats:`, stats);

    return NextResponse.json(transformDecimal({
      stats,
      recentOrders,
    }));
  } catch (error) {
    console.error("Error fetching mobile dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
