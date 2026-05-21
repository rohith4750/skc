import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { transformDecimal } from "@/lib/decimal-utils";
import { getOrderDate } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const selectedMonth = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const selectedYear = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const selectedDate = searchParams.get("date") || "";
    const chefMonth = parseInt(searchParams.get("chefMonth") || String(new Date().getMonth() + 1));
    const chefYear = parseInt(searchParams.get("chefYear") || String(new Date().getFullYear()));

    const isSuperAdminUser = auth.payload.role === "super_admin";

    // Helper to check if a date matches the active filter
    const filterByMonthYear = (itemDate: string | Date | null) => {
      if (!itemDate) return false;
      const d = new Date(itemDate);

      if (selectedDate) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}` === selectedDate;
      }

      return (
        d.getMonth() + 1 === selectedMonth &&
        d.getFullYear() === selectedYear
      );
    };

    // 1. Parallel fetch basic counts and lists
    const [customersCount, menuItems, rawOrdersDb, rawBillsDb, rawExpensesDb] =
      await Promise.all([
        prisma.customer.count(),
        prisma.menuItem.findMany({ select: { id: true, name: true } }),
        prisma.order.findMany({
          select: {
            id: true,
            status: true,
            eventDate: true,
            createdAt: true,
            totalAmount: true,
            numberOfMembers: true,
            items: {
              select: {
                menuItemId: true,
              },
            },
          },
        }),
        prisma.bill.findMany({
          select: {
            id: true,
            status: true,
            paidAmount: true,
            totalAmount: true,
            remainingAmount: true,
            createdAt: true,
            order: {
              select: {
                status: true,
                eventDate: true,
                createdAt: true,
              },
            },
          },
        }),
        prisma.expense.findMany({
          select: {
            id: true,
            amount: true,
            paidAmount: true,
            paymentStatus: true,
            category: true,
            paymentDate: true,
            createdAt: true,
            orderId: true,
            recipient: true,
            order: {
              select: {
                status: true,
              },
            },
          },
        }),
      ]);

    const rawOrders = transformDecimal(rawOrdersDb);
    const rawBills = transformDecimal(rawBillsDb);
    const rawExpenses = transformDecimal(rawExpensesDb);

    // Filter datasets
    const orders = rawOrders.filter((o: any) =>
      o.status !== 'cancelled' && filterByMonthYear(getOrderDate(o))
    );
    const bills = rawBills.filter((b: any) =>
      b.order?.status !== 'cancelled' && filterByMonthYear(b.order?.eventDate || b.createdAt)
    );
    const expenses = rawExpenses.filter((e: any) =>
      e.order?.status !== 'cancelled' && filterByMonthYear(e.paymentDate)
    );

    // Financial calculations
    const totalCollected = bills.reduce((sum: number, bill: any) => sum + (parseFloat(bill.paidAmount) || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + (parseFloat(expense.amount) || 0), 0);
    const totalBilled = bills.reduce((sum: number, bill: any) => sum + (parseFloat(bill.totalAmount) || 0), 0);
    const totalReceivable = bills.reduce((sum: number, bill: any) => sum + (parseFloat(bill.remainingAmount) || 0), 0);

    const avgOrderValue = orders.length > 0 ? totalBilled / orders.length : 0;
    const profitMargin = totalBilled > 0 ? ((totalBilled - totalExpenses) / totalBilled) * 100 : 0;
    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    const pendingOrders = orders.filter((o: any) => ["pending", "in_progress"].includes(o.status)).length;
    const completedOrders = orders.filter((o: any) => o.status === "completed").length;

    const paidBills = bills.filter((b: any) => b.status === "paid").length;
    const pendingBills = bills.filter((b: any) => ["pending", "partial"].includes(b.status)).length;

    const pendingExpensesList = expenses.filter((e: any) => {
      if (e.paymentStatus) return e.paymentStatus !== "paid";
      return (parseFloat(e.paidAmount) || 0) < (parseFloat(e.amount) || 0);
    });
    const pendingExpenses = pendingExpensesList.length;
    const outstandingExpenses = pendingExpensesList.reduce((sum: number, e: any) => {
      const amount = parseFloat(e.amount) || 0;
      const paidAmount = parseFloat(e.paidAmount) || 0;
      return sum + Math.max(0, amount - paidAmount);
    }, 0);

    // P&L Per Plate
    let totalPlates = 0;
    let totalRevenueForPlates = 0;
    let totalCostForPlates = 0;

    orders.forEach((order: any) => {
      const members = parseInt(order.numberOfMembers) || 0;
      if (members > 0) {
        totalPlates += members;
        totalRevenueForPlates += parseFloat(order.totalAmount) || 0;
        const orderExpenses = rawExpenses.filter((e: any) => e.orderId === order.id);
        totalCostForPlates += orderExpenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);
      }
    });

    const avgRevenuePerPlate = totalPlates > 0 ? totalRevenueForPlates / totalPlates : 0;
    const avgCostPerPlate = totalPlates > 0 ? totalCostForPlates / totalPlates : 0;

    // Chef Analytics
    const chefExpenses = rawExpenses.filter((e: any) => {
      if (e.category !== "chef") return false;
      const d = new Date(e.paymentDate);
      return d.getMonth() + 1 === chefMonth && d.getFullYear() === chefYear;
    });
    const ChefTotalAmount = chefExpenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);
    const uniqueChefs = new Set(chefExpenses.map((e: any) => e.recipient).filter(Boolean));
    const chefCostPerPlate = totalPlates > 0 ? ChefTotalAmount / totalPlates : 0;

    const chefPayments: Record<string, number> = {};
    chefExpenses.forEach((e: any) => {
      const name = e.recipient || "Unknown";
      chefPayments[name] = (chefPayments[name] || 0) + (parseFloat(e.amount) || 0);
    });
    const topChef = Object.entries(chefPayments).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Top Selling Items
    const itemCounts: Record<string, number> = {};
    const menuItemsMap: Record<string, string> = {};
    menuItems.forEach((m: any) => { menuItemsMap[m.id] = m.name; });

    rawOrders.forEach((order: any) => {
      if (order.status === 'cancelled') return;
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const name = menuItemsMap[item.menuItemId] || 'Unknown Item';
        itemCounts[name] = (itemCounts[name] || 0) + 1;
      });
    });

    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], index) => ({
        name,
        count,
        color: ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-pink-600'][index % 5]
      }));

    // Admin stats
    let adminStats = { users: 0, workforce: 0, stockItems: 0, lowStockItems: 0, inventoryItems: 0 };
    if (isSuperAdminUser) {
      try {
        const [usersCount, workforceCount, stockDataDb, inventoryCount] = await Promise.all([
          prisma.user.count(),
          prisma.workforce.count(),
          prisma.stock.findMany({
            select: {
              currentStock: true,
              minStock: true,
            },
          }),
          prisma.inventory.count(),
        ]);
        const stockData = transformDecimal(stockDataDb);
        adminStats.users = usersCount;
        adminStats.workforce = workforceCount;
        adminStats.stockItems = stockData.length;
        adminStats.lowStockItems = stockData.filter((item: any) => item.minStock !== null && (item.currentStock || 0) <= item.minStock).length;
        adminStats.inventoryItems = inventoryCount;
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      }
    }

    const responseData = {
      customers: customersCount,
      menuItems: menuItems.length,
      orders: orders.length,
      bills: bills.length,
      expenses: expenses.length,
      ...adminStats,
      totalCollected,
      totalExpenses,
      totalBilled,
      totalReceivable,
      avgOrderValue,
      profitMargin,
      collectionRate,
      pendingOrders,
      completedOrders,
      paidBills,
      pendingBills,
      pendingExpenses,
      outstandingExpenses,
      avgRevenuePerPlate,
      avgCostPerPlate,
      avgProfitPerPlate: avgRevenuePerPlate - avgCostPerPlate,
      totalPlates,
      chefSummary: uniqueChefs.size,
      chefCostPerPlate,
      chefPlateType: topChef,
      ChefTotalAmount,
      topItems,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Dashboard KPIs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard KPIs" },
      { status: 500 }
    );
  }
}
