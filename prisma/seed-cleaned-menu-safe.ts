import { PrismaClient } from "@prisma/client";
import { cleanedMenuItems } from "./cleaned-menu-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Starting safe menu cleanup and seeding...\n");

  // Option 1: Delete order items first (if you want a clean slate)
  // WARNING: This will delete all order items!
  console.log("⚠️  WARNING: This will delete all existing order items first.");
  console.log("   This is necessary to allow menu item cleanup.");
  console.log("   Proceeding in 3 seconds...\n");

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("🗑️  Deleting order items...");
  const deletedOrderItems = await prisma.orderItem.deleteMany({});
  console.log(`✅ Deleted ${deletedOrderItems.count} order items`);

  console.log("\n🧹 Cleaning up existing menu items...");
  const deleted = await prisma.menuItem.deleteMany({});
  console.log(`✅ Deleted ${deleted.count} existing menu items`);

  console.log("\n📦 Inserting cleaned menu items...");

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of cleanedMenuItems) {
    try {
      await prisma.menuItem.create({
        data: {
          name: item.name,
          nameTelugu: item.nameTelugu,
          type: [item.type] as any,
          description: item.category,
          descriptionTelugu: item.categoryTelugu,
          isActive: true,
        },
      });
      inserted++;

      // Log progress every 50 items
      if (inserted % 50 === 0) {
        console.log(`   Inserted ${inserted} items...`);
      }
    } catch (error: any) {
      skipped++;
      const errorMsg = `Failed to insert "${item.name}": ${error.message}`;
      errors.push(errorMsg);
      console.log(`⚠️  ${errorMsg}`);
    }
  }

  console.log("\n✅ Seed completed!");
  console.log(`   Total items processed: ${cleanedMenuItems.length}`);
  console.log(`   Successfully inserted: ${inserted}`);
  console.log(`   Skipped (duplicates/errors): ${skipped}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors occurred:`);
    errors.forEach((err) => console.log(`   - ${err}`));
  }

  // Show summary by category
  console.log("\n📊 Summary by type:");
  const summary: Record<string, number> = {};

  const allItems = await prisma.menuItem.findMany();
  allItems.forEach((item) => {
    const typeStr = Array.isArray(item.type) ? item.type.join(", ") : item.type;
    summary[typeStr] = (summary[typeStr] || 0) + 1;
  });

  Object.entries(summary)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type.padEnd(20)}: ${count} items`);
    });

  console.log(`\n✅ Total menu items in database: ${allItems.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error during seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
