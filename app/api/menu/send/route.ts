import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email-server";
import { generateMenuEmailHTML } from "@/lib/email-customer";
import { requireAuth } from "@/lib/require-auth";
import { jsPDF } from "jspdf";

function extractSubcategory(description: string | null | undefined): string {
  if (!description) return "Other";
  const match = description.match(/^([^(]+)/);
  return match ? match[1].trim() : description.trim();
}

function groupBySubcategory(
  items: {
    name: string;
    nameTelugu?: string | null;
    description?: string | null;
  }[],
) {
  const grouped: Record<string, typeof items> = {};
  items.forEach((item) => {
    const sub = extractSubcategory(item.description) || "Other";
    if (!grouped[sub]) grouped[sub] = [];
    grouped[sub].push(item);
  });
  return grouped;
}

function generateMenuPDF(
  menuItems: {
    name: string;
    nameTelugu?: string | null;
    type: string;
    description?: string | null;
  }[],
): Buffer {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const margin = 15;
  let y = 20;
  const lineHeight = 6;

  const addHeader = () => {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SRIVATSASA & KOWNDINYA CATERERS", pageWidth / 2, y, {
      align: "center",
    });
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Pure Vegetarian Catering - Complete Menu", pageWidth / 2, y, {
      align: "center",
    });
    y += 12;
  };

  const addCategory = (title: string) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(193, 65, 12);
    doc.text(title.toUpperCase(), margin, y);
    y += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  };

  const addSubcategory = (title: string) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(4, 120, 87);
    doc.text(title, margin, y);
    y += 5;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  };

  const addItem = (name: string, nameTelugu?: string | null) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(8);
    const text = nameTelugu ? `• ${name} (${nameTelugu})` : `• ${name}`;
    doc.text(text, margin + 3, y);
    y += lineHeight;
  };

  addHeader();

  const breakfast = menuItems.filter((i) =>
    Array.isArray(i.type)
      ? i.type.includes("breakfast")
      : i.type === "breakfast",
  );
  const lunch = menuItems.filter((i) =>
    Array.isArray(i.type) ? i.type.includes("lunch") : i.type === "lunch",
  );
  const dinner = menuItems.filter((i) =>
    Array.isArray(i.type) ? i.type.includes("dinner") : i.type === "dinner",
  );
  const snacks = menuItems.filter((i) =>
    Array.isArray(i.type)
      ? i.type.includes("snacks") || i.type.includes("sweets")
      : i.type === "snacks" || i.type === "sweets",
  );

  const renderCategory = (title: string, items: typeof menuItems) => {
    if (items.length === 0) return;
    addCategory(title);
    const grouped = groupBySubcategory(items);
    Object.entries(grouped).forEach(([sub, subItems]) => {
      addSubcategory(sub);
      subItems.forEach((item) => addItem(item.name, item.nameTelugu));
    });
    y += 4;
  };

  renderCategory("Breakfast", breakfast);
  renderCategory("Lunch", lunch);
  renderCategory("Dinner", dinner);
  renderCategory("Snacks & Sweets", snacks);

  return Buffer.from(doc.output("arraybuffer"));
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const data = await request.json().catch(() => ({}));
    const to = data.email;
    if (!to || typeof to !== "string" || !to.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 },
      );
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const pdfBuffer = generateMenuPDF(menuItems);
    const pdfBase64 = pdfBuffer.toString("base64");

    const html = generateMenuEmailHTML({
      customerName: data.customerName,
      introMessage:
        data.introMessage ||
        "Please find our complete menu attached for your reference.",
    });

    const sent = await sendEmail({
      to,
      subject: "SKC Caterers - Complete Menu",
      html,
      text: "Please find our complete menu attached to this email. Thank you for considering SKC Caterers!",
      attachments: [
        {
          filename: "SKC-Caterers-Menu.pdf",
          content: pdfBase64,
        },
      ],
    });

    if (!sent) {
      return NextResponse.json(
        {
          error:
            "Email service not configured. Please set up RESEND_API_KEY or SMTP in environment.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to send menu email:", error);
    return NextResponse.json(
      { error: "Failed to send menu email", details: error.message },
      { status: 500 },
    );
  }
}
