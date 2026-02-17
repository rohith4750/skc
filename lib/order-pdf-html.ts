/**
 * Builds order PDF HTML (menu + event details) for html2canvas rendering
 * Shared between Order History and Bill page
 */
import { sanitizeMealLabel } from "./utils";

export function buildOrderPdfHtml(
  order: any,
  options: {
    useEnglish: boolean;
    formatDate: (d: string | Date) => string;
    showFinancials?: boolean;
    formatCurrency?: (val: number) => string;
    bill?: any;
  },
): string {
  const {
    useEnglish,
    formatDate,
    showFinancials = false,
    formatCurrency = (v) => `\u20B9${v.toLocaleString("en-IN")}`,
    bill: externalBill,
  } = options;
  const customer = order.customer;
  const supervisor = order.supervisor;
  const bill = externalBill || order.bill;
  const mealTypeAmounts = order.mealTypeAmounts as Record<
    string,
    | {
        amount?: number;
        date?: string;
        numberOfMembers?: number;
        services?: string[];
      }
    | number
  > | null;

  const eventDates: string[] = [];
  if (mealTypeAmounts) {
    Object.entries(mealTypeAmounts).forEach(([, data]) => {
      if (typeof data === "object" && data !== null && data.date) {
        const dateStr = formatDate(data.date);
        if (!eventDates.includes(dateStr)) eventDates.push(dateStr);
      }
    });
  }
  const eventDateDisplay =
    eventDates.length > 0 ? eventDates.join(", ") : formatDate(order.createdAt);

  const getMealTypePriority = (type: string) => {
    const priorities: Record<string, number> = {
      BREAKFAST: 1,
      LUNCH: 2,
      DINNER: 3,
      SNACKS: 4,
    };
    return priorities[type?.toUpperCase()] || 99;
  };

  type SessionGroup = {
    menuType: string;
    members?: number;
    services?: string[];
    items: any[];
  };
  const byDate: Record<string, SessionGroup[]> = {};

  const addToDate = (
    date: string,
    sessionKey: string,
    menuType: string,
    item: any,
    members?: number,
    services?: string[],
  ) => {
    if (!byDate[date]) byDate[date] = [];
    const groupKey = sessionKey || `legacy_${menuType}`;
    let session = byDate[date].find((s) => (s as any)._key === groupKey);
    if (!session) {
      session = { menuType, members, services, items: [] } as SessionGroup & {
        _key?: string;
      };
      (session as any)._key = groupKey;
      byDate[date].push(session);
    }
    session.items.push(item);
    if (members != null) session.members = members;
    if (services?.length) session.services = services;
  };

  if (mealTypeAmounts) {
    Object.entries(mealTypeAmounts).forEach(([key, data]) => {
      const d =
        typeof data === "object" && data !== null && data.date
          ? String(data.date).split("T")[0]
          : null;
      if (d) {
        if (!byDate[d]) byDate[d] = [];
        const menuType = (data as any)?.menuType || "OTHER";
        const groupKey = key || `legacy_${menuType}`;
        if (!byDate[d].some((s: any) => s._key === groupKey)) {
          const session = {
            menuType,
            members: (data as any)?.numberOfMembers,
            services: (data as any)?.services,
            items: [],
          } as SessionGroup & { _key?: string };
          (session as any)._key = groupKey;
          byDate[d].push(session);
        }
      }
    });
  }

  const resolveSessionData = (
    sessionKey: string,
  ): { data: any; resolvedKey: string } | null => {
    const sk = typeof sessionKey === "string" ? sessionKey.trim() : "";
    if (!sk || !mealTypeAmounts) return null;
    const direct = mealTypeAmounts[sk];
    if (typeof direct === "object" && direct !== null)
      return { data: direct, resolvedKey: sk };
    const keyLower = sk.toLowerCase();
    const found = Object.entries(mealTypeAmounts).find(
      ([k]) => k.toLowerCase() === keyLower,
    );
    if (found) {
      const v = found[1];
      return typeof v === "object" && v !== null
        ? { data: v, resolvedKey: found[0] }
        : null;
    }
    return null;
  };

  (order.items || []).forEach((item: any) => {
    const sessionKey = item.mealType || "";
    const resolved = resolveSessionData(sessionKey);
    const sessionData = resolved?.data ?? null;
    const resolvedKey = resolved?.resolvedKey || sessionKey;

    const menuType = sessionData?.menuType || item.menuItem?.type || "OTHER";
    const rawDate = sessionData?.date
      ? String(sessionData.date).split("T")[0]
      : null;
    const dateKey = rawDate || eventDateDisplay;
    const members = sessionData?.numberOfMembers;
    const services = sessionData?.services;

    addToDate(dateKey, resolvedKey, menuType, item, members, services);
  });

  const sortedDates = Object.keys(byDate).sort((a, b) => {
    const da = new Date(a).getTime();
    const db = new Date(b).getTime();
    return isNaN(da) ? 1 : isNaN(db) ? -1 : da - db;
  });

  let menuItemsHtml = "";
  sortedDates.forEach((dateKey) => {
    const sessions = byDate[dateKey]
      .filter((s) => s.items.length > 0)
      .sort(
        (a, b) =>
          getMealTypePriority(a.menuType) - getMealTypePriority(b.menuType),
      );
    if (sessions.length === 0) return;
    const dateDisplay = /^\d{4}-\d{2}-\d{2}/.test(dateKey)
      ? formatDate(dateKey)
      : dateKey;
    menuItemsHtml += `
      <div style="width: 100%; font-weight: 700; font-size: 12px; margin-top: 12px; margin-bottom: 4px; color: #444; text-transform: uppercase; padding-bottom: 2px; border-bottom: 1px solid #ddd; font-family: 'Poppins', sans-serif;">
        Date: ${dateDisplay}
      </div>
    `;
    sessions.forEach((session) => {
      const memberInfo = session.members ? ` (${session.members} Members)` : "";
      const servicesLabel = session.services?.length
        ? ` - Services: ${session.services
            .map((s: string) =>
              s
                .split("_")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" "),
            )
            .join(", ")}`
        : "";
      menuItemsHtml += `
      <div style="width: 100%; font-weight: 700; font-size: 14px; margin-top: 6px; margin-bottom: 3px; color: #222; text-transform: uppercase; padding-bottom: 2px; font-family: 'Poppins', sans-serif;">
        ${sanitizeMealLabel(session.menuType)}${memberInfo}${servicesLabel}
      </div>
    `;
      session.items.forEach((item: any, index: number) => {
        const itemName = useEnglish
          ? item.menuItem?.name || item.menuItem?.nameTelugu || "Unknown Item"
          : item.menuItem?.nameTelugu || item.menuItem?.name || "Unknown Item";
        menuItemsHtml += `
        <div style="display: inline-block; width: 24%; padding: 2px 4px; font-family: 'Poppins', sans-serif; line-height: 1.3; font-weight: 600; font-size: 13px;">
          ${index + 1}. ${itemName}${item.customization ? ` (${item.customization})` : ""}
        </div>
      `;
      });
    });
  });

  let stallsHtml = "";
  if (order.stalls && Array.isArray(order.stalls) && order.stalls.length > 0) {
    stallsHtml = `
      <div class="section">
        <div class="section-title">Stalls</div>
        <div style="font-size: 11px;">
      ${order.stalls.map((stall: any, idx: number) => `<div class="menu-item">${idx + 1}. ${stall.category}${stall.description ? ` - ${stall.description}` : ""}</div>`).join("")}
        </div>
      </div>
    `;
  }

  let financialsHtml = "";
  if (showFinancials) {
    const total = Number(order.totalAmount) || 0;
    const advance = Number(order.advancePaid) || 0;
    const remaining = Number(order.remainingAmount) || 0;
    const paymentHistory = Array.isArray(bill?.paymentHistory)
      ? bill.paymentHistory
      : [];

    financialsHtml = `
      <div class="section" style="margin-top: 30px; border-top: 2px solid #333; padding-top: 20px;">
        <div class="section-title" style="font-size: 18px; color: #1a1a1a;">Financial Summary & Bills</div>
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div style="flex: 1; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Total Amount</div>
            <div style="font-size: 20px; font-weight: 800; color: #1a1a1a;">${formatCurrency(total)}</div>
          </div>
          <div style="flex: 1; background: #f0fdf4; padding: 15px; border-radius: 12px; border: 1px solid #dcfce7;">
            <div style="font-size: 10px; font-weight: 700; color: #166534; text-transform: uppercase; margin-bottom: 4px;">Paid (Advance)</div>
            <div style="font-size: 20px; font-weight: 800; color: #15803d;">${formatCurrency(advance)}</div>
          </div>
          <div style="flex: 1; background: #fff1f2; padding: 15px; border-radius: 12px; border: 1px solid #ffe4e6;">
            <div style="font-size: 10px; font-weight: 700; color: #9f1239; text-transform: uppercase; margin-bottom: 4px;">Balance Due</div>
            <div style="font-size: 20px; font-weight: 800; color: #be123c;">${remaining === 0 ? "PAID" : formatCurrency(remaining)}</div>
          </div>
        </div>

        ${
          paymentHistory.length > 0
            ? `
          <div style="margin-top: 20px;">
            <div style="font-size: 12px; font-weight: 700; color: #444; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">Transaction History</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Date</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Activity</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e2e8f0;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${paymentHistory
                  .map(
                    (p: any) => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${formatDate(p.date)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">
                      <div style="font-weight: 600;">${p.notes || (Number(p.amount) > 0 ? `Payment via ${p.method || "Cash"}` : "Update")}</div>
                      <div style="font-size: 9px; color: #666; text-transform: capitalize;">Source: ${p.source}</div>
                    </td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #f1f5f9; font-weight: 700;">
                      ${Number(p.amount) > 0 ? formatCurrency(Number(p.amount)) : "-"}
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  return `
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { font-family: 'Poppins', sans-serif !important; }
      .header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #333; }
      .header-top { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 10px; color: #555; }
      .header-main { font-size: 28px; font-weight: 700; margin: 15px 0 8px 0; letter-spacing: 1px; color: #1a1a1a; }
      .header-subtitle { font-size: 14px; color: #666; margin-bottom: 12px; font-style: italic; }
      .header-details { font-size: 9px; line-height: 1.6; color: #444; margin-top: 10px; }
      .header-details div { margin-bottom: 3px; }
      .section { margin-bottom: 15px; }
      .section-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #ddd; color: #222; }
      .info-row { margin-bottom: 6px; }
      .info-label { font-weight: 600; display: inline-block; width: 120px; }
      .menu-item { padding: 2px 4px; font-size: 11px; line-height: 1.3; font-weight: 600; }
    </style>
    <div class="header">
      <div class="header-top">
        <div>Telidevara Rajendraprasad</div>
        <div>ART FOOD ZONE (A Food Caterers)</div>
      </div>
      <div class="header-main">SRIVATSASA & KOWNDINYA CATERERS</div>
      <div class="header-subtitle">(Pure Vegetarian)</div>
      <div class="header-details">
        <div>Regd. No: 2361930100031</div>
        <div>Plot No. 115, Padmavathi Nagar, Bank Colony, Saheb Nag Vanathalipuram, Hyderabad - 500070.</div>
        <div>Email: pujyasri1989cya@gmail.com, Cell: 9866525102, 9963691393, 9390015302</div>
      </div>
    </div>
    <div style="display: flex; gap: 20px; margin-bottom: 25px;">
      <div class="section" style="flex: 1;">
        <div class="section-title">Customer Details</div>
        <div class="info-row"><span class="info-label">Name:</span> ${customer?.name || "N/A"}</div>
        <div class="info-row"><span class="info-label">Phone:</span> ${customer?.phone || "N/A"}</div>
        <div class="info-row"><span class="info-label">Email:</span> ${customer?.email || "N/A"}</div>
        <div class="info-row"><span class="info-label">Address:</span> ${customer?.address || "N/A"}</div>
      </div>
      <div class="section" style="flex: 1;">
        <div class="section-title">Order Information</div>
        <div class="info-row"><span class="info-label">Event Date:</span> ${eventDateDisplay}</div>
        <div class="info-row"><span class="info-label">Order ID:</span> SKC-ORDER-${(order as any).serialNumber || order.id.slice(0, 8).toUpperCase()}</div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Menu Items</div>
      <div style="width: 100%;">
        ${menuItemsHtml}
      </div>
    </div>
    ${stallsHtml}
    ${financialsHtml}
  `;
}
