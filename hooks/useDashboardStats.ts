"use client";

import { useEffect, useState } from "react";
import { fetchWithLoader } from "@/lib/fetch-with-loader";
import { isSuperAdmin } from "@/lib/auth";
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
        const queryParams = new URLSearchParams({
          month: String(selectedMonth),
          year: String(selectedYear),
          date: selectedDate,
          chefMonth: String(chefMonth),
          chefYear: String(chefYear),
        });

        const res = await fetchWithLoader(`/api/dashboard/kpis?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          console.error("Failed to fetch dashboard stats from API");
        }
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
