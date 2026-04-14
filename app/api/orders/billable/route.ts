import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { transformDecimal } from "@/lib/decimal-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const orders = await prisma.order.findMany({
      where: {
        bill: null,
        status: {
          in: ["pending", "in_progress", "completed"]
        }
      },
      include: {
        customer: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(transformDecimal(orders));
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch billable orders", details: error.message },
      { status: 500 }
    );
  }
}
