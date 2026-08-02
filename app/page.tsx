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
import { FaMapMarkerAlt } from "react-icons/fa";
import { formatCurrency } from "@/lib/utils";
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
          <div className="bg-white px-4 py-2 rounded-[4px] flex items-center gap-2 border border-slate-200 shadow-xs">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate('')} className="text-slate-400 hover:text-red-500 transition-colors">✕</button>
            )}
          </div>

          {/* Month/Year Selector */}
          <div className={`bg-white px-2 py-1 rounded-[4px] flex items-center gap-1 border border-slate-200 shadow-xs transition-opacity ${selectedDate ? 'opacity-30 pointer-events-none' : ''}`}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none px-3 py-1.5 cursor-pointer"
            >
              {DASHBOARD_MONTH_OPTIONS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <div className="w-px h-4 bg-slate-200"></div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none px-3 py-1.5 cursor-pointer"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {analyticsCards.map((card, i) => (
          <AnalyticsSection key={card.title} {...card} index={i} />
        ))}

        {/* Address / Location Analytics Card */}
        <div className="bg-white border border-indigo-200/90 shadow-sm hover:shadow-md transition-all duration-200 rounded-[4px] p-6 animate-fade-in relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2.5 rounded-[4px] border border-indigo-100 shadow-xs">
                <FaMapMarkerAlt className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                Top Order Locations
              </h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-[4px] border border-indigo-100">
              Address Analytics
            </span>
          </div>

          <div className="space-y-3 relative z-10">
            {!stats.topLocations || stats.topLocations.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-4 text-center">No location address data available yet</p>
            ) : (
              stats.topLocations.map((loc, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-[4px] bg-slate-50/80 border border-slate-100 hover:bg-slate-100/70 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-[4px] bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {loc.location}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {loc.orderCount} order(s) · {loc.percentage}% of total
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-600 flex-shrink-0">
                    {formatCurrency(loc.totalBilled)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Scheduled Event Destinations ("Where We Are Going") */}
      <div className="bg-white rounded-[4px] p-8 mb-10 border border-slate-200/90 shadow-sm animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-3 rounded-[4px] shadow-sm">
              <FaMapMarkerAlt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Where We Are Going
              </h2>
              <p className="text-slate-500 text-xs font-semibold mt-0.5">
                Upcoming event locations, customer destinations & turn-by-turn navigation
              </p>
            </div>
          </div>
          <Link
            href="/orders/history"
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-[4px] hover:bg-slate-800 transition-all shadow-xs"
          >
            View All Scheduled Events →
          </Link>
        </div>

        {!stats.upcomingLocations || stats.upcomingLocations.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/60 rounded-[4px] border border-dashed border-slate-200">
            <FaMapMarkerAlt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-bold text-sm">No upcoming catering locations scheduled</p>
            <p className="text-slate-400 text-xs mt-1">New orders created will automatically list their venue address here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.upcomingLocations.map((loc) => {
              const d = new Date(loc.eventDate);
              const formattedDate = isNaN(d.getTime()) ? 'TBD' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`;

              return (
                <div
                  key={loc.id}
                  className="bg-slate-50/80 border border-slate-200 hover:border-indigo-300 hover:bg-white transition-all rounded-[4px] p-5 flex flex-col justify-between group shadow-2xs hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-black rounded-[4px] border border-indigo-100 uppercase">
                        📅 {formattedDate}
                      </span>
                      <span className="text-xs font-black text-emerald-600">
                        {formatCurrency(loc.totalAmount)}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {loc.customerName}
                    </h3>
                    
                    {loc.phone && (
                      <p className="text-xs font-semibold text-slate-500 mb-3">
                        📞 {loc.phone}
                      </p>
                    )}

                    <div className="p-3 bg-white rounded-[4px] border border-slate-200/80 mb-4">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider flex items-center gap-1">
                        <FaMapMarkerAlt className="text-indigo-500" /> Venue / Delivery Address
                      </p>
                      <p className="text-xs font-bold text-slate-700 leading-snug line-clamp-2">
                        {loc.address}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex items-center gap-2">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-[4px] text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs"
                    >
                      <FaMapMarkerAlt className="text-xs" />
                      <span>Navigate Maps</span>
                    </a>
                    <Link
                      href={`/orders/summary/${loc.id}`}
                      className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-[4px] text-xs font-bold hover:bg-slate-50 transition-all shadow-xs"
                    >
                      Order Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Super Admin Highlights */}
      {isSuperAdminUser && superAdminHighlights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {superAdminHighlights.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white p-6 rounded-[4px] border border-slate-200/90 shadow-sm hover:shadow-md flex flex-col justify-between animate-fade-in transition-all"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.title}</h3>
                  <div className="bg-slate-50 p-2 rounded-[4px] border border-slate-100"><Icon className={`w-4 h-4 ${card.color}`} /></div>
                </div>
                <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-[2px] bg-green-500 animate-pulse"></span>
                  <p className="text-xs font-bold text-slate-400">{card.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Operational Alerts */}
      {isSuperAdminUser && superAdminAlerts.length > 0 && (
        <div className="bg-white rounded-[4px] p-8 mb-10 border border-orange-200/80 shadow-sm bg-gradient-to-br from-white to-orange-50/20 animate-fade-in">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-orange-500 p-3 rounded-[4px] shadow-sm">
              <DASHBOARD_OPERATIONAL_ALERT_ICON className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Operational Alerts</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {superAdminAlerts.map((alert) => (
              <div key={alert.label} className="bg-white rounded-[4px] p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
                <p className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">{alert.label}</p>
                <p className={`text-2xl font-black ${alert.color}`}>{alert.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chef & P&L Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Chef Summary */}
        <div className="bg-white rounded-[4px] p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-all animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2.5 rounded-[4px] shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Chef Summary</h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-[4px] border border-slate-200">
              <select value={chefMonth} onChange={(e) => setChefMonth(parseInt(e.target.value))} className="bg-transparent text-[10px] font-black px-2 py-1 outline-none cursor-pointer">
                {DASHBOARD_MONTH_OPTIONS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select value={chefYear} onChange={(e) => setChefYear(parseInt(e.target.value))} className="bg-transparent text-[10px] font-black px-2 py-1 outline-none cursor-pointer">
                {DASHBOARD_YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50/50 p-5 rounded-[4px] border border-blue-100">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Total Payments</p>
              <p className="text-xl font-black text-blue-700">₹{stats.ChefTotalAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-red-50/50 p-5 rounded-[4px] border border-red-100">
              <p className="text-[10px] font-black text-red-400 uppercase mb-1">Cost / Plate</p>
              <p className="text-xl font-black text-red-700">₹{stats.chefCostPerPlate.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* P&L Summary */}
        <div className="bg-white rounded-[4px] p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-all animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-500 p-2.5 rounded-[4px] shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">P&L Analysis</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-5 rounded-[4px] border ${stats.avgProfitPerPlate >= 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
              <p className={`text-[10px] font-black uppercase mb-1 ${stats.avgProfitPerPlate >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Avg Profit / Plate</p>
              <p className={`text-xl font-black ${stats.avgProfitPerPlate >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{stats.avgProfitPerPlate.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50/50 p-5 rounded-[4px] border border-slate-200/80">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Plates</p>
              <p className="text-xl font-black text-slate-700">{stats.totalPlates}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-[4px] p-8 border border-slate-200/90 shadow-sm animate-fade-in">
        <h2 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {DASHBOARD_QUICK_ACTIONS.concat(isSuperAdminUser ? DASHBOARD_SUPER_ADMIN_QUICK_ACTIONS : []).map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href} className="bg-slate-50/80 border border-slate-200 hover:border-slate-300 hover:bg-white transition-all rounded-[4px] p-6 text-center group shadow-xs hover:shadow-md">
                <div className="bg-white border border-slate-200/80 p-3 rounded-[4px] shadow-xs mb-3 mx-auto w-fit group-hover:scale-105 transition-all">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-sm font-black text-slate-700">{action.label}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
