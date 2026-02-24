import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createDinnerItems() {
  console.log("\n=== Creating Dinner Menu Items ===\n");

  // Get all lunch items
  const lunchItems = await prisma.menuItem.findMany({
    where: { type: { has: "lunch" } } as any,
  });

  console.log(`Found ${lunchItems.length} lunch items`);

  // Check if dinner items already exist
  const existingDinnerCount = await prisma.menuItem.count({
    where: { type: { has: "dinner" } } as any,
  });

  if (existingDinnerCount > 0) {
    console.log(
      `\n⚠️  ${existingDinnerCount} dinner items already exist. Skipping.`,
    );
    return;
  }

  console.log("\nCreating dinner items...\n");

  let created = 0;
  for (const lunchItem of lunchItems) {
    await prisma.menuItem.create({
      data: {
        name: lunchItem.name,
        nameTelugu: lunchItem.nameTelugu,
        type: ["dinner"] as any, // Change to dinner
        description: lunchItem.description,
        descriptionTelugu: lunchItem.descriptionTelugu,
        isActive: lunchItem.isActive,
      },
    });
    created++;
    if (created % 50 === 0) {
      console.log(`Created ${created} dinner items...`);
    }
  }

  console.log(`\n✓ Successfully created ${created} dinner menu items!`);

  // Show final counts
  const counts = await prisma.menuItem.groupBy({
    by: ["type"],
    _count: true,
  });

  counts.forEach((group) => {
    const typeStr = Array.isArray(group.type)
      ? group.type.join(", ")
      : String(group.type);
    console.log(`  ${typeStr}: ${group._count}`);
  });
}

createDinnerItems()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
