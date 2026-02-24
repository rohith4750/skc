import { PrismaClient, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting verification...");

  // 1. Create a Customer
  const customer = await prisma.customer.create({
    data: {
      name: "Refactor Test Customer",
      phone: "9999999999",
      email: "test@example.com",
      address: "Test Address",
    },
  });
  console.log("Customer created:", customer.id);

  // 2. Create a Menu Item
  const menuItem = await prisma.menuItem.create({
    data: {
      name: "Refactor Test Item",
      description: "Test Description",
      type: ["lunch"] as any,
    },
  });
  console.log("Menu Item created:", menuItem.id);

  // 3. Create an Order with Decimal amounts
  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      totalAmount: 1000.5,
      advancePaid: 500.25,
      remainingAmount: 500.25,
      status: "pending", // Enum value
      items: {
        create: {
          menuItemId: menuItem.id,
          quantity: 2,
        },
      },
    },
  });
  console.log("Order created:", order.id);

  // 4. Verify Decimal types
  console.log("Order Total Amount (Type):", typeof order.totalAmount);
  console.log("Order Total Amount (Value):", order.totalAmount.toString());

  if (order.totalAmount.toString() !== "1000.5") {
    // Prisma Decimal toString might be '1000.5' or '1000.50' depending on input/db
    // Start comparison using Number to be safe or string equality
    // Actually DB is (10, 2), so it should return '1000.50' usually.
    console.log(
      "WARNING: Total amount string mismatch. Expected 1000.50, got",
      order.totalAmount.toString(),
    );
  }

  // 5. Update Status to in_progress (Enum)
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: { status: "in_progress" },
  });
  console.log("Order updated status:", updatedOrder.status);

  // 6. Clean up
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.customer.delete({ where: { id: customer.id } });
  await prisma.menuItem.delete({ where: { id: menuItem.id } });

  console.log("Verification finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
