import { PrismaClient } from "@prisma/client";
import { cleanedMenuItems } from "./cleaned-menu-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting non-destructive menu update/insert...\n");
  console.log("   This will update existing items and add new ones.");
  console.log("   No data will be deleted.\n");

  let updated = 0;
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of cleanedMenuItems) {
    try {
      // Try to find existing item by name
      const existing = await prisma.menuItem.findFirst({
        where: {
          name: item.name,
        },
      });

      if (existing) {
        // Update existing item
        await prisma.menuItem.update({
          where: { id: existing.id },
          data: {
            nameTelugu: item.nameTelugu,
            type: item.type,
            description: item.category,
            descriptionTelugu: item.categoryTelugu,
            isActive: true,
          },
        });
        updated++;
      } else {
        // Insert new item
        await prisma.menuItem.create({
          data: {
            name: item.name,
            nameTelugu: item.nameTelugu,
            type: item.type,
            description: item.category,
            descriptionTelugu: item.categoryTelugu,
            isActive: true,
          },
        });
        inserted++;
      }

      // Log progress every 50 items
      const total = updated + inserted;
      if (total % 50 === 0) {
        console.log(
          `   Processed ${total} items... (${updated} updated, ${inserted} inserted)`,
        );
      }
    } catch (error: any) {
      skipped++;
      const errorMsg = `Failed to process "${item.name}": ${error.message}`;
      errors.push(errorMsg);
      console.log(`⚠️  ${errorMsg}`);
    }
  }

  console.log("\n✅ Update/Insert completed!");
  console.log(`   Total items processed: ${cleanedMenuItems.length}`);
  console.log(`   Updated existing items: ${updated}`);
  console.log(`   Newly inserted items: ${inserted}`);
  console.log(`   Skipped (errors): ${skipped}`);

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

  // Show items that were in database but not in cleaned data
  const cleanedNames = new Set(cleanedMenuItems.map((i) => i.name));
  const orphanedItems = allItems.filter((item) => !cleanedNames.has(item.name));

  if (orphanedItems.length > 0) {
    console.log(
      `\n⚠️  Found ${orphanedItems.length} items in database that are not in cleaned data:`,
    );
    orphanedItems.forEach((item) => {
      console.log(`   - ${item.name} (ID: ${item.id})`);
    });
    console.log(
      "\n   These items were NOT deleted and remain in the database.",
    );
    console.log(
      "   You may want to review and manually remove them if needed.",
    );
  }
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
