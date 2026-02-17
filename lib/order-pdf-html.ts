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
  },
): string {
  const {
    formatDate,
    formatCurrency = (v) => `\u20B9${v.toLocaleString("en-IN")}`,
    bill: externalBill,
  } = options;

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

  // 1. Organize data by Date -> MealTypes
  type MealSummary = {
    type: string;
    label: string;
    count: number;
    amount: number;
    rate: number;
  };
  const summaryByDate: Record<string, MealSummary[]> = {};

  // Helper to safely get string
  const safeString = (val: any) =>
    typeof val === "string" ? val : String(val || "");

  if (mealTypeAmounts) {
    Object.entries(mealTypeAmounts).forEach(([key, data]) => {
      if (typeof data === "object" && data !== null && data.date) {
        const dateStr = safeString(data.date).split("T")[0];
        if (!summaryByDate[dateStr]) summaryByDate[dateStr] = [];

        let menuType = data.menuType;
        if (!menuType) {
          // Fallback to key if reasonable
          if (key && !key.includes("-") && !key.startsWith("session_")) {
            menuType = key;
          }
        }
        menuType = menuType || "OTHER";

        const label = sanitizeMealLabel(menuType);
        const count = Number(data.numberOfMembers) || 0;
        const amount = Number(data.amount) || 0;
        // Calculate rate if possible, otherwise 0
        const rate = count > 0 && amount > 0 ? amount / count : 0;

        summaryByDate[dateStr].push({
          type: menuType,
          label,
          count,
          amount,
          rate,
        });
      }
    });
  }

  // Sort dates
  const sortedDates = Object.keys(summaryByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  const isMultiEvent = sortedDates.length > 1;

  // Build Summary Rows HTML
  let summaryRowsHtml = "";
  if (sortedDates.length === 0) {
    // Fallback if no structured data
    summaryRowsHtml = `<tr><td colspan="4" style="text-align:center; padding: 20px;">No specific event details found.</td></tr>`;
  } else {
    sortedDates.forEach((dateStr) => {
      // Date Header Row - ONLY SHOW if multi-event
      if (isMultiEvent) {
        summaryRowsHtml += `
            <tr style="background-color: #f3f3f3;">
                <td colspan="4" style="padding: 6px 10px; font-weight: 700; font-size: 12px; border-bottom: 1px solid #000;">
                    Event Date: ${formatDate(dateStr)}
                </td>
            </tr>
          `;
      }

      // Sort meals by priority (Breakfast -> Lunch -> Dinner)
      const meals = summaryByDate[dateStr].sort((a, b) => {
        const order = { breakfast: 1, lunch: 2, snacks: 3, dinner: 4 };
        const pa = order[a.type.toLowerCase() as keyof typeof order] || 99;
        const pb = order[b.type.toLowerCase() as keyof typeof order] || 99;
        return pa - pb;
      });

      meals.forEach((meal) => {
        summaryRowsHtml += `
                <tr>
                    <td style="padding: 8px 10px; font-size: 12px; font-weight: 600; border-bottom: 1px solid #ddd;">
                        ${meal.label} No of Persons: <span style="font-weight: 500;">${meal.count}</span>
                        <div style="font-size: 10px; color: #666; font-weight: 400; margin-top: 2px;">${formatDate(dateStr)}</div>
                    </td>
                    <td style="padding: 8px 10px; font-size: 12px; border-bottom: 1px solid #ddd; text-align: center;">
                        ${meal.count}
                    </td>
                     <td style="padding: 8px 10px; font-size: 12px; border-bottom: 1px solid #ddd; text-align: center;">
                        ${meal.rate > 0 ? formatCurrency(meal.rate) : "-"}
                    </td>
                    <td style="padding: 8px 10px; font-size: 12px; font-weight: 700; border-bottom: 1px solid #ddd; text-align: right;">
                        ${formatCurrency(meal.amount)}
                    </td>
                </tr>
              `;
      });
    });
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

  const billNo =
    bill?.serialNumber != null
      ? `SKC-${bill.serialNumber}`
      : `SKC-${order.id.slice(0, 6).toUpperCase()}`;

  return `
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      * { font-family: 'Poppins', sans-serif !important; box-sizing: border-box; }
      body { -webkit-print-color-adjust: exact; }
    </style>
    
    <div style="width: 100%; padding: 10px; color: #000;">
        
        <!-- HEADER -->
        <div style="text-align: center; margin-bottom: 30px;">
             <div style="font-size: 10px; font-weight: 600; float: left;">Telidevara Rajendraprasad</div>
             <div style="font-size: 10px; font-weight: 600; float: right;">ART FOOD ZONE</div>
             <div style="clear: both;"></div>
             
             <h1 style="font-size: 24px; font-weight: 800; margin: 10px 0 5px; letter-spacing: 0.5px; text-transform: uppercase;">SRIVATSASA & KOUNDINYA CATERERS</h1>
             <div style="font-size: 12px; font-style: italic; font-weight: 500; margin-bottom: 8px;">(Pure Vegetarian)</div>
             
             <div style="font-size: 9px; line-height: 1.4; color: #333;">
                <div>Regd. No. 23619301000331</div>
                <div>Plot No. 115, Padmavathi Nagar, Bank Colony, Saheb Nagar, Vanasthalipuram, Hyderabad - 500070.</div>
                <div>Email: pujyasri1989cya@gmail.com, Cell: 9866525102, 9963691393, 9390015302</div>
             </div>
        </div>

        <!-- CUSTOMER DETAILS (Centered & Top) -->
        <div style="margin-bottom: 20px;">
             <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-weight: 800; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #ddd; display: inline-block; padding-bottom: 4px;">CUSTOMER DETAILS</div>
             </div>

             <div style="font-size: 12px; line-height: 1.6; max-width: 600px; margin: 0 auto;">
                <div style="display: flex; margin-bottom: 4px;">
                    <div style="width: 140px; font-weight: 600;">Name:</div>
                    <div style="font-weight: 500;">${safeString(customer?.name)}</div>
                </div>
                 <div style="display: flex; margin-bottom: 4px;">
                    <div style="width: 140px; font-weight: 600;">Address:</div>
                    <div style="font-weight: 500;">${safeString(customer?.address) || "new nandhi hills RoadNO 1"}</div>
                </div>
                 <div style="display: flex; margin-bottom: 4px;">
                    <div style="width: 140px; font-weight: 600;">Contact No:</div>
                    <div style="font-weight: 500;">${safeString(customer?.phone)}</div>
                </div>
                ${
                  !isMultiEvent
                    ? `
                <div style="display: flex; margin-bottom: 4px;">
                    <div style="width: 140px; font-weight: 600;">Function Date:</div>
                    <div style="font-weight: 500;">${sortedDates.length > 0 ? formatDate(sortedDates[0]) : "N/A"}</div>
                </div>`
                    : ""
                }
            </div>
        </div>

        <!-- BILL NO & DATE (Below Customer Details) -->
        <div style="margin-bottom: 20px; font-size: 12px; line-height: 1.5; border-top: 1px dashed #ccc; padding-top: 10px;">
            <div><span style="font-weight: 700; width: 80px; display: inline-block;">Bill No:</span> ${billNo}</div>
            <div><span style="font-weight: 500; width: 80px; display: inline-block;">Date:</span> ${formatDate(new Date().toISOString())}</div>
        </div>

        <!-- BILL SUMMARY BOX -->
        <div style="border: 2px solid #000; padding: 0;">
             <!-- Box Header -->
             <div style="text-align: center; padding: 8px; font-weight: 800; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #000;">
                BILL SUMMARY
             </div>
             
             <!-- Table -->
             <table style="width: 100%; border-collapse: collapse;">
                <!-- We don't really need a thead if standard rows explain themselves, but lets add hidden one for sizing -->
                 <colgroup>
                    <col style="width: 45%;">
                    <col style="width: 15%;">
                    <col style="width: 20%;">
                    <col style="width: 20%;">
                </colgroup>
                
                ${summaryRowsHtml}

             </table>

            <!-- TOTALS (Bottom of Box) -->
            <div style="margin-top: 20px; border-top: 2px solid #000;">
                 <div style="display: flex; justify-content: space-between; padding: 8px 15px; font-size: 12px; font-weight: 700;">
                    <div>Water Bottles:</div>
                    <div>${order.waterBottlesPrice ? formatCurrency(order.waterBottlesPrice) : "-"}</div>
                 </div>
                 <div style="display: flex; justify-content: space-between; padding: 8px 15px; font-size: 12px; font-weight: 700;">
                    <div>Advance Paid:</div>
                    <div>${formatCurrency(finalPaid)}</div>
                 </div>
                 <div style="display: flex; justify-content: space-between; padding: 8px 15px; font-size: 13px; font-weight: 800; border-top: 1px solid #ddd;">
                    <div>Grand Total:</div>
                    <div>${formatCurrency(finalTotal)}</div>
                 </div>
                 <div style="display: flex; justify-content: space-between; padding: 8px 15px; font-size: 13px; font-weight: 800;">
                    <div>Balance Amount:</div>
                    <div>${formatCurrency(finalRemaining)}</div>
                 </div>
            </div>
        </div>

        <!-- TERMS & CONDITIONS -->
        <div style="margin-top: 30px;">
            <div style="font-weight: 700; font-size: 12px; text-align: center; text-transform: uppercase; margin-bottom: 10px;">TERMS & CONDITIONS</div>
            <div style="font-size: 10px; line-height: 1.5; color: #333;">
                <div style="margin-bottom: 4px;">70% Advance Amount should be paid at the time of booking.</div>
                <div style="margin-bottom: 4px;">The Remaining 30% will be paid after the function based on the party menu.</div>
                <div style="margin-bottom: 4px;">Advance amount will not be refunded. (4) Childrens will be charged as same as adults.</div>
                <div>Preparation of Seasonal/Revelantables veg food is sololy handled by Srivatsaa & Kowndinya Caterers only.</div>
            </div>
        </div>

        <!-- SIGNATURES -->
        <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="text-align: left;">
                <div style="border-top: 1px dashed #999; width: 200px; margin-bottom: 5px;"></div>
                <div style="font-size: 11px; font-weight: 600;">Authorized Signature</div>
            </div>
            <div style="text-align: right;">
                 <div style="border-top: 1px dashed #999; width: 200px; margin-bottom: 5px; margin-left: auto;"></div>
                <div style="font-size: 11px; font-weight: 600;">Customer Signature</div>
            </div>
        </div>

    </div>
  `;
}
