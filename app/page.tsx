"use client";
import { getOrderDate } from '@/lib/utils';
import { useEffect, useState } from "react";
import { Storage } from "@/lib/storage-api";
import { fetchWithLoader } from "@/lib/fetch-with-loader";
import Link from "next/link";
import { isSuperAdmin, getUserRole } from "@/lib/auth";
import {
  DASHBOARD_ADMIN_LANDING_CARDS,
  DASHBOARD_MONTH_OPTIONS,
  DASHBOARD_OPERATIONAL_ALERT_ICON,
  DASHBOARD_QUICK_ACTIONS,
  DASHBOARD_SUPER_ADMIN_QUICK_ACTIONS,
  DASHBOARD_YEAR_OPTIONS,
  getDashboardAdminStatCards,
  getDashboardAnalyticsCards,
  getDashboardMainStatCards,
  getDashboardSuperAdminAlerts,
  getDashboardSuperAdminHighlights,
  type DashboardStats,
} from "@/config/pages/dashboard-page-config";

export default function Dashboard() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(getUserRole());
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [chefMonth, setChefMonth] = useState(new Date().getMonth() + 1);
  const [chefYear, setChefYear] = useState(new Date().getFullYear());
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
          o.status !== 'cancelled' && filterByMonthYear(getOrderDate(o)),
        );
        const bills = rawBills.filter((b: any) =>
          b.order?.status !== 'cancelled' && filterByMonthYear(b.order?.eventDate || b.createdAt),
        );
        const expenses = rawExpenses.filter((e: any) =>
          e.order?.status !== 'cancelled' && filterByMonthYear(e.paymentDate),
        );

        // Calculate financial stats
        const totalCollected = bills.reduce(
          (sum: number, bill: any) => sum + (parseFloat(bill.paidAmount) || 0),
          0,
        );
        const totalExpenses = expenses.reduce(
          (sum: number, expense: any) =>
            sum + (parseFloat(expense.amount) || 0),
          0,
        );
        const totalBilled = bills.reduce(
          (sum: number, bill: any) => sum + (parseFloat(bill.totalAmount) || 0),
          0,
        );
        const totalReceivable = bills.reduce(
          (sum: number, bill: any) =>
            sum + (parseFloat(bill.remainingAmount) || 0),
          0,
        );
        const avgOrderValue =
          orders.length > 0 ? totalBilled / orders.length : 0;
        const profitMargin =
          totalBilled > 0
            ? ((totalBilled - totalExpenses) / totalBilled) * 100
            : 0;
        const collectionRate =
          totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

        // Order status counts
        const pendingOrders = orders.filter(
          (o: any) => o.status === "pending" || o.status === "in_progress",
        ).length;
        const completedOrders = orders.filter(
          (o: any) => o.status === "completed",
        ).length;

        // Bill status counts
        const paidBills = bills.filter((b: any) => b.status === "paid").length;
        const pendingBills = bills.filter(
          (b: any) => b.status === "pending" || b.status === "partial",
        ).length;
        const pendingExpensesList = expenses.filter((expense: any) => {
          if (expense.paymentStatus) {
            return expense.paymentStatus !== "paid";
          }
          return (
            (parseFloat(expense.paidAmount) || 0) <
            (parseFloat(expense.amount) || 0)
          );
        });
        const pendingExpenses = pendingExpensesList.length;
        const outstandingExpenses = pendingExpensesList.reduce(
          (sum: number, expense: any) => {
            const amount = parseFloat(expense.amount) || 0;
            const paidAmount = parseFloat(expense.paidAmount) || 0;
            return sum + Math.max(0, amount - paidAmount);
          },
          0,
        );

        // --- P&L PER PLATE CALCULATIONS ---
        let totalPlates = 0;
        let totalRevenueForPlates = 0;
        let totalCostForPlates = 0;

        orders.forEach((order: any) => {
          const members = parseInt(order.numberOfMembers) || 0;
          if (members > 0) {
            totalPlates += members;
            totalRevenueForPlates += parseFloat(order.totalAmount) || 0;

            // Sum all expenses specifically linked to this order
            const orderExpenses = rawExpenses.filter((e: any) => e.orderId === order.id);
            const totalOrderExpense = orderExpenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);
            totalCostForPlates += totalOrderExpense;
          }
        });

        const avgRevenuePerPlate = totalPlates > 0 ? totalRevenueForPlates / totalPlates : 0;
        const avgCostPerPlate = totalPlates > 0 ? totalCostForPlates / totalPlates : 0;
        const avgProfitPerPlate = avgRevenuePerPlate - avgCostPerPlate;

        // --- CHEF ANALYTICS ---
        const chefExpenses = rawExpenses.filter((e: any) => {
          if (e.category !== "chef") return false;
          const d = new Date(e.paymentDate);
          return d.getMonth() + 1 === chefMonth && d.getFullYear() === chefYear;
        });
        const ChefTotalAmount = chefExpenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);
        const uniqueChefs = new Set(chefExpenses.map((e: any) => e.recipient).filter(Boolean));
        const chefSummary = uniqueChefs.size;
        const chefCostPerPlate = totalPlates > 0 ? ChefTotalAmount / totalPlates : 0;

        // Find top chef by total paid amount
        const chefPayments: Record<string, number> = {};
        chefExpenses.forEach((e: any) => {
          const name = e.recipient || "Unknown";
          chefPayments[name] = (chefPayments[name] || 0) + (parseFloat(e.amount) || 0);
        });
        const topChef = Object.entries(chefPayments).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        const chefPlateType = topChef;

        // --- TOP SELLING ITEMS ANALYTICS ---
        const itemCounts: Record<string, number> = {};
        const menuItemsMap: Record<string, string> = {};
        menuItems.forEach((m: any) => {
          menuItemsMap[m.id] = m.name;
        });

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

        // Get user and workforce counts (only for super admin)
        let usersCount = 0;
        let workforceCount = 0;
        let stockItems = 0;
        let lowStockItems = 0;
        let inventoryItems = 0;
        if (isSuperAdminUser) {
          try {
            const [usersRes, workforceRes, stockRes, inventoryRes] =
              await Promise.all([
                fetchWithLoader("/api/users"),
                fetchWithLoader("/api/workforce"),
                fetchWithLoader("/api/stock"),
                fetchWithLoader("/api/inventory"),
              ]);
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              usersCount = usersData.length;
            }
            if (workforceRes.ok) {
              const workforceData = await workforceRes.json();
              workforceCount = Array.isArray(workforceData) ? workforceData.length : (workforceData.workforce?.length || 0);
            }
            if (stockRes.ok) {
              const stockData = await stockRes.json();
              stockItems = stockData.length;
              lowStockItems = stockData.filter((item: any) => {
                if (item.minStock === null || item.minStock === undefined)
                  return false;
                return (item.currentStock || 0) <= item.minStock;
              }).length;
            }
            if (inventoryRes.ok) {
              const inventoryData = await inventoryRes.json();
              inventoryItems = inventoryData.length;
            }
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
          users: usersCount,
          workforce: workforceCount,
          stockItems,
          lowStockItems,
          inventoryItems,
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
          avgProfitPerPlate,
          totalPlates,
          chefSummary,
          chefCostPerPlate,
          chefPlateType,
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

  const mainStatCards = getDashboardMainStatCards(stats);
  const adminStatCards = getDashboardAdminStatCards(stats, isSuperAdminUser);
  const analyticsCards = getDashboardAnalyticsCards(stats);
  const superAdminHighlights = getDashboardSuperAdminHighlights(
    stats,
    isSuperAdminUser,
  );
  const superAdminAlerts = getDashboardSuperAdminAlerts(stats, isSuperAdminUser);

  // Simple landing page for admin users
  if (userRole === "admin" && !isSuperAdminUser) {
    return (
      <div className="p-3 sm:p-4 md:p-5 lg:p-5 xl:p-6 pt-12 sm:pt-14 lg:pt-5 xl:pt-6 min-h-screen bg-gray-50">
        <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center sm:text-left">
            Welcome
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-1.5 md:mt-2 text-sm sm:text-base text-center sm:text-left">
            Select an option to continue
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 max-w-5xl">
          {DASHBOARD_ADMIN_LANDING_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="bg-white rounded-xl shadow-md hover:shadow-xl active:scale-[0.98] transition-all duration-200 p-4 sm:p-5 md:p-6 group touch-manipulation"
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`${card.color} p-3 sm:p-4 rounded-full mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-5 lg:p-5 xl:p-6 pt-12 sm:pt-14 lg:pt-5 xl:pt-6">
      <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center sm:text-left">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-1.5 md:mt-2 text-xs sm:text-sm md:text-base text-center sm:text-left">
            {isSuperAdminUser
              ? "Complete Business Analytics & Management Overview"
              : "Business Overview"}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-2 z-10">
          {/* Specific Date Filter */}
          <div className="flex items-center bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-800"
                title="Clear Specific Date"
              >
                ✕
              </button>
            )}
          </div>

          {/* Month/Year Selector */}
          <div className={`flex items-center justify-center sm:justify-end gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 transition-opacity duration-300 ${selectedDate ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-sm font-bold text-gray-700 outline-none px-2 py-1 cursor-pointer"
            >
              {DASHBOARD_MONTH_OPTIONS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-sm font-bold text-gray-700 outline-none px-2 py-1 cursor-pointer"
            >
              {DASHBOARD_YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 lg:mb-8">
        {mainStatCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-primary-100 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  {stat.subValue && (
                    <p className="text-xs font-medium text-gray-400 mt-1">
                      {stat.subValue}
                    </p>
                  )}
                </div>
                <div
                  className={`${stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Admin Statistics Cards */}
      {isSuperAdminUser && adminStatCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 mb-6 lg:mb-8">
          {adminStatCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.title}
                href={stat.href}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-primary-100 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`${stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium">
                      {stat.title}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {analyticsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-50 p-2.5 rounded-xl">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  {card.title}
                </h2>
              </div>
              <div className="space-y-4">
                {card.items.map((item, idx) => {
                  const ItemIcon = "icon" in item ? item.icon : null;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between group"
                    >
                      <span className="text-sm font-medium text-gray-500">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {ItemIcon && (
                          <ItemIcon className={`w-3.5 h-3.5 ${item.color}`} />
                        )}
                        <span className={`text-sm font-bold ${item.color}`}>
                          {item.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {isSuperAdminUser && superAdminHighlights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {superAdminHighlights.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                      {card.title}
                    </h3>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                  </div>
                  <p className={`text-2xl font-black ${card.color}`}>
                    {card.value}
                  </p>
                </div>
                <p className="text-xs font-medium text-gray-400 mt-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                  {card.note}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {isSuperAdminUser && superAdminAlerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-50 p-2 rounded-xl">
              <DASHBOARD_OPERATIONAL_ALERT_ICON className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              Operational Alerts
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {superAdminAlerts.map((alert) => (
              <div
                key={alert.label}
                className="bg-gray-50/50 rounded-xl p-4 border border-gray-50"
              >
                <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-tight">
                  {alert.label}
                </p>
                <p className={`text-lg font-bold ${alert.color}`}>
                  {alert.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Chef Summary Analytics */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2.5 rounded-xl">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800">Chef Summary (Per Plate)</h2>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
            <select
              value={chefMonth}
              onChange={(e) => setChefMonth(parseInt(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-600 outline-none px-2 py-1 cursor-pointer"
            >
              {DASHBOARD_MONTH_OPTIONS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <div className="w-px h-4 bg-slate-200"></div>
            <select
              value={chefYear}
              onChange={(e) => setChefYear(parseInt(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-600 outline-none px-2 py-1 cursor-pointer"
            >
              {DASHBOARD_YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-bold text-blue-400 uppercase mb-2 tracking-tight">Total Chef Payments</p>
            <p className="text-lg font-bold text-blue-700">₹{stats.ChefTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
            <p className="text-xs font-bold text-red-400 uppercase mb-2 tracking-tight">Avg Chef Cost / Plate</p>
            <p className="text-lg font-bold text-red-700">₹{stats.chefCostPerPlate.toFixed(2)}</p>
          </div>
          <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
            <p className="text-xs font-bold text-green-400 uppercase mb-2 tracking-tight">Active Chefs</p>
            <p className="text-lg font-bold text-green-700">{stats.chefSummary}</p>
          </div>
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-tight">Top Paid Chef</p>
            <p className="text-lg font-bold text-gray-700 truncate" title={stats.chefPlateType}>{stats.chefPlateType}</p>
          </div>
        </div>
      </div>

      {/* Profit & Loss per Plate Analytics */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-50 p-2.5 rounded-xl">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800">Profit & Loss (Per Plate)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-bold text-blue-400 uppercase mb-2 tracking-tight">Avg Revenue / Plate</p>
            <p className="text-lg font-bold text-blue-700">₹{stats.avgRevenuePerPlate.toFixed(2)}</p>
          </div>
          <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
            <p className="text-xs font-bold text-red-400 uppercase mb-2 tracking-tight">Avg Cost / Plate</p>
            <p className="text-lg font-bold text-red-700">₹{stats.avgCostPerPlate.toFixed(2)}</p>
          </div>
          <div className={`rounded-xl p-4 border ${stats.avgProfitPerPlate >= 0 ? 'bg-green-50/50 border-green-100' : 'bg-orange-50/50 border-orange-100'}`}>
            <p className={`text-xs font-bold uppercase mb-2 tracking-tight ${stats.avgProfitPerPlate >= 0 ? 'text-green-400' : 'text-orange-400'}`}>Avg Profit / Plate</p>
            <p className={`text-lg font-bold ${stats.avgProfitPerPlate >= 0 ? 'text-green-700' : 'text-orange-700'}`}>₹{stats.avgProfitPerPlate.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-tight">Total Plates (Filtered)</p>
            <p className="text-lg font-bold text-gray-700">{stats.totalPlates}</p>
          </div>
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 p-2.5 rounded-xl">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800">Most Selling Menu Items</h2>
          </div>
          <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">BASED ON ORDER FREQUENCY</div>
        </div>
        
        {stats.topItems && stats.topItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.topItems.map((item, idx) => (
              <div key={idx} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 group hover:border-amber-200 hover:bg-white hover:shadow-xl hover:shadow-amber-500/5 transition-all cursor-default">
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-[10px] font-black px-2 py-0.5 rounded ${item.color.replace('text-', 'bg-').replace('-600', '-100')} ${item.color}`}>#{idx + 1}</div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.count} Orders</span>
                </div>
                <p className="text-sm font-bold text-slate-700 leading-tight mb-4 min-h-[2.5rem] flex items-center">{item.name}</p>
                <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.color.replace('text-', 'bg-')}`}
                    style={{ width: `${(item.count / stats.topItems[0].count) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <svg className="w-8 h-8 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-400 text-sm font-medium">No sales data available for this period</p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-6 font-display">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {DASHBOARD_QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href} className={action.className}>
                <Icon className={action.iconClassName} />
                <p className="text-sm font-bold text-gray-700">{action.label}</p>
              </Link>
            );
          })}
          {isSuperAdminUser && (
            <>
              {DASHBOARD_SUPER_ADMIN_QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href} className={action.className}>
                    <Icon className={action.iconClassName} />
                    <p className="text-sm font-bold text-gray-700">{action.label}</p>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
