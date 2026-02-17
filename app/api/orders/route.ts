import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isNonNegativeNumber, isNonEmptyString } from "@/lib/validation";
import { publishNotification } from "@/lib/notifications";
import { requireAuth } from "@/lib/require-auth";
import { transformDecimal } from "@/lib/decimal-utils";
import {
  sendOrderCreatedAlert,
  sendPaymentReceivedAlert,
} from "@/lib/email-alerts";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;
  try {
    // WORKAROUND: Prisma failing to fetch orders with MenuItems (text[] array column)
    // when using findMany with includes and orderBy.
    // We fetch IDs first, then fetch details sequentially to avoid the crash.

    // 1. Fetch all IDs ordered by date
    const orderIds = await prisma.order.findMany({
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch full details for each order sequentially
    const orders = [];
    for (const { id } of orderIds) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: true,
          supervisor: true,
          items: {
            include: {
              menuItem: true,
            },
          },
          bill: true,
        },
      });
      if (order) orders.push(order);
    }

    return NextResponse.json(transformDecimal(orders));
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;
  try {
    const data = await request.json();

    if (!isNonEmptyString(data.customerId)) {
      return NextResponse.json(
        { error: "Customer is required" },
        { status: 400 },
      );
    }
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { error: "At least one menu item is required" },
        { status: 400 },
      );
    }

    // Verify customer exists
    const customerExists = await prisma.customer.findUnique({
      where: { id: data.customerId },
      select: { id: true },
    });

    if (!customerExists) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Convert amounts to numbers to ensure proper type
    const totalAmount = parseFloat(data.totalAmount) || 0;
    const advancePaid = parseFloat(data.advancePaid) || 0;
    const discount = parseFloat(data.discount) || 0;
    const transportCost = parseFloat(data.transportCost) || 0;
    const waterBottlesCost = parseFloat(data.waterBottlesCost) || 0;

    // --- RECALCULATE TOTAL AMOUNT AS SAFETY CHECK ---
    let recalculatedMealTypesTotal = 0;
    if (data.mealTypeAmounts) {
      Object.values(data.mealTypeAmounts).forEach((mt: any) => {
        recalculatedMealTypesTotal +=
          (typeof mt === "object" ? mt.amount : mt) || 0;
      });
    }
    const recalculatedTotal = Math.max(
      0,
      recalculatedMealTypesTotal +
        transportCost +
        waterBottlesCost +
        (data.stalls || []).reduce(
          (sum: number, s: any) => sum + (parseFloat(s.cost) || 0),
          0,
        ) -
        discount,
    );

    // Use recalculated total if the provided total is 0 but we have amounts elsewhere
    const finalTotalAmount =
      totalAmount === 0 && recalculatedTotal > 0
        ? recalculatedTotal
        : totalAmount;
    const finalRemainingAmount =
      totalAmount === 0 && recalculatedTotal > 0
        ? Math.max(0, recalculatedTotal - advancePaid)
        : parseFloat(data.remainingAmount) || totalAmount - advancePaid;

    if (
      !isNonNegativeNumber(finalTotalAmount) ||
      !isNonNegativeNumber(advancePaid) ||
      !isNonNegativeNumber(finalRemainingAmount)
    ) {
      return NextResponse.json({ error: "Invalid amounts" }, { status: 400 });
    }

    const orderData: any = {
      customerId: data.customerId,
      totalAmount: finalTotalAmount,
      advancePaid: advancePaid,
      remainingAmount: finalRemainingAmount,
      status: data.status || "pending",
      eventName: data.eventName || null,
      eventDate: data.eventDate
        ? new Date(data.eventDate)
        : (() => {
            if (data.mealTypeAmounts) {
              const dates = Object.values(data.mealTypeAmounts)
                .map((mt: any) => mt.date)
                .filter((d) => !!d)
                .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
              if (dates.length > 0) return new Date(dates[0]);
            }
            return null;
          })(),
      services:
        data.services &&
        Array.isArray(data.services) &&
        data.services.length > 0
          ? data.services
          : null,
      numberOfMembers: data.numberOfMembers || null,
      mealTypeAmounts:
        data.mealTypeAmounts && Object.keys(data.mealTypeAmounts).length > 0
          ? data.mealTypeAmounts
          : null,
      events:
        data.mealTypeAmounts && Object.keys(data.mealTypeAmounts).length > 0
          ? data.mealTypeAmounts
          : null, // Store in events field for multi-event support
      stalls:
        data.stalls && Array.isArray(data.stalls) && data.stalls.length > 0
          ? data.stalls
          : null,
      transportCost: transportCost,
      waterBottlesCost: waterBottlesCost,
      discount: discount,
      items: {
        create: data.items.map((item: any) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity || 1,
          mealType: item.mealType || null, // Store which meal type this item was selected for
          customization: item.customization || null,
        })),
      },
    };

    // Create order only - bills will be generated when status changes to in_progress or completed
    const order = await prisma.order.create({
      data: orderData,
      include: {
        customer: true,
        supervisor: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    console.log("Order created successfully:", { orderId: order.id });

    const customerName = order.customer?.name || "Customer";
    publishNotification({
      type: "orders",
      title: "Order created",
      message: `${customerName} · Total ${totalAmount.toFixed(2)}`,
      entityId: order.id,
      severity: "success",
    });

    // Send email alert to all internal users
    sendOrderCreatedAlert(order.id).catch((error) => {
      console.error("Failed to send order created email alert:", error);
    });

    if (advancePaid > 0) {
      publishNotification({
        type: "payments",
        title: "Advance received",
        message: `${customerName} · Advance ${advancePaid.toFixed(2)}`,
        entityId: order.id,
        severity: "info",
      });

      // Send payment received email alert
      sendPaymentReceivedAlert(order.id, advancePaid).catch((error) => {
        console.error("Failed to send payment received email alert:", error);
      });
    }

    return NextResponse.json(
      { order: transformDecimal(order) },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error.message || "Unknown error",
        code: error.code,
      },
      { status: 500 },
    );
  }
}
