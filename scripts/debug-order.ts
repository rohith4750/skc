import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugOrder() {
  console.log("\n=== Fetching most recent order ===\n");

  const order = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  if (!order) {
    console.log("No orders found");
    return;
  }

  console.log(`Order ID: ${order.id}`);
  console.log(`Customer ID: ${order.customerId}`);
  console.log(`Total Items: ${order.items.length}`);
  console.log(`Meal Type Amounts:`, order.mealTypeAmounts);
  console.log("\nOrder Items:");

  order.items.forEach((item, index) => {
    const typeStr = Array.isArray(item.menuItem.type)
      ? (item.menuItem.type as any).join(", ")
      : String(item.menuItem.type);
    console.log(`${index + 1}. ${item.menuItem.name}`);
    console.log(`   Type: [${typeStr}]`);
    console.log(`   MenuItem ID: ${item.menuItemId.substring(0, 8)}...`);
    console.log();
  });

  // Group by first type
  const byType: Record<string, any[]> = {};
  order.items.forEach((item) => {
    const types = Array.isArray(item.menuItem.type)
      ? item.menuItem.type
      : [item.menuItem.type];
    const primaryType = (types[0] || "unknown").toLowerCase();
    if (!byType[primaryType]) byType[primaryType] = [];
    byType[primaryType].push(item.menuItem.name);
  });

  console.log("\nGrouped by type:");
  for (const [type, items] of Object.entries(byType)) {
    console.log(`${type}: ${items.length} items`);
    console.log(`  ${items.join(", ")}`);
  }
}

debugOrder()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
