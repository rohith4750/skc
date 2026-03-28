import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { transformDecimal } from "@/lib/decimal-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;
  try {
    const data = await request.json();
    const stall = await (prisma as any).stallTemplate.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
        menuItemIds: data.menuItemIds,
      },
    });
    return NextResponse.json(transformDecimal(stall));
  } catch (error) {
    console.error("Error updating stall template:", error);
    return NextResponse.json(
      { error: "Failed to update stall template" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;
  try {
    await (prisma as any).stallTemplate.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting stall template:", error);
    return NextResponse.json(
      { error: "Failed to delete stall template" },
      { status: 500 },
    );
  }
}
