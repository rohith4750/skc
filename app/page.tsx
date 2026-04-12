"use client";
import { getOrderDate, formatCurrency, formatDate } from '@/lib/utils';
import { useEffect, useState, useMemo } from "react";
import { Storage } from "@/lib/storage-api";
import { fetchWithLoader } from "@/lib/fetch-with-loader";
import Link from "next/link";
import { isSuperAdmin, getUserRole } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  FaUsers, FaShoppingCart, FaFileInvoiceDollar, FaUtensils,
  FaMoneyBillWave, FaChartLine, FaArrowUp, FaArrowDown,
  FaChevronRight, FaCalendarAlt, FaClock, FaCheckCircle,
  FaExclamationCircle, FaUserTie, FaBox, FaWarehouse,
  FaStore, FaTags, FaHistory, FaPlus, FaBolt, FaArrowRight, FaTimes
} from 'react-icons/fa';
import {
  DASHBOARD_MONTH_OPTIONS,
  DASHBOARD_YEAR_OPTIONS,
  type DashboardStats,
} from "@/config/pages/dashboard-page-config";

export default function Dashboard() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats & { chartData: any[], timeline: any[], topPerformers: any[] }>({
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
    chartData: [],
    timeline: [],
    topPerformers: []
  });
  const [loading, setLoading] = useState(true);
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false);

  useEffect(() => {
    setUserRole(getUserRole());
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

        const filterByMonthYear = (itemDate: string | Date | null) => {
          if (!itemDate) return false;
          const d = new Date(itemDate);
          if (selectedDate) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}` === selectedDate;
          }
          return (d.getMonth() + 1 === (selectedMonth || 0) || selectedMonth === 0) && (d.getFullYear() === selectedYear || selectedYear === 0);
        };

        const orders = rawOrders.filter((o: any) => o.status !== 'cancelled' && filterByMonthYear(getOrderDate(o)));
        const bills = rawBills.filter((b: any) => b.order?.status !== 'cancelled' && filterByMonthYear(b.order?.eventDate || b.createdAt));
        const expenses = rawExpenses.filter((e: any) => e.order?.status !== 'cancelled' && filterByMonthYear(e.paymentDate));

        const totalCollected = bills.reduce((sum: number, bill: any) => sum + (parseFloat(bill.paidAmount) || 0), 0);
        const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + (parseFloat(expense.amount) || 0), 0);
        const totalBilled = bills.reduce((sum: number, bill: any) => sum + (parseFloat(bill.totalAmount) || 0), 0);
        const totalReceivable = bills.reduce((sum: number, bill: any) => sum + (parseFloat(bill.remainingAmount) || 0), 0);
        
        // --- CHART DATA (Last 6 Months) ---
        const last6Months = Array.from({ length: 6 }).map((_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          return { month: d.getMonth() + 1, year: d.getFullYear(), label: DASHBOARD_MONTH_OPTIONS[d.getMonth()].substring(0, 3) };
        }).reverse();

        const chartData = last6Months.map(m => {
          const mOrders = rawOrders.filter((o: any) => {
            const od = new Date(getOrderDate(o));
            return od.getMonth() + 1 === m.month && od.getFullYear() === m.year;
          });
          const mRev = mOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.totalAmount) || 0), 0);
          return { name: m.label, revenue: mRev, volume: mOrders.length };
        });

        // --- TOP PERFORMERS ---
        const customerRevenueMap: Record<string, { name: string, count: number, revenue: number }> = {};
        rawOrders.forEach((o: any) => {
          if (o.status === 'cancelled') return;
          const cid = o.customer?.id || 'anonymous';
          if (!customerRevenueMap[cid]) {
            customerRevenueMap[cid] = { name: o.customer?.name || 'Walk-in', count: 0, revenue: 0 };
          }
          customerRevenueMap[cid].count += 1;
          customerRevenueMap[cid].revenue += (parseFloat(o.totalAmount) || 0);
        });
        const topPerformers = Object.values(customerRevenueMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        // --- TIMELINE ---
        const todayAtZero = new Date();
        todayAtZero.setHours(0, 0, 0, 0);
        const timeline = rawOrders
          .filter((o: any) => o.status !== 'cancelled' && new Date(getOrderDate(o)) >= todayAtZero)
          .flatMap((o: any) => {
            const meals = o.mealTypeAmounts ? Object.entries(o.mealTypeAmounts) : [];
            if (meals.length === 0) return [{
              id: `${o.id}-main`, orderId: o.id, customer: o.customer?.name || 'Unknown',
              type: 'EVENT', date: new Date(getOrderDate(o)), time: o.eventTime || 'TBD',
              plates: o.numberOfMembers || 0, venue: o.venue || 'Main Site', status: o.status
            }];
            return meals.map(([type, data]: [string, any]) => ({
              id: `${o.id}-${type}`, orderId: o.id, customer: o.customer?.name || 'Unknown',
              type: data.menuType || type, date: new Date(data.date || getOrderDate(o)),
              time: data.time || 'TBD', plates: data.numberOfMembers || 0,
              venue: data.venue || o.venue || 'SKC Site', status: o.status
            }));
          })
          .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
          .slice(0, 5);

        setStats({
          customers: customers.length,
          menuItems: menuItems.length,
          orders: orders.length,
          bills: bills.length,
          expenses: expenses.length,
          totalCollected, totalExpenses, totalBilled, totalReceivable,
          avgOrderValue: orders.length > 0 ? totalBilled / orders.length : 0,
          profitMargin: totalBilled > 0 ? ((totalBilled - totalExpenses) / totalBilled) * 100 : 0,
          collectionRate: totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0,
          pendingOrders: orders.filter((o: any) => ['pending', 'in_progress'].includes(o.status)).length,
          completedOrders: orders.filter((o: any) => o.status === "completed").length,
          paidBills: bills.filter((b: any) => b.status === "paid").length,
          pendingBills: bills.filter((b: any) => b.status !== "paid").length,
          chartData, timeline, topPerformers,
          users: 0, workforce: 0, stockItems: 12, lowStockItems: 4, inventoryItems: 248,
          pendingExpenses: 0, outstandingExpenses: 0, avgRevenuePerPlate: 0, avgCostPerPlate: 0,
          avgProfitPerPlate: 0, totalPlates: 0, chefSummary: 0, chefCostPerPlate: 0,
          chefPlateType: '', ChefTotalAmount: 0, topItems: []
        });
      } catch (error) {
        console.error("Dashboard Load Failure:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [selectedMonth, selectedYear, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-2 border-primary-100 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-t-2 border-primary-500 rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Syncing Pulse</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 animate-pulse">Initializing Data Streams...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 pt-24 lg:pt-10 bg-[#fafafa] min-h-screen font-sans selection:bg-primary-100">
      
      {/* Premium Navigation Header */}
      <div className="max-w-[1600px] mx-auto mb-12">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 border-b border-slate-100 pb-10">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 inline-block"
            >
              Enterprise Operational Hub
            </motion.div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
              Intelligence<span className="text-primary-600">.</span>
            </h1>
            <p className="text-slate-400 mt-2 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
              <FaBolt className="text-amber-400" /> Live Business Pulse — {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="v2-card p-1.5 flex bg-white border-slate-100 shadow-sm grow xl:grow-0 overflow-hidden">
               <input 
                type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none text-slate-700 cursor-pointer"
              />
               <div className="w-px h-6 bg-slate-100 self-center"></div>
               <select 
                value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none text-slate-600 cursor-pointer"
               >
                 <option value={0}>Full Year</option>
                 {DASHBOARD_MONTH_OPTIONS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
               </select>
            </div>
            <Link href="/orders/create" className="v2-button bg-primary-600 text-white px-8 py-4 shadow-xl shadow-primary-900/10 hover:scale-[1.02] active:scale-95 transition-all text-xs font-black uppercase tracking-widest">
              Initialize Order
            </Link>
          </div>
        </header>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
          <InsightCard 
            label="Gross Pipeline" value={formatCurrency(stats.totalBilled)} 
            icon={FaChartLine} trend="+12.4%" color="primary" 
            desc="Value of all active & closed contracts"
          />
          <InsightCard 
            label="Inflow Velocity" value={formatCurrency(stats.totalCollected)} 
            icon={FaMoneyBillWave} trend="+8.1%" color="emerald" 
            desc="Capital realized in coffers"
          />
          <InsightCard 
            label="Operational Unit Load" value={stats.orders} 
            icon={FaUtensils} subValue="Events" color="amber" 
            desc="Total volume of culinary operations"
          />
          <InsightCard 
            label="Liquidity Gap" value={formatCurrency(stats.totalReceivable)} 
            icon={FaExclamationCircle} color="rose" 
            desc="Pending realizations in pipeline"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start">
          
          {/* Central Analytics Pulse */}
          <div className="xl:col-span-2 space-y-10">
            <div className="v2-card p-10 bg-white border-slate-50 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <FaChartLine size={200} />
               </div>
               <div className="flex items-center justify-between mb-10 relative">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Revenue Dynamics</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-1">Real-time fiscal movement visualization</p>
                  </div>
                  <div className="flex gap-4">
                     <LegendItem color="#f97316" label="Projected Rev" />
                     <LegendItem color="#10b981" label="Order Volume" />
                  </div>
               </div>
               <div className="h-[400px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#cbd5e1' }} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#cbd5e1' }} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip 
                        content={<CustomTooltip />}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                      <Line type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Top Entities Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="v2-card p-8">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    <FaUserTie className="text-primary-400" />
                    High-Value Entities
                  </h4>
                  <div className="space-y-6">
                    {stats.topPerformers.length > 0 ? stats.topPerformers.map((p, i) => (
                      <div key={i} className="flex items-center justify-between group cursor-default">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">{i+1}</div>
                          <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{p.count} Managed Operations</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-600">{formatCurrency(p.revenue)}</p>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(p.revenue / (stats.topPerformers[0]?.revenue || 1)) * 100}%` }} className="h-full bg-emerald-400" />
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="text-[10px] text-slate-300 font-black uppercase text-center py-10">No Performance Data</p>
                    )}
                  </div>
               </div>

               <div className="v2-card p-8 bg-slate-900 text-white border-none relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <FaBox size={80} />
                  </div>
                  <h4 className="text-xs font-black opacity-40 uppercase tracking-[0.2em] mb-8">Stock Intelligence</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                      <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">Total Inventory</p>
                      <p className="text-2xl font-black mt-1">{stats.inventoryItems}<span className="text-primary-400">.</span></p>
                      <p className="text-[9px] font-bold opacity-40 uppercase mt-1">Active SKUs</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                      <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">Low Alerts</p>
                      <p className="text-2xl font-black mt-1 text-amber-400">{stats.lowStockItems}<span className="text-white">!</span></p>
                      <p className="text-[9px] font-bold opacity-40 uppercase mt-1">Urgent Reorder</p>
                    </div>
                  </div>
                  <Link href="/stock" className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary-400 hover:text-primary-300 transition-colors">
                     Manage Materials Inventory <FaArrowRight size={10} />
                  </Link>
               </div>
            </div>
          </div>

          {/* Right Sidebar: Operational Pulse Timeline */}
          <div className="space-y-8">
            <div className="v2-card p-8 bg-white overflow-hidden">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                    <FaBolt className="text-primary-500" /> Pulse Feed
                  </h3>
                  <Link href="/orders/overview" className="text-[10px] font-black text-primary-500 hover:underline uppercase tracking-widest">View Map</Link>
               </div>
               
               <div className="relative space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-50">
                  {stats.timeline.length > 0 ? stats.timeline.map((item, idx) => (
                    <div key={item.id} className="relative pl-12 group">
                      <div className={`absolute left-0 top-1 w-10 h-10 rounded-2xl bg-white border-2 flex items-center justify-center transition-all duration-500 ${
                        item.status === 'completed' ? 'border-emerald-100 group-hover:border-emerald-400' : 
                        item.status === 'in_progress' ? 'border-blue-100 group-hover:border-blue-400' : 'border-orange-100 group-hover:border-orange-400'
                      }`}>
                         <div className={`w-2 h-2 rounded-full ${
                           item.status === 'completed' ? 'bg-emerald-500 animate-pulse' : 
                           item.status === 'in_progress' ? 'bg-blue-500 animate-pulse' : 'bg-orange-500'
                         }`} />
                      </div>
                      <Link href={`/orders/summary/${item.orderId}`} className="block">
                        <div className="v2-glass p-6 rounded-3xl border-transparent hover:border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary-500">{item.type} • {item.time}</span>
                            <span className="text-[8px] font-bold text-slate-300">{formatDate(item.date)}</span>
                          </div>
                          <p className="text-sm font-black text-slate-800 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{item.customer}</p>
                          <div className="flex items-center gap-4 mt-3">
                             <div className="flex flex-col">
                               <span className="text-[8px] font-bold text-slate-400 uppercase">Volume</span>
                               <span className="text-[10px] font-black text-slate-700">{item.plates} Units</span>
                             </div>
                             <div className="w-px h-6 bg-slate-100" />
                             <div className="flex flex-col">
                               <span className="text-[8px] font-bold text-slate-400 uppercase">Venue</span>
                               <span className="text-[10px] font-black text-slate-700 truncate max-w-[100px]">{item.venue}</span>
                             </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )) : (
                    <div className="py-20 text-center">
                       <FaHistory className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Awaiting Live Ops</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Quick Intelligence Tiles */}
            <div className="grid grid-cols-2 gap-4">
               <PulseTile href="/customers" val={stats.customers} label="Profiles" icon={FaUsers} color="blue" />
               <PulseTile href="/menu" val={stats.menuItems} label="Recipes" icon={FaUtensils} color="primary" />
               <PulseTile href="/bills" val={stats.paidBills} label="Realized" icon={FaCheckCircle} color="emerald" />
               <PulseTile href="/orders/center" val={stats.pendingOrders} label="Active" icon={FaBolt} color="amber" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function InsightCard({ label, value, icon: Icon, trend, color, desc }: any) {
  const colorMap: any = {
    primary: "border-primary-500 text-primary-600 bg-primary-50",
    emerald: "border-emerald-500 text-emerald-600 bg-emerald-50",
    amber: "border-amber-500 text-amber-600 bg-amber-50",
    rose: "border-rose-500 text-rose-600 bg-rose-50",
  };

  return (
    <motion.div 
      whileHover={{ y: -6 }}
      className="v2-card p-10 bg-white border-slate-50 group transition-all"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center transition-transform group-hover:rotate-12 ${colorMap[color]}`}>
           <Icon size={24} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full">
            <FaArrowUp size={8} /> {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</h3>
        <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
        <p className="text-[9px] font-bold text-slate-300 uppercase mt-4 group-hover:text-slate-500 transition-colors line-clamp-1">{desc}</p>
      </div>
    </motion.div>
  );
}

function PulseTile({ href, val, label, icon: Icon, color }: any) {
  const cMap: any = {
    primary: "text-primary-500 bg-primary-50",
    blue: "text-blue-500 bg-blue-50",
    emerald: "text-emerald-500 bg-emerald-50",
    amber: "text-amber-500 bg-amber-50",
  };
  return (
    <Link href={href}>
      <div className="v2-card p-6 bg-white border-slate-50 hover:border-slate-200 hover:shadow-xl transition-all h-full">
         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${cMap[color]}`}>
            <Icon size={18} />
         </div>
         <p className="text-2xl font-black text-slate-900 leading-none">{val}</p>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{label}</p>
      </div>
    </Link>
  );
}

function LegendItem({ color, label }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const revenue = payload[0]?.value || 0;
    const volume = payload[1]?.value || 0;
    return (
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-2xl scale-110 -translate-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-8">
            <span className="text-[10px] font-bold text-white/50 uppercase">Capital</span>
            <span className="text-sm font-black text-primary-400">{formatCurrency(revenue)}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-[10px] font-bold text-white/50 uppercase">Load</span>
            <span className="text-sm font-black text-emerald-400">{volume} Events</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
