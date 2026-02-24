import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteDuplicates() {
  console.log("Finding and deleting duplicate menu items...");

  // Get all menu items
  const allItems = await prisma.menuItem.findMany();

  // Group by name (case-insensitive)
  const itemsByName = new Map<string, any[]>();

  for (const item of allItems) {
    const name = item.name.toLowerCase();
    if (!itemsByName.has(name)) {
      itemsByName.set(name, []);
    }
    itemsByName.get(name)!.push(item);
  }

  let deleted = 0;

  // Delete duplicates, keeping only the first (oldest) one
  for (const [name, items] of Array.from(itemsByName.entries())) {
    if (items.length > 1) {
      console.log(`\nFound ${items.length} items named "${items[0].name}":`);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const typeStr = Array.isArray(item.type)
          ? item.type.join(", ")
          : String(item.type);
        console.log(
          `  [${i}] ID: ${item.id.substring(0, 8)}... Type: [${typeStr}] Created: ${item.createdAt}`,
        );
      }

      // Keep the first (oldest), delete the rest
      for (let i = 1; i < items.length; i++) {
        console.log(`  → Deleting duplicate [${i}]`);
        await prisma.menuItem.delete({ where: { id: items[i].id } });
        deleted++;
      }
    }
  }

  console.log(`\n✓ Deleted ${deleted} duplicate items`);

  // Show final count
  const finalCount = await prisma.menuItem.count();
  console.log(`✓ Total menu items remaining: ${finalCount}`);
}

deleteDuplicates()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
