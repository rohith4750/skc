import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateRequiredFields } from "@/lib/validation";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const data = await request.json();
    const missingFields = validateRequiredFields(data, ["name", "type"]);
    if (missingFields) {
      return NextResponse.json(
        { error: "Missing required fields", details: missingFields },
        { status: 400 },
      );
    }
    const menuItem = await prisma.menuItem.update({
      where: { id: params.id },
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
        isActive: data.isActive,
      } as any,
    });
    return NextResponse.json(menuItem);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.menuItem.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete menu item error:", error);

    // Check for Prisma foreign key constraint violation (P2003)
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error: "Cannot delete item",
          details:
            "This item is part of existing order history. Please deactivate it instead of deleting it to preserve records.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 },
    );
  }
}
