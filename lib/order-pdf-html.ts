/**
 * Builds order PDF HTML (menu + event details) for html2canvas rendering
 * REDESIGNED: Summary Format matching user screenshot
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
    isQuotation?: boolean;
    hideMenuDetails?: boolean;
  },
): string {
  const {
    formatDate,
    formatCurrency = (v) => `\u20B9${v.toLocaleString("en-IN")}`,
    bill: externalBill,
    isQuotation = false,
  } = options;

  const themeColor = isQuotation ? "#7c3aed" : "#000000"; // Purple-600 for quotations, Black for bills
  const documentTitle = isQuotation ? "QUOTATION" : "BILL SUMMARY";
  const idLabel = isQuotation ? "Quotation No:" : "Bill No:";

  const customer = order.customer;
  const bill = externalBill || order.bill;
  const mealTypeAmounts = order.mealTypeAmounts as Record<
    string,
    | {
        amount?: number;
        date?: string;
        numberOfMembers?: number;
        services?: string[];
        menuType?: string;
      }
    | number
  > | null;

  // Organize data by Date -> MealTypes/Stalls
  const summaryByDate: Record<string, any[]> = {};

  const safeString = (val: any) =>
    typeof val === "string" ? val : String(val || "");

  const normalizeDate = (d: any): string => {
    if (!d) return "no-date";
    const s = String(d);
    if (s.includes("T")) return s.split("T")[0];
    // If it's YYYY-MM-DD but no T
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    // Otherwise try parsing
    try {
      const date = new Date(s);
      if (isNaN(date.getTime())) return "no-date";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return "no-date";
    }
  };

  const addItemToSummary = (date: any, itemData: any) => {
    const dStr = normalizeDate(date);
    if (!summaryByDate[dStr]) summaryByDate[dStr] = [];
    summaryByDate[dStr].push(itemData);
  };

  // Add regular meal sessions
  if (mealTypeAmounts) {
    Object.entries(mealTypeAmounts).forEach(([key, data]) => {
      if (typeof data === "object" && data !== null) {
        addItemToSummary(data.date, {
          ...data,
          id: key,
          label: sanitizeMealLabel(data.menuType || key || "Other"),
          type: data.menuType || "other"
        });
      }
    });
  }

  // Add stalls if they have a date (or default to event date)
  if (order.stalls && Array.isArray(order.stalls)) {
    order.stalls.forEach((stall: any) => {
      addItemToSummary(stall.date || order.eventDate, {
        ...stall,
        isStall: true,
        menuType: 'stalls',
        label: stall.category || "Stall",
        type: 'stalls',
        amount: stall.cost || 0
      });
    });
  }
  // Sort dates chronologically
  const sortedDates = Object.keys(summaryByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  // Map items by mealType for easy lookup
  const itemsByMealType: Record<string, any[]> = {};
  if (order.items && Array.isArray(order.items)) {
    order.items.forEach((item: any) => {
      const mt = item.mealType || 'other';
      if (!itemsByMealType[mt]) itemsByMealType[mt] = [];
      itemsByMealType[mt].push(item);
    });
  }

  const isMultiEvent = sortedDates.length > 1;

  // Build Summary Rows HTML
  let summaryRowsHtml = "";
  if (sortedDates.length === 0) {
    // Fallback if no structured data
    summaryRowsHtml = `<tr><td colspan="4" style="text-align:center; padding: 20px;">No specific event details found.</td></tr>`;
  } else {
    sortedDates.forEach((dateStr: string) => {
      // Date Header Row - ONLY SHOW if multi-event
      if (isMultiEvent) {
        summaryRowsHtml += `
            <tr class="pdf-row pdf-section-header" style="background-color: #f3f3f3;">
                <td colspan="4" style="padding: 4px 10px; font-weight: 700; font-size: 11px; border-bottom: 1px solid #000;">
                    Event Date: ${formatDate(dateStr)}
                </td>
            </tr>
          `;
      }

      // Sort meals by priority (chronological order)
      const meals = summaryByDate[dateStr].sort((a, b) => {
        // 1. Priority by meal type
        const mealOrders: Record<string, number> = { 
          'breakfast': 1, 
          'lunch': 2, 
          'hi-tea': 3,
          'hi tea': 3,
          'snacks': 4, 
          'tiffin': 5,
          'dinner': 6,
          'session': 7,
          'stalls': 8,
          'other': 9 
        };
        const pa = mealOrders[a.type?.toLowerCase()] || 99;
        const pb = mealOrders[b.type?.toLowerCase()] || 99;
        
        if (pa !== pb) return pa - pb;

        // 2. Secondary sort by time if available
        if (a.time && b.time) {
          return String(a.time).localeCompare(String(b.time));
        }
        return 0;
      });

      meals.forEach((meal) => {
        const count = Number(meal.numberOfMembers || meal.count || 0);
        const amount = Number(meal.amount || 0);
        const rate = count > 0 ? amount / count : 0;

        const menuItemsHtml = "";

        summaryRowsHtml += `
                <tr class="pdf-row">
                    <td style="padding: 5px 10px; font-size: 11px; font-weight: 600; border-bottom: 1px solid #ddd; vertical-align: top;">
                        ${meal.label}
                        ${meal.time ? `<span style="font-size: 9px; color: #666; margin-left: 5px;">@ ${meal.time}</span>` : ""}
                        <div style="font-size: 9px; color: #333; font-weight: 400; margin-top: 1px;">${formatDate(dateStr)}</div>
                        ${menuItemsHtml}
                    </td>
                    <td style="padding: 5px 10px; font-size: 11px; border-bottom: 1px solid #ddd; text-align: center; font-weight: 500; vertical-align: top;">
                        ${count}
                    </td>
                     <td style="padding: 5px 10px; font-size: 11px; border-bottom: 1px solid #ddd; text-align: center; font-weight: 500; vertical-align: top;">
                        ${rate > 0 ? formatCurrency(rate) : "-"}
                    </td>
                    <td style="padding: 5px 10px; font-size: 11px; font-weight: 700; border-bottom: 1px solid #ddd; text-align: right; vertical-align: top;">
                        ${formatCurrency(amount)}
                    </td>
                </tr>
              `;
      });
    });
  }

  // Build Menu Details HTML (Separate Section)
  let menuDetailsHtml = "";
  if (sortedDates.length > 0 && !options.hideMenuDetails) {
    menuDetailsHtml = `
      <div style="margin-top: 25px; page-break-before: auto;">
        <div style="text-align: center; margin-bottom: 15px;">
          <div style="font-weight: 800; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid ${themeColor}; display: inline-block; padding-bottom: 3px; color: ${themeColor};">MENU DETAILS</div>
        </div>
        <div style="border: 2px solid ${themeColor}; padding: 15px; border-radius: 8px;">
    `;

    sortedDates.forEach((dateStr) => {
      const dateDisplay = formatDate(dateStr);
      const meals = summaryByDate[dateStr].filter(m => !m.isStall).sort((a, b) => {
        const mealOrders: Record<string, number> = { 'breakfast': 1, 'lunch': 2, 'hi-tea': 3, 'hi tea': 3, 'snacks': 4, 'tiffin': 5, 'dinner': 6, 'session': 7, 'other': 9 };
        return (mealOrders[a.type?.toLowerCase()] || 99) - (mealOrders[b.type?.toLowerCase()] || 99);
      });

      if (meals.length > 0) {
        if (isMultiEvent) {
          menuDetailsHtml += `
            <div style="font-weight: 700; font-size: 11px; margin-top: 15px; margin-bottom: 10px; color: #333; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
              📅 ${dateDisplay}
            </div>
          `;
        }

        meals.forEach((meal) => {
          const items = itemsByMealType[meal.id] || [];
          if (items.length > 0) {
            menuDetailsHtml += `
              <div style="margin-bottom: 15px;">
                <div style="font-weight: 700; font-size: 10px; color: ${themeColor}; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                  <span style="background: ${isQuotation ? '#f5f3ff' : '#f0f0f0'}; padding: 2px 8px; border-radius: 4px;">${meal.label}</span>
                  ${meal.time ? `<span style="font-weight: 500; color: #666; text-transform: none;">@ ${meal.time}</span>` : ""}
                  ${meal.numberOfMembers ? `<span style="font-weight: 500; color: #666; text-transform: none;">(${meal.numberOfMembers} Members)</span>` : ""}
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                  ${items.map((it, idx) => {
                    const name = it.menuItem?.name || "Item";
                    const telugu = it.menuItem?.nameTelugu;
                    const cust = it.customization;
                    return `
                      <div style="font-size: 9px; line-height: 1.4; color: #000; font-weight: 600;">
                        ${idx + 1}. ${name}${telugu ? `<br/><span style="color: #444; font-size: 8px;">(${telugu})</span>` : ""}${cust ? `<br/><i style="color: #7c3aed; font-size: 8px;">- ${cust}</i>` : ""}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }
        });
      }
    });

    menuDetailsHtml += `
        </div>
      </div>
    `;
  }

  // Financials
  const totalAmount = Number(order.totalAmount || 0);
  const paidAmount =
    Number(order.advancePaid || 0) + Number(bill?.paidAmount || 0); // Combine order advance + bill payments if distinct? Usually bill payment tracks all.
  // Actually bill.paidAmount should track total paid.
  // But let's use the values passed in mainly.
  const finalTotal = Number(bill?.totalAmount || order.totalAmount || 0);
  const finalPaid = Number(bill?.paidAmount || order.advancePaid || 0);
  const finalRemaining = Number(
    bill?.remainingAmount || order.remainingAmount || 0,
  );
  const billNote = (() => {
    if (!bill) return "";
    if (typeof (bill as any).notes === "string" && (bill as any).notes.trim()) {
      return (bill as any).notes.trim();
    }
    const history = Array.isArray((bill as any).paymentHistory)
      ? (bill as any).paymentHistory
      : [];
    const noteEntry = [...history]
      .reverse()
      .find(
        (entry: any) =>
          entry?.source === "bill_note" && typeof entry?.notes === "string",
      );
    return noteEntry?.notes?.trim?.() || "";
  })();

  const billNo =
    bill?.serialNumber != null
      ? `SKC-${bill.serialNumber}`
    : isQuotation 
      ? `QT-${order.id.slice(0, 6).toUpperCase()}`
      : `SKC-${order.id.slice(0, 6).toUpperCase()}`;

  return `
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      * { font-family: 'Poppins', sans-serif !important; box-sizing: border-box; margin: 0; padding: 0; }
      body { -webkit-print-color-adjust: exact; background-color: white; }
      .pdf-row { page-break-inside: avoid !important; break-inside: avoid !important; }
      table { border-collapse: collapse; page-break-inside: auto; }
    </style>
    
    <div style="width: 100%; padding: 8px; color: #000;">
        
        <!-- HEADER -->
        <div style="margin-bottom: 25px;">
             <!-- Top Info -->
             <div style="font-size: 10px; font-weight: 600; display: flex; justify-content: space-between; margin-bottom: 12px; color: #000;">
                <span>Telidevara Rajendraprasad</span>
                <span>ART FOOD ZONE</span>
             </div>

             <!-- Branding Row: Logo + Company Name -->
             <div style="display: flex; align-items: center; justify-content: center; width: 100%; gap: 15px; margin-bottom: 5px;">
                  <div style="flex: 0 0 75px;">
                      <img src="${window.location.origin}/images/logo.jpg" alt="SKC Logo" style="width: 75px; height: 75px; object-fit: contain; border-radius: 50%;" />
                  </div>
                  <div style="flex: 1; text-align: center; margin-right: 75px;">
                      <h1 style="font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 0.5px; text-transform: uppercase; color: #000;">SRIVATSASA & KOWNDINYA CATERERS</h1>
                      <div style="font-size: 13px; font-style: italic; font-weight: 600; color: #000; margin-top: 2px;">(Pure Vegetarian)</div>
                  </div>
             </div>
             
             <!-- Registration & Address -->
             <div style="text-align: center; font-size: 9px; line-height: 1.5; color: #000; max-width: 600px; margin: 0 auto; border-top: 1px solid #eee; padding-top: 8px; margin-top: 10px;">
                <div style="font-weight: 700;">Regd. No. 23619301000331</div>
                <div>Plot No. 115, Padmavathi Nagar, Bank Colony, Saheb Nagar, Vanasthalipuram, Hyderabad - 500070.</div>
                <div style="font-weight: 600; margin-top: 2px;">Email: pujyasri1989cya@gmail.com, Cell: 9866525102, 9963691393, 9390015302</div>
             </div>
        </div>

        <!-- CUSTOMER DETAILS -->
        <div style="margin-bottom: 10px;">
             <div style="text-align: center; margin-bottom: 8px;">
                <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid ${themeColor}; display: inline-block; padding-bottom: 2px; color: ${themeColor};">${isQuotation ? 'QUOTATION DETAILS' : 'CUSTOMER DETAILS'}</div>
             </div>

             <div style="font-size: 11px; line-height: 1.4; max-width: 600px; margin: 0 auto;">
                <div style="display: flex; margin-bottom: 2px;">
                    <div style="width: 120px; font-weight: 600;">Name:</div>
                    <div style="font-weight: 500;">${safeString(customer?.name)}</div>
                </div>
                 <div style="display: flex; margin-bottom: 2px;">
                    <div style="width: 120px; font-weight: 600;">Address:</div>
                    <div style="font-weight: 500;">${safeString(customer?.address) || "new nandhi hills RoadNO 1"}</div>
                </div>
                 <div style="display: flex; margin-bottom: 2px;">
                    <div style="width: 120px; font-weight: 600;">Contact No:</div>
                    <div style="font-weight: 500;">${safeString(customer?.phone)}</div>
                </div>
                ${
                  !isMultiEvent
                    ? `
                <div style="display: flex; margin-bottom: 2px;">
                    <div style="width: 120px; font-weight: 600;">Function Date:</div>
                    <div style="font-weight: 500;">${sortedDates.length > 0 ? formatDate(sortedDates[0]) : "N/A"}</div>
                </div>`
                    : ""
                }
            </div>
        </div>

        <!-- BILL NO & DATE -->
        <div style="margin-bottom: 10px; font-size: 11px; line-height: 1.4; border-top: 1px dashed #ccc; padding-top: 6px;">
            <div><span style="font-weight: 700; width: 100px; display: inline-block;">${idLabel}</span> ${billNo}</div>
            <div><span style="font-weight: 500; width: 100px; display: inline-block;">Date:</span> ${formatDate(new Date().toISOString())}</div>
        </div>

        <!-- BILL SUMMARY BOX -->
        <div style="border: 2px solid ${themeColor}; padding: 0;">
             <!-- Box Header -->
             <div style="text-align: center; padding: 5px; font-weight: 800; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid ${themeColor}; background-color: ${isQuotation ? '#f5f3ff' : 'transparent'}; color: ${themeColor};">
                ${documentTitle}
             </div>
             
             <!-- Table -->
             <table style="width: 100%; border-collapse: collapse;">
                 <colgroup>
                    <col style="width: 45%;">
                    <col style="width: 15%;">
                    <col style="width: 20%;">
                    <col style="width: 20%;">
                </colgroup>
                
                <!-- Table Headers -->
                <thead>
                    <tr style="background-color: ${isQuotation ? '#f5f3ff' : '#f9f9f9'}; border-bottom: 2px solid ${themeColor};">
                        <th style="padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${themeColor};">Description / Event</th>
                        <th style="padding: 8px 10px; text-align: center; font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${themeColor};">Guests</th>
                        <th style="padding: 8px 10px; text-align: center; font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${themeColor};">Rate</th>
                        <th style="padding: 8px 10px; text-align: right; font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${themeColor};">Total</th>
                    </tr>
                </thead>
                
                <tbody>
                    ${summaryRowsHtml}
                </tbody>

             </table>

            <!-- TOTALS (Bottom of Box) -->
            <div style="border-top: 2px solid ${themeColor};">
                 <div style="display: flex; justify-content: space-between; padding: 4px 12px; font-size: 11px; font-weight: 700;">
                    <div>Transport Cost:</div>
                    <div>${order.transportCost && Number(order.transportCost) > 0 ? formatCurrency(Number(order.transportCost)) : "-"}</div>
                 </div>
                 <div style="display: flex; justify-content: space-between; padding: 4px 12px; font-size: 11px; font-weight: 700;">
                    <div>Water Bottles:</div>
                    <div>${order.waterBottlesCost && Number(order.waterBottlesCost) > 0 ? formatCurrency(Number(order.waterBottlesCost)) : "-"}</div>
                 </div>
                 <div style="display: flex; justify-content: space-between; padding: 4px 12px; font-size: 11px; font-weight: 700; color: #000;">
                    <div>Discount:</div>
                    <div>${order.discount && Number(order.discount) > 0 ? `-${formatCurrency(Number(order.discount))}` : "-"}</div>
                 </div>
                 <div style="display: flex; justify-content: space-between; padding: 4px 12px; font-size: 11px; font-weight: 700;">
                    <div>Advance Paid:</div>
                    <div>${formatCurrency(finalPaid)}</div>
                 </div>
                  <div style="display: flex; justify-content: space-between; padding: 6px 12px; font-size: 13px; font-weight: 800; border-top: 2px solid ${themeColor}; background-color: ${isQuotation ? '#f5f3ff' : '#f9f9f9'};">
                    <div>Estimated Total:</div>
                    <div style="color: ${themeColor};">${formatCurrency(finalTotal)}</div>
                  </div>
                 <div style="display: flex; justify-content: space-between; padding: 5px 12px; font-size: 12px; font-weight: 800; color: #000;">
                    <div>Balance Amount:</div>
                    <div>${formatCurrency(finalRemaining)}</div>
                 </div>
            </div>
        </div>

        ${menuDetailsHtml}

        ${
          billNote
            ? `
        <div style="margin-top: 10px; border: 1px solid #ddd; background-color: #fafafa; border-radius: 6px; padding: 8px 10px;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px;">Note</div>
            <div style="font-size: 10px; line-height: 1.45; color: #333; white-space: pre-wrap;">${safeString(billNote)}</div>
        </div>
            `
            : ""
        }

        <!-- TERMS & CONDITIONS -->
        <div style="margin-top: 15px;">
            <div style="font-weight: 700; font-size: 11px; text-align: center; text-transform: uppercase; margin-bottom: 6px;">TERMS & CONDITIONS</div>
            <div style="font-size: 9px; line-height: 1.4; color: #000;">
                <div style="margin-bottom: 2px;">70% Advance Amount should be paid at the time of booking.</div>
                <div style="margin-bottom: 2px;">The Remaining 30% will be paid after the function based on the party menu.</div>
                <div style="margin-bottom: 2px;">Advance amount will not be refunded. (4) Childrens will be charged as same as adults.</div>
                <div>Preparation of Seasonal/Revelantables veg food is sololy handled by Srivatsaa & Kowndinya Caterers only.</div>
            </div>
        </div>

        <!-- SIGNATURES -->
        <div style="margin-top: 5px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="text-align: left; position: relative; width: 300px;">
                 <img src="${window.location.origin}/images/billstamp.png" alt="Stamp" style="position: relative; top: 10px; left: -40px; width: 90%; height: auto; max-height: 90px; object-fit: contain; opacity: 0.9;" />
                <div style="border-top: 1px dashed #999; width: 100%; margin-top: 3px;"></div>
                <div style="font-size: 10px; font-weight: 600;">Authorized Signature</div>
            </div>
            <div style="text-align: right;">
                 <div style="border-top: 1px dashed #999; width: 180px; margin-bottom: 3px; margin-left: auto;"></div>
                <div style="font-size: 10px; font-weight: 600;">Customer Signature</div>
            </div>
        </div>

    </div>
  `;
}
