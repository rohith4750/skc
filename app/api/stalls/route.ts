import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateRequiredFields } from "@/lib/validation";
import { requireAuth } from "@/lib/require-auth";
import { transformDecimal } from "@/lib/decimal-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;
  try {
    const stalls = await (prisma as any).stallTemplate.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(transformDecimal(stalls));
  } catch (error) {
    console.error("Error fetching stalls:", error);
    return NextResponse.json(
      { error: "Failed to fetch stall templates" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;
  try {
    const data = await request.json();
    const missingFields = validateRequiredFields(data, ["name", "menuItemIds"]);
    if (missingFields) {
      return NextResponse.json(
        { error: "Missing required fields", details: missingFields },
        { status: 400 },
      );
    }
    const stall = await (prisma as any).stallTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        menuItemIds: data.menuItemIds,
      },
    });
    return NextResponse.json(transformDecimal(stall));
  } catch (error) {
    console.error("Error creating stall template:", error);
    return NextResponse.json(
      { error: "Failed to create stall template" },
      { status: 500 },
    );
  }
}
