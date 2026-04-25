import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { transformDecimal } from "@/lib/decimal-utils";
import { OrderStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    // Use IST timezone (UTC+5.5) for dashboard "Today" logic
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    
    const today = new Date(istNow);
    today.setUTCHours(0, 0, 0, 0);
    const startOfTodayIST = new Date(today.getTime() - istOffset);
    const endOfTodayIST = new Date(startOfTodayIST.getTime() + 24 * 60 * 60 * 1000);

    console.log(`[DashboardAPI] Fetching stats (IST relative): ${startOfTodayIST.toISOString()} to ${endOfTodayIST.toISOString()}`);

    const [
      customersCount,
      stockCount,
      ordersCount,
      billsCount,
      todayOrders,
      todayOrdersSum,
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
            gte: startOfTodayIST,
            lt: endOfTodayIST,
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startOfTodayIST,
            lt: endOfTodayIST,
          },
        },
        _sum: {
          totalAmount: true,
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
            gte: startOfTodayIST,
            lt: endOfTodayIST,
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
      // Today's Sales = Sum of all new Order totals created today
      todayTotalAmount: Number(todayOrdersSum._sum.totalAmount || 0),
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
