import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding multi-date test quotation...');

  // 1. Get or create a test customer
  let customer = await prisma.customer.findFirst({
    where: { phone: '9876543210' }
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: 'Srinivasa Rao (Test Case)',
        phone: '9876543210',
        email: 'srinivasa.test@example.com',
        address: 'H.No 4-50/12, Madhapur, Hyderabad',
        message: 'Test quotation creation with multiple dates'
      }
    });
  }

  // 2. Find or create menu items
  const menuItemsData = [
    { name: 'Idli', nameTelugu: 'ఇడ్లీ', type: ['breakfast'] },
    { name: 'Wada', nameTelugu: 'వడ', type: ['breakfast'] },
    { name: 'Sambhar', nameTelugu: 'సాంబార్', type: ['breakfast'] },
    { name: 'Veg Biryani', nameTelugu: 'వెజ్ బిర్యానీ', type: ['lunch', 'dinner'] },
    { name: 'Raita', nameTelugu: 'రైతా', type: ['lunch', 'dinner'] },
    { name: 'Paneer Butter Masala', nameTelugu: 'పనీర్ బటర్ మసాలా', type: ['lunch', 'dinner'] },
    { name: 'Naan', nameTelugu: 'నాన్', type: ['lunch', 'dinner'] },
    { name: 'Ice Cream (Vanilla/Chocolate)', nameTelugu: 'ఐస్ క్రీమ్', type: ['stalls', 'dessert'] }
  ];

  const menuItems: any[] = [];
  for (const itemData of menuItemsData) {
    let menuItem = await prisma.menuItem.findFirst({
      where: { name: itemData.name }
    });
    if (!menuItem) {
      menuItem = await prisma.menuItem.create({
        data: {
          name: itemData.name,
          nameTelugu: itemData.nameTelugu,
          type: itemData.type,
          isCommon: true,
          isActive: true
        }
      });
    }
    menuItems.push(menuItem);
  }

  // Map by name for easy lookup
  const itemsMap = menuItems.reduce((acc, curr) => {
    acc[curr.name] = curr.id;
    return acc;
  }, {} as Record<string, string>);

  // 3. Define dates and meal sessions
  const date1 = '2026-06-25T00:00:00.000Z';
  const date2 = '2026-06-26T00:00:00.000Z';

  const mealTypeAmounts = {
    session_day1_breakfast: {
      menuType: 'breakfast',
      date: date1,
      numberOfMembers: 100,
      amount: 15000,
      time: '08:00',
      venue: 'Main Marriage Hall',
      numberOfPlates: 100
    },
    session_day1_lunch: {
      menuType: 'lunch',
      date: date1,
      numberOfMembers: 120,
      amount: 42000,
      time: '13:00',
      venue: 'Catering Dining Hall',
      numberOfPlates: 120
    },
    session_day2_breakfast: {
      menuType: 'breakfast',
      date: date2,
      numberOfMembers: 100,
      amount: 15000,
      time: '08:00',
      venue: 'Main Marriage Hall',
      numberOfPlates: 100
    },
    session_day2_lunch: {
      menuType: 'lunch',
      date: date2,
      numberOfMembers: 150,
      amount: 60000,
      time: '13:00',
      venue: 'Catering Dining Hall',
      numberOfPlates: 150
    },
    session_day2_dinner: {
      menuType: 'dinner',
      date: date2,
      numberOfMembers: 120,
      amount: 48000,
      time: '20:00',
      venue: 'Open Garden Lawn',
      numberOfPlates: 120
    }
  };

  const stalls = [
    {
      category: 'Chat Counter',
      description: 'Pani Puri, Dahi Papdi Chat',
      cost: 8000,
      date: date2,
      time: '18:00',
      venue: 'Garden Entry Lawn',
      eventName: 'Reception Pre-Dinner Snacks'
    }
  ];

  // 4. Create the Quotation Order
  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      status: 'quotation',
      eventName: 'Grand 2-Day Wedding Celebration',
      eventDate: new Date('2026-06-25'),
      numberOfMembers: 150,
      transportCost: 12000,
      waterBottlesCost: 4000,
      discount: 1500,
      advancePaid: 25000,
      totalAmount: 197500, // 15000+42000+15000+60000+48000 + 8000 + 12000 + 4000 - 1500 = 202500
      remainingAmount: 172500,
      mealTypeAmounts: mealTypeAmounts,
      stalls: stalls
    }
  });

  console.log(`Created Quotation Order ID: ${order.id}`);

  // 5. Link OrderItems to specific sessions
  const orderItemsData = [
    // Day 1 Breakfast (Idli, Wada, Sambhar)
    { orderId: order.id, menuItemId: itemsMap['Idli'], quantity: 1, mealType: 'session_day1_breakfast', customization: 'With coconut chutney' },
    { orderId: order.id, menuItemId: itemsMap['Wada'], quantity: 1, mealType: 'session_day1_breakfast', customization: 'Less oil' },
    { orderId: order.id, menuItemId: itemsMap['Sambhar'], quantity: 1, mealType: 'session_day1_breakfast' },

    // Day 1 Lunch (Biryani, Raita)
    { orderId: order.id, menuItemId: itemsMap['Veg Biryani'], quantity: 1, mealType: 'session_day1_lunch', customization: 'Double masala' },
    { orderId: order.id, menuItemId: itemsMap['Raita'], quantity: 1, mealType: 'session_day1_lunch' },

    // Day 2 Breakfast (Idli, Wada, Sambhar)
    { orderId: order.id, menuItemId: itemsMap['Idli'], quantity: 1, mealType: 'session_day2_breakfast' },
    { orderId: order.id, menuItemId: itemsMap['Wada'], quantity: 1, mealType: 'session_day2_breakfast' },
    { orderId: order.id, menuItemId: itemsMap['Sambhar'], quantity: 1, mealType: 'session_day2_breakfast' },

    // Day 2 Lunch (Biryani, Raita, Paneer Butter Masala)
    { orderId: order.id, menuItemId: itemsMap['Veg Biryani'], quantity: 1, mealType: 'session_day2_lunch' },
    { orderId: order.id, menuItemId: itemsMap['Raita'], quantity: 1, mealType: 'session_day2_lunch' },
    { orderId: order.id, menuItemId: itemsMap['Paneer Butter Masala'], quantity: 1, mealType: 'session_day2_lunch' },

    // Day 2 Dinner (Paneer Butter Masala, Naan, Veg Biryani)
    { orderId: order.id, menuItemId: itemsMap['Paneer Butter Masala'], quantity: 1, mealType: 'session_day2_dinner', customization: 'Medium spicy' },
    { orderId: order.id, menuItemId: itemsMap['Naan'], quantity: 1, mealType: 'session_day2_dinner', customization: 'Butter Naan' },
    { orderId: order.id, menuItemId: itemsMap['Veg Biryani'], quantity: 1, mealType: 'session_day2_dinner' }
  ];

  await prisma.orderItem.createMany({
    data: orderItemsData
  });

  console.log('Successfully seeded order items.');
}

main()
  .catch(e => {
    console.error('Error seeding test quotation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
