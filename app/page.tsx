"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserRole } from "@/lib/auth";
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
} from "@/config/pages/dashboard-page-config";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { StatCard } from "@/components/dashboard/StatCard";
import { AnalyticsSection } from "@/components/dashboard/AnalyticsSection";

export default function Dashboard() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [chefMonth, setChefMonth] = useState(new Date().getMonth() + 1);
  const [chefYear, setChefYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setUserRole(getUserRole());
  }, []);

  const { stats, loading, isSuperAdminUser } = useDashboardStats(
    selectedMonth,
    selectedYear,
    selectedDate,
    chefMonth,
    chefYear
  );

  const mainStatCards = getDashboardMainStatCards(stats);
  const adminStatCards = getDashboardAdminStatCards(stats, isSuperAdminUser);
  const analyticsCards = getDashboardAnalyticsCards(stats);
  const superAdminHighlights = getDashboardSuperAdminHighlights(stats, isSuperAdminUser);
  const superAdminAlerts = getDashboardSuperAdminAlerts(stats, isSuperAdminUser);

  // Landing page for admin users (simplified)
  if (userRole === "admin" && !isSuperAdminUser) {
    return (
      <div className="p-6 pt-20 min-h-screen bg-gray-50 animate-fade-in">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Choose an action to manage your catering business
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
          {DASHBOARD_ADMIN_LANDING_CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="glass card-premium p-8 rounded-3xl group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`${card.color} p-5 rounded-2xl mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-500 font-medium text-sm">
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
    <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 bg-gray-50/50 min-h-screen">
      {/* Header & Filters */}
      <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            {isSuperAdminUser
              ? "Comprehensive Business Intelligence & Operations"
              : "Daily Operations Overview"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 animate-fade-in">
          {/* Specific Date Filter */}
          <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2 border-white/40 shadow-sm">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate('')} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
            )}
          </div>

          {/* Month/Year Selector */}
          <div className={`glass px-2 py-1 rounded-2xl flex items-center gap-1 border-white/40 shadow-sm transition-opacity ${selectedDate ? 'opacity-30 pointer-events-none' : ''}`}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-sm font-bold text-gray-700 outline-none px-3 py-1.5 cursor-pointer"
            >
              {DASHBOARD_MONTH_OPTIONS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <div className="w-px h-4 bg-gray-200"></div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-sm font-bold text-gray-700 outline-none px-3 py-1.5 cursor-pointer"
            >
              {DASHBOARD_YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {mainStatCards.map((stat, i) => (
          <StatCard key={stat.title} {...stat} index={i} />
        ))}
      </div>

      {/* Admin Specific Stats */}
      {isSuperAdminUser && adminStatCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {adminStatCards.map((stat, i) => (
            <StatCard key={stat.title} {...stat} index={i + 4} />
          ))}
        </div>
      )}

      {/* Analytics Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
        {analyticsCards.map((card, i) => (
          <AnalyticsSection key={card.title} {...card} index={i} />
        ))}
      </div>

      {/* Super Admin Highlights */}
      {isSuperAdminUser && superAdminHighlights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {superAdminHighlights.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="glass p-6 rounded-3xl card-premium flex flex-col justify-between animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{card.title}</h3>
                  <div className="bg-gray-50 p-2 rounded-xl shadow-inner"><Icon className={`w-4 h-4 ${card.color}`} /></div>
                </div>
                <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <p className="text-xs font-bold text-gray-400">{card.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Operational Alerts */}
      {isSuperAdminUser && superAdminAlerts.length > 0 && (
        <div className="glass rounded-[2rem] p-8 mb-10 border-orange-100/50 bg-gradient-to-br from-white to-orange-50/30 animate-fade-in">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-200">
              <DASHBOARD_OPERATIONAL_ALERT_ICON className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Operational Alerts</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {superAdminAlerts.map((alert) => (
              <div key={alert.label} className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white shadow-sm hover:shadow-md transition-all">
                <p className="text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">{alert.label}</p>
                <p className={`text-2xl font-black ${alert.color}`}>{alert.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chef & P&L Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Chef Summary */}
        <div className="glass rounded-[2rem] p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2.5 rounded-xl shadow-lg shadow-green-100">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Chef Summary</h2>
            </div>
            <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-xl">
              <select value={chefMonth} onChange={(e) => setChefMonth(parseInt(e.target.value))} className="bg-transparent text-[10px] font-black px-2 py-1 outline-none">
                {DASHBOARD_MONTH_OPTIONS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select value={chefYear} onChange={(e) => setChefYear(parseInt(e.target.value))} className="bg-transparent text-[10px] font-black px-2 py-1 outline-none">
                {DASHBOARD_YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Total Payments</p>
              <p className="text-xl font-black text-blue-700">₹{stats.ChefTotalAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100">
              <p className="text-[10px] font-black text-red-400 uppercase mb-1">Cost / Plate</p>
              <p className="text-xl font-black text-red-700">₹{stats.chefCostPerPlate.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* P&L Summary */}
        <div className="glass rounded-[2rem] p-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-500 p-2.5 rounded-xl shadow-lg shadow-indigo-100">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">P&L Analysis</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-5 rounded-2xl border ${stats.avgProfitPerPlate >= 0 ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
              <p className={`text-[10px] font-black uppercase mb-1 ${stats.avgProfitPerPlate >= 0 ? 'text-green-400' : 'text-red-400'}`}>Avg Profit / Plate</p>
              <p className={`text-xl font-black ${stats.avgProfitPerPlate >= 0 ? 'text-green-700' : 'text-red-700'}`}>₹{stats.avgProfitPerPlate.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Plates</p>
              <p className="text-xl font-black text-gray-700">{stats.totalPlates}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass rounded-[2rem] p-8 animate-fade-in">
        <h2 className="text-2xl font-black text-gray-800 mb-8 tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {DASHBOARD_QUICK_ACTIONS.concat(isSuperAdminUser ? DASHBOARD_SUPER_ADMIN_QUICK_ACTIONS : []).map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href} className={`${action.className} !bg-white/50 backdrop-blur-sm border-white !shadow-sm hover:!shadow-xl transition-all rounded-3xl p-6`}>
                <div className="bg-white p-3 rounded-2xl shadow-sm mb-3 mx-auto w-fit group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <p className="text-sm font-black text-gray-700">{action.label}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
