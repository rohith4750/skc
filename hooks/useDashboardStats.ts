"use client";

import { useEffect, useState, useMemo } from "react";
import { Storage } from "@/lib/storage-api";
import { fetchWithLoader } from "@/lib/fetch-with-loader";
import { isSuperAdmin } from "@/lib/auth";
import { getOrderDate } from "@/lib/utils";
import { type DashboardStats } from "@/config/pages/dashboard-page-config";

export function useDashboardStats(
  selectedMonth: number,
  selectedYear: number,
  selectedDate: string,
  chefMonth: number,
  chefYear: number
) {
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    menuItems: 0,
    orders: 0,
    bills: 0,
    expenses: 0,
    users: 0,
    workforce: 0,
    stockItems: 0,
    lowStockItems: 0,
    inventoryItems: 0,
    totalCollected: 0,
    totalExpenses: 0,
    totalBilled: 0,
    totalReceivable: 0,
    avgOrderValue: 0,
    profitMargin: 0,
    collectionRate: 0,
    pendingOrders: 0,
    completedOrders: 0,
    paidBills: 0,
    pendingBills: 0,
    pendingExpenses: 0,
    outstandingExpenses: 0,
    avgRevenuePerPlate: 0,
    avgCostPerPlate: 0,
    avgProfitPerPlate: 0,
    totalPlates: 0,
    chefSummary: 0,
    chefCostPerPlate: 0,
    chefPlateType: '',
    ChefTotalAmount: 0,
    topItems: [],
  });
  const [loading, setLoading] = useState(true);
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false);

  useEffect(() => {
    setIsSuperAdminUser(isSuperAdmin());
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [customers, menuItems, rawOrders, rawBills, rawExpenses] =
          await Promise.all([
            Storage.getCustomers(),
            Storage.getMenuItems(),
            Storage.getOrders(),
            Storage.getBills(),
            Storage.getExpenses(),
          ]);

        // Filter by catering date (eventDate)
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
            const name = item.menuItemName || menuItemsMap[item.menuItemId] || 'Unknown Item';
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
            const [usersRes, workforceRes, stockRes, inventoryRes] = await Promise.all([
              fetchWithLoader("/api/users"),
              fetchWithLoader("/api/workforce"),
              fetchWithLoader("/api/stock"),
              fetchWithLoader("/api/inventory"),
            ]);
            if (usersRes.ok) adminStats.users = (await usersRes.json()).length;
            if (workforceRes.ok) {
              const workforceData = await workforceRes.json();
              adminStats.workforce = Array.isArray(workforceData) ? workforceData.length : (workforceData.workforce?.length || 0);
            }
            if (stockRes.ok) {
              const stockData = await stockRes.json();
              adminStats.stockItems = stockData.length;
              adminStats.lowStockItems = stockData.filter((item: any) => item.minStock !== null && (item.currentStock || 0) <= item.minStock).length;
            }
            if (inventoryRes.ok) adminStats.inventoryItems = (await inventoryRes.json()).length;
          } catch (error) {
            console.error("Error fetching admin stats:", error);
          }
        }

        setStats({
          customers: customers.length,
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
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [isSuperAdminUser, selectedMonth, selectedYear, selectedDate, chefMonth, chefYear]);

  return { stats, loading, isSuperAdminUser };
}
