import {
  PrismaClient,
  OrderStatus,
  PaymentStatus,
  OrderType,
  OrderSource,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seeding process...");

  // 1. Create Sample Customers
  const customersData = [
    {
      name: "Rajesh Kumar",
      phone: "9876543210",
      email: "rajesh@example.com",
      address: "Banjara Hills, Hyderabad",
    },
    {
      name: "Sita Rani",
      phone: "9848012345",
      email: "sita@example.com",
      address: "Madhapur, Hyderabad",
    },
    {
      name: "Venkat Rao",
      phone: "9123456789",
      email: "venkat@example.com",
      address: "Vizag, AP",
    },
    {
      name: "Anitha Reddy",
      phone: "9988776655",
      email: "anitha@example.com",
      address: "Gachibowli, Hyderabad",
    },
    {
      name: "Prakash Goud",
      phone: "9866001122",
      email: "prakash@example.com",
      address: "Vijayawada, AP",
    },
  ];

  const customers = [];
  for (const data of customersData) {
    let customer = await prisma.customer.findFirst({
      where: { email: data.email },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: data,
      });
    }
    customers.push(customer);
  }
  console.log(`Created/Ensured ${customers.length} customers.`);

  // 2. Fetch some Menu Items
  const menuItems = await prisma.menuItem.findMany({
    where: { isActive: true },
    take: 20,
  });

  if (menuItems.length === 0) {
    console.error("No menu items found. Please run menu seeding first.");
    return;
  }

  // 3. Create Orders
  const orderStatuses: OrderStatus[] = ["pending", "in_progress", "completed"];
  const eventTypes = [
    "Wedding",
    "Engagement",
    "Birthday Party",
    "Corporate Lunch",
    "House Warming",
  ];
  const venues = [
    "Convention Center",
    "Hotel Taj",
    "Home",
    "Community Hall",
    "Grand Manor",
  ];

  for (let i = 0; i < 10; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status =
      orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const venue = venues[Math.floor(Math.random() * venues.length)];
    const guestCount = 50 + Math.floor(Math.random() * 450);

    // Pick 3-5 random menu items
    const selectedItems = [];
    const numItems = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numItems; j++) {
      selectedItems.push(
        menuItems[Math.floor(Math.random() * menuItems.length)],
      );
    }

    const totalAmountValue = selectedItems.reduce(
      (sum, item) => sum + Number(item.price || 500) * guestCount,
      0,
    );
    const discountValue = Math.random() > 0.7 ? 1000 : 0;
    const finalAmountValue = totalAmountValue - discountValue;
    const advancePaidValue =
      finalAmountValue * (Math.random() > 0.5 ? 0.3 : 0.1);
    const remainingAmountValue = finalAmountValue - advancePaidValue;

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        totalAmount: finalAmountValue.toFixed(2),
        advancePaid: advancePaidValue.toFixed(2),
        remainingAmount: remainingAmountValue.toFixed(2),
        status: status,
        eventType: eventType,
        eventName: `${customer.name}'s ${eventType}`,
        eventDate: new Date(
          Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000,
        ), // Next 30 days
        venue: venue,
        numberOfMembers: guestCount,
        orderType: OrderType.EVENT,
        orderSource: OrderSource.ADMIN,
        items: {
          create: selectedItems.map((item) => ({
            menuItemId: item.id,
            quantity: guestCount,
            mealType: "Lunch",
          })),
        },
      },
    });

    // 4. Create corresponding Bill
    const paymentStatus: PaymentStatus =
      status === "completed"
        ? "paid"
        : advancePaidValue > 0
          ? "partial"
          : "pending";
    await prisma.bill.create({
      data: {
        orderId: order.id,
        totalAmount: finalAmountValue.toFixed(2),
        advancePaid: advancePaidValue.toFixed(2),
        remainingAmount: remainingAmountValue.toFixed(2),
        paidAmount: advancePaidValue.toFixed(2),
        status: paymentStatus,
      },
    });

    console.log(
      `Created order ${i + 1} for ${customer.name} - Status: ${status}`,
    );
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
