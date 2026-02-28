import { PrismaClient, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting infrastructure for expense seeding...");

  // 1. Fetch some existing orders
  const orders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  if (orders.length === 0) {
    console.error("No orders found. Please run order seeding first.");
    return;
  }

  const categories = [
    "supervisor",
    "chef",
    "labours",
    "boys",
    "transport",
    "gas",
    "pan",
    "store",
    "other",
  ];
  const recipients = [
    "Dileep (Chef)",
    "Suresh (Transport)",
    "Vamsi (Supervisor)",
    "Sri Meher Gas Agencies",
    "Local Market",
    "Store Manager",
  ];

  console.log(`Found ${orders.length} orders. Seeding expenses...`);

  for (const order of orders) {
    // Each order gets 2-4 expenses
    const numExpenses = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numExpenses; i++) {
      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const amountValue = 500 + Math.floor(Math.random() * 5000);
      const isPaid = Math.random() > 0.3;
      const paidAmountValue = isPaid
        ? amountValue
        : Math.random() > 0.5
          ? amountValue / 2
          : 0;

      const paymentStatus: PaymentStatus =
        paidAmountValue === amountValue
          ? "paid"
          : paidAmountValue > 0
            ? "partial"
            : "pending";

      await prisma.expense.create({
        data: {
          orderId: order.id,
          category,
          amount: amountValue.toFixed(2),
          paidAmount: paidAmountValue.toFixed(2),
          paymentStatus,
          recipient: recipients[Math.floor(Math.random() * recipients.length)],
          description: `Expense for ${order.eventName || "Order " + order.serialNumber}`,
          paymentDate: new Date(),
          eventDate: order.eventDate,
          notes: "Automated seed data",
        },
      });
    }
    console.log(`Seeded expenses for order: ${order.eventName || order.id}`);
  }

  // 2. Add some general bulk/standalone expenses
  console.log("Adding general business expenses...");
  const generalExpenses = [
    { category: "gas", amount: 4500, description: "Gas refill for the month" },
    {
      category: "store",
      amount: 12000,
      description: "Bulk dry fruit purchase",
    },
    { category: "other", amount: 2500, description: "Maintenance and cleanup" },
  ];

  for (const exp of generalExpenses) {
    await prisma.expense.create({
      data: {
        category: exp.category,
        amount: exp.amount.toFixed(2),
        paidAmount: exp.amount.toFixed(2),
        paymentStatus: "paid",
        recipient: "Direct Vendor",
        description: exp.description,
        paymentDate: new Date(),
        notes: "Bulk business expense",
      },
    });
  }

  console.log("Expense seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
