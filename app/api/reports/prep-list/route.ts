import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { transformDecimal } from "@/lib/decimal-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    
    // Build query conditions
    const whereCondition: any = {
      status: {
        in: ["pending", "in_progress", "quotation"]
      }
    };

    if (dateStr) {
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      // Using eventDate for filtering. 
      whereCondition.eventDate = {
        gte: targetDate,
        lt: nextDate,
      };
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: whereCondition,
      include: {
        customer: true,
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: { eventDate: 'asc' }
    });

    // Aggregate by menu item
    const prepMap = new Map();

    orders.forEach(order => {
      order.items.forEach(item => {
        if (!prepMap.has(item.menuItem.id)) {
          prepMap.set(item.menuItem.id, {
            menuItem: item.menuItem,
            totalQuantity: 0,
            orders: []
          });
        }
        const entry = prepMap.get(item.menuItem.id);
        
        const quantity = item.quantity || 1;
        entry.totalQuantity += quantity;
        
        entry.orders.push({
          orderId: order.id,
          serialNumber: order.serialNumber,
          customerName: order.customer.name,
          eventDate: order.eventDate,
          quantity: quantity,
          mealType: item.mealType,
          customization: item.customization,
          numberOfMembers: order.numberOfMembers
        });
      });
    });

    const prepList = Array.from(prepMap.values());
    
    // Sort by total quantity descending, then by name
    prepList.sort((a, b) => {
      if (b.totalQuantity !== a.totalQuantity) {
        return b.totalQuantity - a.totalQuantity;
      }
      return a.menuItem.name.localeCompare(b.menuItem.name);
    });

    return NextResponse.json(transformDecimal(prepList));
  } catch (error) {
    console.error("Error fetching prep list:", error);
    return NextResponse.json(
      { error: "Failed to fetch prep list" },
      { status: 500 }
    );
  }
}
