import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateRequiredFields } from "@/lib/validation";
import { requireAuth } from "@/lib/require-auth";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const menuItems = await prisma.menuItem.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(menuItems, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;
  try {
    const data = await request.json();
    const missingFields = validateRequiredFields(data, ["name", "type"]);
    if (missingFields) {
      return NextResponse.json(
        { error: "Missing required fields", details: missingFields },
        { status: 400, headers: corsHeaders },
      );
    }
    const menuItem = await prisma.menuItem.create({
      data: {
        name: data.name,
        nameTelugu: data.nameTelugu,
        type: Array.isArray(data.type) ? data.type : [data.type],
        description: data.description,
        descriptionTelugu: data.descriptionTelugu,
        // @ts-ignore
        price: data.price,
        // @ts-ignore
        unit: data.unit,
        isCommon: data.isCommon !== undefined ? data.isCommon : false,
        isActive: data.isActive !== undefined ? data.isActive : true,
      } as any,
    });
    return NextResponse.json(menuItem, { status: 201, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500, headers: corsHeaders },
    );
  }
}
