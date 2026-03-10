"use client";
import { useEffect, useState, Fragment, Suspense } from "react";
import {
  FaDollarSign,
  FaUtensils,
  FaUserTie,
  FaTruck,
  FaUsers,
  FaUserFriends,
  FaGasPump,
  FaBox,
  FaStore,
  FaCircle,
  FaReceipt,
  FaChevronDown,
  FaChevronUp,
  FaFileAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, getLocalISODate } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import RoleGuard from "@/components/RoleGuard";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generatePDFTemplate } from '@/lib/pdf-template';

const roleIcons: Record<string, any> = {
  chef: FaUtensils,
  supervisor: FaUserTie,
  transport: FaTruck,
  boys: FaUsers,
  labours: FaUserFriends,
  gas: FaGasPump,
  pan: FaBox,
  store: FaStore,
  other: FaCircle,
};

const roleColors: Record<string, string> = {
  chef: "bg-orange-100 text-orange-800",
  supervisor: "bg-green-100 text-green-800",
  transport: "bg-yellow-100 text-yellow-800",
  boys: "bg-purple-100 text-purple-800",
  labours: "bg-indigo-100 text-indigo-800",
  gas: "bg-red-100 text-red-800",
  pan: "bg-pink-100 text-pink-800",
  store: "bg-indigo-100 text-indigo-800",
  other: "bg-gray-100 text-gray-800",
};

const WORKFORCE_ROLES = [
  "supervisor",
  "chef",
  "labours",
  "boys",
  "transport",
  "gas",
  "pan",
  "store",
  "other",
];
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  other: "Other",
};
const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

interface RoleSummary {
  role: string;
  totalDues: number;
  totalPaidFromExpenses: number;
  totalPayments: number;
  totalPaid: number;
  outstanding: number;
  expenseCount: number;
  paymentCount: number;
  expenses: any[];
  payments: any[];
}

interface EventItem {
  orderId: string;
  eventName: string;
  eventDate: string | null;
  customerName: string | null;
  expenses: any[];
  totalAmount: number;
}

function OutstandingContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [loading, setLoading] = useState(true);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [totalDues, setTotalDues] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [roleSummary, setRoleSummary] = useState<RoleSummary[]>([]);
  const [roleOpeningBalances, setRoleOpeningBalances] = useState<Record<string, number>>({});
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "cash",
    notes: "",
    paymentDate: getLocalISODate(),
    supervisorId: "",
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    amount: "",
    description: "",
    date: getLocalISODate(),
    supervisorId: "",
  });
  const [adjustmentSubmitting, setAdjustmentSubmitting] = useState(false);
  const [expandedStatement, setExpandedStatement] = useState<string | null>(
    null,
  );

  // Filters
  const [filterMonth, setFilterMonth] = useState<string>(
    new Date().getMonth().toString(),
  );
  const [filterYear, setFilterYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [filterDate, setFilterDate] = useState<string>("");

  const handleDownloadRolePDF = async (role: string) => {
    const r = roleSummary.find(item => item.role === role);
    if (!r) return;

    const toastId = toast.loading(`Generating PDF for ${role}...`);
    try {
      const statement = buildStatement(r);
      const pdfData: any = {
        type: 'workforce',
        date: new Date().toISOString(),
        billNumber: `WF-${role.slice(0, 3).toUpperCase()}-${new Date().getTime().toString().slice(-6)}`,
        workforceDetails: {
          name: role.charAt(0).toUpperCase() + role.slice(1),
          role: role,
          totalAmount: r.totalDues,
          totalPaid: r.totalPaid,
          expenses: statement.map(line => ({
            date: line.date,
            amount: line.amount,
            balance: line.balance,
            description: line.desc,
            status: line.status || 'paid',
            type: line.type
          }))
        }
      };

      const htmlContent = generatePDFTemplate(pdfData);
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.padding = '10mm';
      tempDiv.style.background = 'white';
      tempDiv.innerHTML = htmlContent;
      document.body.appendChild(tempDiv);

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(tempDiv, {
        scale: 3.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`SKC-${role}-Statement.pdf`);

      toast.success('PDF downloaded successfully', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  const handleDownloadAllPDF = async () => {
    const activeRoles = roleSummary.filter(r => r.outstanding > 0 || (r.payments?.length || 0) > 0);
    if (activeRoles.length === 0) {
      toast.error('No outstanding data to export');
      return;
    }

    const toastId = toast.loading('Generating Bulk PDF Statements...');
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;

      for (let i = 0; i < activeRoles.length; i++) {
        const r = activeRoles[i];
        const statement = buildStatement(r);
        const pdfData: any = {
          type: 'workforce',
          date: new Date().toISOString(),
          billNumber: `WF-ALL-${new Date().getTime().toString().slice(-6)}`,
          workforceDetails: {
            name: r.role.charAt(0).toUpperCase() + r.role.slice(1),
            role: r.role,
            totalAmount: r.totalDues,
            totalPaid: r.totalPaid,
            expenses: statement.map(line => ({
              date: line.date,
              amount: line.amount,
              balance: line.balance,
              description: line.desc,
              status: line.status || 'paid',
              type: line.type
            }))
          }
        };

        const htmlContent = generatePDFTemplate(pdfData);
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm';
        tempDiv.style.padding = '10mm';
        tempDiv.style.background = 'white';
        tempDiv.innerHTML = htmlContent;
        document.body.appendChild(tempDiv);

        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(tempDiv, {
          scale: 3.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        document.body.removeChild(tempDiv);

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      }

      pdf.save(`SKC-All-Workforce-Statements-${new Date().toLocaleDateString()}.pdf`);
      toast.success('Bulk PDF downloaded successfully', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate bulk PDF', { id: toastId });
    }
  };

  const buildStatement = (r: RoleSummary) => {
    const lines: {
      date: string;
      eventDateDisplay?: string | null;
      desc: string;
      amount: number;
      method: string;
      status?: string;
      type: "workforce" | "expense" | "due";
      balance: number;
    }[] = [];

    // Opening Balance (Brought Forward)
    const openingBal = roleOpeningBalances[r.role] || 0;
    if (openingBal !== 0 || (filterYear !== "all" || filterMonth !== "all" || filterDate !== "")) {
      lines.push({
        date: filterDate || (filterYear !== "all" ? `${filterYear}-${filterMonth !== "all" ? String(Number(filterMonth) + 1).padStart(2, '0') : '01'}-01` : new Date().toISOString()),
        desc: "Balance Brought Forward (Opening)",
        amount: Math.abs(openingBal),
        method: "Opening",
        status: "paid",
        type: openingBal > 0 ? "due" : "workforce", // workforce means credit/payment
        balance: openingBal,
      });
    }

    // Recorded payments (Workforce payments)
    r.payments?.forEach((p: any) => {
      lines.push({
        date: p.paymentDate,
        desc: p.notes || "Recorded payment",
        amount: Number(p.amount || 0),
        method:
          PAYMENT_METHOD_LABELS[String(p.paymentMethod || "cash")] ||
          String(p.paymentMethod || "cash").replace("_", " "),
        status: "paid",
        type: "workforce",
        balance: 0,
      });
    });

    // Expenses (Dues and partial payments)
    r.expenses?.forEach((e: any) => {
      const total = Number(e.amount || 0);
      const paid = Number(e.paidAmount || 0);
      const desc = e.recipient
        ? `Expense – ${e.recipient}`
        : e.description || "Expense";

      const paymentDateStr = e.paymentDate || e.createdAt;

      let eventDateDisplay = null;
      if (e.eventDate) {
        eventDateDisplay = formatDate(e.eventDate);
      } else if (e.order?.eventDate) {
        eventDateDisplay = formatDate(e.order.eventDate);
      } else if (e.bulkEventDates && Array.isArray(e.bulkEventDates) && e.bulkEventDates.length > 0) {
        eventDateDisplay = e.bulkEventDates.map((d: string) => formatDate(d)).join(', ');
      }

      // Record the due amount (Total expense)
      lines.push({
        date: paymentDateStr,
        eventDateDisplay,
        desc: `${desc} (Total Due)`,
        amount: total,
        method: "Due",
        status: e.paymentStatus || "pending",
        type: "due",
        balance: 0,
      });

      // If any amount was paid towards this expense, record it as a credit
      if (paid > 0) {
        lines.push({
          date: paymentDateStr,
          eventDateDisplay,
          desc: `${desc} (Paid)`,
          amount: paid,
          method: "Expense Pymt",
          status: "paid",
          type: "expense",
          balance: 0,
        });
      }
    });

    // Sort by date ascending (with createdAt as stable tiebreaker) to calculate running balance correctly
    lines.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      // Stable tiebreaker: dues come after payments on the same day (payments reduce balance first)
      if (a.type === 'workforce' || a.type === 'expense') return -1;
      if (b.type === 'workforce' || b.type === 'expense') return 1;
      return 0;
    });

    let runningBalance = 0;
    lines.forEach((line) => {
      if (line.method === "Opening") {
        runningBalance = line.balance;
      } else if (line.type === "due") {
        runningBalance += line.amount;
      } else {
        runningBalance -= line.amount;
      }
      line.balance = runningBalance;
    });

    // Sort by date ascending for UI display (beginning of month at top)
    lines.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      // On same date: Opening balance must be absolute first
      if (a.method === "Opening") return -1;
      if (b.method === "Opening") return 1;
      // Then payments before dues for a logical ledger flow
      if (a.type === 'workforce' || a.type === 'expense') return -1;
      if (b.type === 'workforce' || b.type === 'expense') return 1;
      return 0;
    });
    return lines;
  };

  const loadOutstanding = async (
    month?: string,
    year?: string,
    date?: string,
  ) => {
    try {
      const m = month !== undefined ? month : filterMonth;
      const y = year !== undefined ? year : filterYear;
      const d = date !== undefined ? date : filterDate;

      let url = "/api/workforce/outstanding";
      const params = new URLSearchParams();

      if (d) {
        params.append("date", d);
      } else {
        if (y && y !== "all") params.append("year", y);
        if (m && m !== "all") params.append("month", m);
      }

      const queryString = params.toString();
      if (queryString) url += "?" + queryString;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTotalOutstanding(data.totalOutstanding ?? 0);
      setTotalDues(data.totalDues ?? 0);
      setTotalPaid(data.totalPaid ?? 0);
      setEvents(data.events ?? []);
      setRoleSummary(data.roleSummary ?? []);
      setRoleOpeningBalances(data.roleOpeningBalances ?? {});
    } catch (e: any) {
      toast.error(e.message || "Failed to load outstanding");
    } finally {
      setLoading(false);
    }
  };

  const loadSupervisors = async () => {
    try {
      const [supRes, wfRes] = await Promise.all([
        fetch("/api/supervisors"),
        fetch("/api/workforce"),
      ]);

      let combined: any[] = [];

      if (supRes.ok) {
        const data = await supRes.json();
        combined = [...combined, ...(Array.isArray(data) ? data : [])];
      }

      if (wfRes.ok) {
        const data = await wfRes.json();
        const wfList = data.workforce || (Array.isArray(data) ? data : []);
        const wfSupervisors = wfList.filter((m: any) => m.role === "supervisor");
        combined = [...combined, ...wfSupervisors];
      }

      // Use a Map to ensure unique IDs
      const unique = Array.from(
        new Map(combined.map((s) => [s.id, s])).values(),
      );
      setSupervisors(unique);
    } catch (e) {
      console.error("Failed to load supervisors", e);
    }
  };

  useEffect(() => {
    loadOutstanding(filterMonth, filterYear, filterDate);
    loadSupervisors();
  }, [filterMonth, filterYear, filterDate]);

  const openPaymentModal = (role: string) => {
    setSelectedRole(role);
    setShowPaymentModal(true);
    setPaymentForm({
      amount: "",
      paymentMethod: "cash",
      notes: "",
      paymentDate: getLocalISODate(),
      supervisorId: "",
    });
  };

  const openAdjustmentModal = (role: string) => {
    setSelectedRole(role);
    setShowAdjustmentModal(true);
    setAdjustmentForm({
      amount: "",
      description: "",
      date: getLocalISODate(),
      supervisorId: "",
    });
  };

  const submitPayment = async () => {
    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!selectedRole) {
      toast.error("Select a role");
      return;
    }
    setPaymentSubmitting(true);
    try {
      const res = await fetch("/api/workforce/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          role: selectedRole,
          paymentMethod: paymentForm.paymentMethod,
          notes: selectedRole === 'supervisor' && paymentForm.supervisorId
            ? `${supervisors.find(s => s.id === paymentForm.supervisorId)?.name} - ${paymentForm.notes}`
            : paymentForm.notes || undefined,
          paymentDate: paymentForm.paymentDate,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record payment");
      }
      toast.success(
        `Payment of ${formatCurrency(amount)} recorded for ${selectedRole}`,
      );
      setShowPaymentModal(false);
      setSelectedRole(null);
      setPaymentForm({
        amount: "",
        paymentMethod: "cash",
        notes: "",
        paymentDate: getLocalISODate(),
        supervisorId: "",
      });
      await loadOutstanding();
    } catch (e: any) {
      toast.error(e.message || "Failed to record payment");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const submitAdjustment = async () => {
    const amount = parseFloat(adjustmentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!adjustmentForm.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!selectedRole) {
      toast.error("Select a role");
      return;
    }
    setAdjustmentSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedRole,
          amount,
          paidAmount: 0,
          description: adjustmentForm.description,
          paymentDate: adjustmentForm.date,
          recipient: selectedRole === 'supervisor' && adjustmentForm.supervisorId
            ? supervisors.find(s => s.id === adjustmentForm.supervisorId)?.name
            : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record adjustment");
      }
      toast.success(
        `Adjustment of ${formatCurrency(amount)} added for ${selectedRole}`,
      );
      setShowAdjustmentModal(false);
      setSelectedRole(null);
      setAdjustmentForm({
        amount: "",
        description: "",
        date: getLocalISODate(),
        supervisorId: "",
      });
      await loadOutstanding();
    } catch (e: any) {
      toast.error(e.message || "Failed to record adjustment");
    } finally {
      setAdjustmentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard requiredRole="super_admin">
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="super_admin">
      <div className="p-3 sm:p-4 md:p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <FaDollarSign className="text-primary-500" /> Outstanding
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Events, workforce dues, and role-based payments
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadAllPDF}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm transition-all"
              title="Download All Statements as a single PDF"
            >
              <FaFileAlt className="w-4 h-4" /> Download All (PDF)
            </button>
            {from === "expenses" && (
              <Link
                href="/expenses"
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm whitespace-nowrap"
              >
                ← Back to Expenses
              </Link>
            )}
            {from === "workforce" && (
              <Link
                href="/workforce"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm whitespace-nowrap"
              >
                ← Workforce
              </Link>
            )}
          </div>
        </div>

        {/* Global Filters */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Specific Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Year
              </label>
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  if (e.target.value !== "all") setFilterDate("");
                }}
                disabled={!!filterDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Time</option>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Month
              </label>
              <select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  if (e.target.value !== "all") setFilterDate("");
                }}
                disabled={filterYear === "all" || !!filterDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Months</option>
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((m, i) => (
                  <option key={i} value={i.toString()}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterDate("");
                  setFilterYear(new Date().getFullYear().toString());
                  setFilterMonth(new Date().getMonth().toString());
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors"
              >
                Reset to Current
              </button>
            </div>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6 mb-6">
          <h2 className="text-sm font-medium text-amber-800 mb-1">
            Total Outstanding
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-amber-900">
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="text-sm text-amber-700 mt-2">
            Total dues: {formatCurrency(totalDues)} · Paid:{" "}
            {formatCurrency(totalPaid)}
          </p>
        </div>

        {/* Events & Event Money */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800">
              Events & Event Money
            </h2>
            <span className="text-xs font-medium text-gray-500 uppercase">
              Linked to Orders
            </span>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs sm:text-sm text-gray-600">
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Event Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No event-linked expenses yet
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr
                      key={ev.orderId}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {ev.eventName || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {ev.eventDate ? formatDate(ev.eventDate) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {ev.customerName || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-600">
                        {formatCurrency(ev.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View for Events */}
          <div className="md:hidden divide-y divide-gray-100">
            {events.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No event-linked expenses yet
              </div>
            ) : (
              events.map((ev) => (
                <div key={ev.orderId} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{ev.eventName || "Unnamed Event"}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {ev.customerName || "No Customer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(ev.totalAmount)}</p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight">
                        {ev.eventDate ? formatDate(ev.eventDate) : "No Date"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* General Business Expenses */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800">
              General Business Expenses
            </h2>
            <span className="text-xs font-medium text-gray-500 uppercase">
              Not linked to orders
            </span>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs sm:text-sm text-gray-600">
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {roleSummary
                  .map((r) =>
                    r.expenses.filter((e) => !e.orderId && !e.isBulkExpense),
                  )
                  .flat().length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No general expenses found
                    </td>
                  </tr>
                ) : (
                  roleSummary
                    .map((r) =>
                      r.expenses.filter((e) => !e.orderId && !e.isBulkExpense),
                    )
                    .flat()
                    .sort(
                      (a, b) =>
                        new Date(b.paymentDate || b.createdAt).getTime() -
                        new Date(a.paymentDate || a.createdAt).getTime(),
                    )
                    .map((exp: any) => (
                      <tr
                        key={exp.id}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {exp.description ||
                            (exp.recipient
                              ? `Expense – ${exp.recipient}`
                              : "Expense")}
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(exp.paymentDate || exp.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 font-medium">
                          {formatCurrency(Number(exp.amount || 0))}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View for General Expenses */}
          <div className="md:hidden divide-y divide-gray-100 text-sm">
            {roleSummary
              .map((r) =>
                r.expenses.filter((e) => !e.orderId && !e.isBulkExpense),
              )
              .flat().length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No general expenses found
              </div>
            ) : (
              roleSummary
                .map((r) =>
                  r.expenses.filter((e) => !e.orderId && !e.isBulkExpense),
                )
                .flat()
                .sort(
                  (a, b) =>
                    new Date(b.paymentDate || b.createdAt).getTime() -
                    new Date(a.paymentDate || a.createdAt).getTime(),
                )
                .map((exp: any) => (
                  <div key={exp.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <p className="font-bold text-gray-900">
                          {exp.description || (exp.recipient ? `Expense – ${exp.recipient}` : "Expense")}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="capitalize text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                            {exp.category}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {formatDate(exp.paymentDate || exp.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(Number(exp.amount || 0))}</p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Record Payment by Role */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-200">
            Outstanding by Role · Record Payment
          </h2>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs sm:text-sm text-gray-600">
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Total Dues
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Outstanding
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roleSummary
                  .filter((r) => r.totalDues > 0 || r.payments?.length > 0)
                  .map((r) => {
                    const Icon = roleIcons[r.role];
                    const statement = buildStatement(r);
                    const isExpanded = expandedStatement === r.role;
                    return (
                      <Fragment key={r.role}>
                        <tr className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${roleColors[r.role]}`}
                            >
                              {Icon && <Icon className="w-4 h-4" />}
                              {r.role.charAt(0).toUpperCase() + r.role.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(r.totalDues)}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600">
                            {formatCurrency(r.totalPaid)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-amber-700">
                            {formatCurrency(r.outstanding)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  setExpandedStatement(
                                    isExpanded ? null : r.role,
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                              >
                                <FaFileAlt className="w-4 h-4" />
                                {isExpanded ? (
                                  <>
                                    <FaChevronUp className="w-4 h-4" /> Hide
                                  </>
                                ) : (
                                  <>
                                    <FaChevronDown className="w-4 h-4" />{" "}
                                    Statement
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDownloadRolePDF(r.role)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-indigo-300 text-indigo-700 text-sm hover:bg-indigo-50"
                                title="Download Statement PDF"
                              >
                                <FaFileAlt className="w-4 h-4" /> PDF
                              </button>
                              <button
                                onClick={() => openPaymentModal(r.role)}
                                disabled={r.outstanding <= 0}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <FaReceipt className="w-4 h-4" /> Record Payment
                              </button>
                              <button
                                onClick={() => openAdjustmentModal(r.role)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
                              >
                                + Add Missed Due
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && statement.length > 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-3 bg-gray-50">
                              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                                <div className="px-4 py-2 bg-gray-100">
                                  <h4 className="font-medium text-gray-800">
                                    Payment Statement –{" "}
                                    {r.role.charAt(0).toUpperCase() +
                                      r.role.slice(1)}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    How the amount was transferred
                                  </p>
                                </div>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-50 text-left text-gray-600">
                                      <th className="px-4 py-2 font-medium">
                                        Date
                                      </th>
                                      <th className="px-4 py-2 font-medium">
                                        Description
                                      </th>
                                      <th className="px-4 py-2 font-medium">
                                        Method
                                      </th>
                                      <th className="px-4 py-2 font-medium">
                                        Status
                                      </th>
                                      <th className="px-4 py-2 font-medium text-right">
                                        Amount / Bal
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {statement.map((line, i) => (
                                      <tr
                                        key={i}
                                        className="border-t border-gray-100"
                                      >
                                        <td className="px-4 py-2 text-gray-700 align-top">
                                          <div className="font-medium">{formatDate(line.date)}</div>
                                          {line.eventDateDisplay && (
                                            <div className="text-[11px] font-medium text-amber-600 mt-0.5">
                                              Event: {line.eventDateDisplay}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-4 py-2 text-gray-700 align-top">
                                          {line.desc}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 capitalize align-top">
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${line.type === "due"
                                              ? "bg-amber-100 text-amber-700"
                                              : line.type === "workforce"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-blue-100 text-blue-700"
                                              }`}
                                          >
                                            {line.method}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 capitalize align-top">
                                          {line.status && (
                                            <span
                                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${line.status.toLowerCase() === "paid"
                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                                : line.status.toLowerCase() === "partial"
                                                  ? "bg-sky-50 text-sky-600 border border-sky-200"
                                                  : "bg-rose-50 text-rose-600 border border-rose-200"
                                                }`}
                                            >
                                              {line.status}
                                            </span>
                                          )}
                                        </td>
                                        <td
                                          className="px-4 py-2 text-right"
                                        >
                                          <div className={`font-medium ${line.type === "due" ? "text-amber-700" : "text-green-600"}`}>
                                            {line.type === "due"
                                              ? `+ ${formatCurrency(line.amount)}`
                                              : `- ${formatCurrency(line.amount)}`}
                                          </div>
                                          <div className="text-[10px] font-black text-slate-400 mt-0.5 uppercase tracking-tighter">
                                            Bal: {formatCurrency(line.balance)}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                                      <td colSpan={5} className="px-4 py-8 text-right">
                                        <div className="flex flex-col items-end w-full">
                                          <div className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-6">
                                            Total Calculation Summary
                                          </div>
                                          <div className="space-y-4 min-w-[200px]">
                                            <div>
                                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1">Total Dues</div>
                                              <div className="text-sm font-black text-amber-700">
                                                + {formatCurrency(statement.reduce((sum, line) => line.type === 'due' ? sum + line.amount : sum, 0))}
                                              </div>
                                            </div>

                                            <div className="pt-2 border-t border-slate-200">
                                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1">Total Paid</div>
                                              <div className="text-sm font-black text-green-600">
                                                - {formatCurrency(statement.reduce((sum, line) => line.type !== 'due' ? sum + line.amount : sum, 0))}
                                              </div>
                                            </div>

                                            <div className="pt-2 border-t-2 border-slate-300">
                                              <div className="text-[10px] font-black text-primary-500 uppercase tracking-tight mb-1">Final Outstanding</div>
                                              <div className="text-lg font-black text-slate-900 underline decoration-primary-500/30 underline-offset-4">
                                                {formatCurrency(statement.reduce((sum, line) => line.type === 'due' ? sum + line.amount : sum - line.amount, 0))}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                        {isExpanded && statement.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-3 bg-gray-50">
                              <p className="text-sm text-gray-500 italic">
                                No payments recorded yet.
                              </p>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View for Role Outstanding */}
          <div className="md:hidden divide-y divide-gray-100">
            {roleSummary
              .filter((r) => r.totalDues > 0 || r.payments?.length > 0)
              .map((r) => {
                const Icon = roleIcons[r.role];
                const statement = buildStatement(r);
                const isExpanded = expandedStatement === r.role;
                return (
                  <div key={r.role} className="flex flex-col">
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${roleColors[r.role]}`}>
                          {Icon && <Icon className="w-4 h-4" />}
                          {r.role.charAt(0).toUpperCase() + r.role.slice(1)}
                        </span>
                        <div className="text-right">
                          <p className="text-lg font-black text-amber-700">{formatCurrency(r.outstanding)}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-tight font-bold">Outstanding</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <p className="text-[10px] text-slate-400 uppercase tracking-tight font-bold mb-0.5">Total Dues</p>
                          <p className="text-xs font-bold text-slate-700">{formatCurrency(r.totalDues)}</p>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-lg">
                          <p className="text-[10px] text-emerald-600/60 uppercase tracking-tight font-bold mb-0.5">Total Paid</p>
                          <p className="text-xs font-bold text-emerald-700">{formatCurrency(r.totalPaid)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setExpandedStatement(isExpanded ? null : r.role)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold shadow-sm active:scale-95 transition-all"
                        >
                          <FaFileAlt className="w-3.5 h-3.5" />
                          {isExpanded ? "Hide Statement" : "View Statement"}
                        </button>
                        <button
                          onClick={() => handleDownloadRolePDF(r.role)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 text-xs font-bold shadow-sm active:scale-95 transition-all"
                        >
                          <FaFileAlt className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => openPaymentModal(r.role)}
                          disabled={r.outstanding <= 0}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50"
                        >
                          <FaReceipt className="w-3.5 h-3.5" /> Record Payment
                        </button>
                        <button
                          onClick={() => openAdjustmentModal(r.role)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                        >
                          + Add Missed Due
                        </button>
                      </div>
                    </div>

                    {/* Expandable Mobile Ledger Statement */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-100 p-3">
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Statement</h4>
                            <span className="text-[10px] font-bold text-slate-400">LEDGER FLOW</span>
                          </div>
                          {statement.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs italic">No history found</div>
                          ) : (
                            <div className="divide-y divide-slate-100">
                              {statement.map((line, i) => (
                                <div key={i} className="p-4 space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{formatDate(line.date)}</p>
                                      <p className="text-sm font-bold text-slate-800 mt-1 leading-tight">{line.desc}</p>
                                      {line.eventDateDisplay && (
                                        <p className="text-[10px] font-bold text-amber-600 mt-1 uppercase">Event: {line.eventDateDisplay}</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-sm font-bold ${line.type === "due" ? "text-amber-700" : "text-emerald-600"}`}>
                                        {line.type === "due" ? `+ ${formatCurrency(line.amount)}` : `- ${formatCurrency(line.amount)}`}
                                      </div>
                                      <div className="flex justify-end gap-1 mt-1">
                                        <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase ${line.type === "due" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                          {line.method}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Running Bal</span>
                                    <span className="text-xs font-black text-slate-600">{formatCurrency(line.balance)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-400 uppercase">Total Dues</span>
                              <span className="text-amber-700">+ {formatCurrency(statement.reduce((sum, line) => line.type === 'due' ? sum + line.amount : sum, 0))}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-400 uppercase">Total Paid</span>
                              <span className="text-emerald-600">- {formatCurrency(statement.reduce((sum, line) => line.type !== 'due' ? sum + line.amount : sum, 0))}</span>
                            </div>
                            <div className="flex justify-between text-xs font-black pt-2 border-t border-slate-200">
                              <span className="text-slate-800 uppercase tracking-tight">Final Balance</span>
                              <span className="text-slate-900">{formatCurrency(statement.reduce((sum, line) => line.type === 'due' ? sum + line.amount : sum - line.amount, 0))}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Payment Modal */}
        {
          showPaymentModal && selectedRole && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Record Payment –{" "}
                  {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                </h3>

                {selectedRole && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-amber-800">
                        Current Outstanding:
                      </span>
                      <span className="text-lg font-bold text-amber-900">
                        {(() => {
                          const summary = roleSummary.find(
                            (r) => r.role === selectedRole,
                          );
                          if (!summary) return formatCurrency(0);

                          if (
                            selectedRole === "supervisor" &&
                            paymentForm.supervisorId
                          ) {
                            const supervisor = supervisors.find(
                              (s) => s.id === paymentForm.supervisorId,
                            );
                            if (!supervisor) return formatCurrency(summary.outstanding);

                            const supExpenses = summary.expenses.filter(
                              (e) => e.recipient === supervisor.name,
                            );
                            const supPayments = summary.payments.filter((p) =>
                              p.notes?.startsWith(supervisor.name),
                            );

                            const totalDues = supExpenses.reduce(
                              (sum, e) => sum + Number(e.amount || 0),
                              0,
                            );
                            const totalPaid =
                              supExpenses.reduce(
                                (sum, e) => sum + Number(e.paidAmount || 0),
                                0,
                              ) +
                              supPayments.reduce(
                                (sum, p) => sum + Number(p.amount || 0),
                                0,
                              );

                            return formatCurrency(Math.max(0, totalDues - totalPaid));
                          }

                          return formatCurrency(summary.outstanding);
                        })()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm((f) => ({ ...f, amount: e.target.value }))
                      }
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) =>
                        setPaymentForm((f) => ({
                          ...f,
                          paymentMethod: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) =>
                        setPaymentForm((f) => ({
                          ...f,
                          paymentDate: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  {selectedRole === "supervisor" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Supervisor
                      </label>
                      <select
                        value={paymentForm.supervisorId}
                        onChange={(e) =>
                          setPaymentForm((f) => ({
                            ...f,
                            supervisorId: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">All Supervisors (General)</option>
                        {supervisors.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}{" "}
                            {s.cateringServiceName
                              ? `(${s.cateringServiceName})`
                              : "(Workforce)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      value={paymentForm.notes}
                      onChange={(e) =>
                        setPaymentForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      placeholder="Optional notes"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedRole(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitPayment}
                    disabled={paymentSubmitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                  >
                    {paymentSubmitting ? "Recording…" : "Record Payment"}
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Adjustment Modal */}
        {
          showAdjustmentModal && selectedRole && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Add Missed Due / Adjustment – {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  This will add an unresolved expense (due) to the selected role, increasing their total outstanding balance.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={adjustmentForm.amount}
                      onChange={(e) => setAdjustmentForm((f) => ({ ...f, amount: e.target.value }))}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={adjustmentForm.date}
                      onChange={(e) => setAdjustmentForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  {selectedRole === 'supervisor' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Supervisor</label>
                      <select
                        value={adjustmentForm.supervisorId}
                        onChange={(e) => setAdjustmentForm(f => ({ ...f, supervisorId: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">All Supervisors (General)</option>
                        {supervisors.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}{" "}
                            {s.cateringServiceName
                              ? `(${s.cateringServiceName})`
                              : "(Workforce)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Details / Description <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={adjustmentForm.description}
                      onChange={(e) => setAdjustmentForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="e.g., Missed wages for event on Tuesday"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAdjustmentModal(false);
                      setSelectedRole(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitAdjustment}
                    disabled={adjustmentSubmitting}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50"
                  >
                    {adjustmentSubmitting ? "Adding…" : "Add Due"}
                  </button>
                </div>
              </div>
            </div>
          )
        }
      </div >
    </RoleGuard >
  );
}

export default function OutstandingPage() {
  return (
    <Suspense fallback={
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading workforce data...</p>
        </div>
      </div>
    }>
      <OutstandingContent />
    </Suspense>
  );
}
