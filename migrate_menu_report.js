const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const customerId = '28ba4780-93d8-4585-8fc9-083d29b4e48d';

const menuReport = [
  {
    date: '2026-04-10',
    eventName: 'Kesariii - Day 1',
    eventType: 'Day 1 Event',
    meals: [
      { type: 'BREAKFAST', items: ['Idly', 'Tomato Bath', 'Dahi Wada', 'Persarattu (Live Counter)', 'White Chutney', 'Allam Chutney', 'Sambar', 'Kaarapodi', 'Ghee', 'Coffee', 'Tea'] },
      { type: 'LUNCH', items: ['Pulihora', 'Poornam Boorelu', 'Veg Pakodi', 'Tomato Pappu', 'Cabbage Batani Kobbari Curry', 'Dondakaya Karam Curry', 'Mukkala Pulusu', 'Mamidikaya Kobbarikaya Pachadi', 'Chintakaya Pachadi', 'White Rice', 'Curd', 'Appadam', 'Vadiyalu', 'Pan', 'Fruit Salad', 'Ice Cream'] },
      { type: '3PM-5PM SNACKS', items: ['2 Types of Juices', 'Veg Cutlet', 'Cut Mirchi'] },
      { type: 'EVENING SNACKS', items: ['Veg Soup (No Mushroom)', 'Blue Lagoon Mocktail', 'Babycorn 65', 'Tandoor Item / Veg Bullets / Veg Shangrilla'] },
      { type: 'DINNER', items: ['Chapati', 'Aloo Tomato Curry', 'Rasam', 'White Rice', 'Curd Rice', 'Buttermilk'] }
    ]
  },
  {
    date: '2026-04-11',
    eventName: 'Kesariii - Day 2',
    eventType: 'Day 2 Event',
    meals: [
      { type: 'BREAKFAST', items: ['Hot Pongal', 'Vada', 'Pineapple Rava Kesari', 'Dosa (Live Counter)', 'White Chutney', 'Allam Chutney', 'Sambar', 'Coffee', 'Tea', 'Cut Fruits', 'Sandwich with Tomato Ketchup'] },
      { type: 'WELCOME DRINKS & SNACKS (11:00 AM)', items: ['Pineapple Juice', 'Salted Boiled Rajma', 'Seethaphalam Juice', 'Watermelon Juice', 'Aloo Cheese Balls', 'Spring Rolls'] },
      { type: 'LUNCH', items: ['Mamidikaya Pappu', 'Bhendi Fry + Gobi Pakodi', 'Panasapottu Koora', 'Vankaya Karam Curry', 'Mealmaker Curry', 'Gongura Pachadi', 'Tomato Pachadi', 'Kandhi Podi', 'Sambar', 'Perugu', 'White Rice', 'Challa Merapakayalu, Appadalu, Vadiyalu', 'Ghee', 'Bobbatu', 'Laddoo', 'Carrot Halwa', 'Rumali Roti', 'Paneer Curry', 'Veg Pulao', 'Tamalapaaku Bhajji', 'Apricot Delight'] },
      { type: 'SNACKS', items: ['Aloo Bonda', 'Pan'] },
      { type: 'EVENING SNACKS', items: ['Onion Samosa / Masala Dal Vada', 'Fried Mirchi', 'Palakova', 'Coffee', 'Tea'] },
      { type: 'DINNER', items: ['Pulka (Live)', 'Palak Paneer', 'White Rice', 'Tomato Rasam', 'Aratikaya Curry', 'Dosavakaya', 'Semiya Payasam', 'Pan', 'Curd', 'Buttermilk'] }
    ]
  },
  {
    date: '2026-04-12',
    eventName: 'Kesariii - Day 3',
    eventType: 'Day 3 Event',
    meals: [
      { type: 'BREAKFAST', items: ['Idly', 'Set Dosa (Live)', 'Puri Live Counter with Curry', 'Chutney', 'Allam Chutney', 'Sambar', 'Kaarapodi', 'Ghee', 'Tea', 'Coffee'] },
      { type: 'WELCOME DRINKS & SNACKS', items: ['Fruit Punch', 'Kiwi Cooler', 'Veg Manchuria', 'Mixed Pakoda'] },
      { type: 'LIVE COUNTERS', items: ['Sketch Counter', 'Photo Counter', 'Bangle Making', 'Temporary Tattoo', 'Balloon Counter', 'Chat Counter', 'Pani Puri Counter', 'Barbeque (Paneer Kabab + French Fries)', 'Chocolate & Cheese Popcorn', 'Kova Bobbatu (Live)', 'Cut Fruits'] },
      { type: 'LUNCH', items: ['Soup', 'Tomato Rice', 'Veg Biryani', 'Puri', 'Butter Naan', 'White Rice', 'Paneer Butter Masala', 'Bagara Baingan', 'Chana Masala', 'Bhendi Cashew Fry', 'Beans Kobbari Curry', 'Mirchi Bhajji', 'Sambar', 'Palakura Pappu', 'Gongura Chutney', 'Tomato Chutney', 'Kandi Podi', 'Majjiga Pulusu', 'Curd', 'Onion Raitha', 'Challa Merapakayalu, Appadalu, Vadiyalu'] },
      { type: 'EVENING SNACKS', items: ['Khubani Ka Halwa', 'Double Ka Meetha', 'Ice Cream with Gulab Jamun', 'Live Pan'] },
      { type: 'DINNER', items: ['Tea', 'Coffee', 'Bondi Mixture', 'Sweet Item', 'Curd Rice', 'Chapati', 'Buttermilk', 'Mixed Vegetable Curry', 'Jeera Rice'] }
    ]
  }
];

async function main() {
  console.log('Cleaning up existing orders for customer...');
  await prisma.order.deleteMany({
    where: { customerId }
  });

  console.log('Starting migration...');

  for (const day of menuReport) {
    const eventDate = new Date(day.date);
    console.log(`Creating order for ${day.date}...`);

    const order = await prisma.order.create({
      data: {
        customerId,
        eventName: day.eventName,
        eventType: day.eventType,
        eventDate,
        totalAmount: 0,
        status: 'pending',
        remainingAmount: 0
      }
    });

    for (const meal of day.meals) {
      console.log(`  Adding ${meal.type} items...`);
      for (const itemName of meal.items) {
        // Find or create MenuItem
        let menuItem = await prisma.menuItem.findFirst({
          where: { name: { equals: itemName, mode: 'insensitive' } }
        });

        if (!menuItem) {
          menuItem = await prisma.menuItem.create({
            data: {
              name: itemName,
              type: [meal.type.split(' ')[0].toLowerCase()], // e.g., 'breakfast'
              isActive: true
            }
          });
        }

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: menuItem.id,
            mealType: meal.type,
            quantity: 1
          }
        });
      }
    }
  }

  console.log('Migration completed successfully locally.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
