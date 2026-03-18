const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const report = [
  // 10th April
  { date: '2026-04-10', meal: 'breakfast', items: ['Idly', 'Tomato Bath', 'Dahi Wada', 'Persarattu', 'White Chutney', 'Allam Chutney', 'Sambar', 'Kaarapodi', 'Ghee', 'Coffee', 'Tea'] },
  { date: '2026-04-10', meal: 'lunch', items: ['Pulihora', 'Poornam Boorelu', 'Veg Pakodi', 'Tomato Pappu', 'Cabbage Batani Kobbari Curry', 'Dondakaya Karam Curry', 'Mukkala Pulusu', 'Mamidikaya Kobbarikaya Pachadi', 'Chintakaya Pachadi', 'White Rice', 'Curd', 'Appadam', 'Vadiyalu', 'Pan', 'Fruit Salad', 'Ice Cream'] },
  { date: '2026-04-10', meal: '3-5pm snacks', items: ['Juices', 'Veg Cutlet', 'Cut Mirchi'] },
  { date: '2026-04-10', meal: 'evening snacks', items: ['Veg Soup', 'Blue Lagoon Mocktail', 'Babycorn 65', 'Tandoor Item', 'Veg Bullets', 'Veg Shangrilla'] },
  { date: '2026-04-10', meal: 'dinner', items: ['Chapati', 'Aloo Tomato Curry', 'Rasam', 'White Rice', 'Curd Rice', 'Buttermilk'] },
  // 11th April
  { date: '2026-04-11', meal: 'breakfast', items: ['Hot Pongal', 'Vada', 'Pineapple Rava Kesari', 'Dosa', 'White Chutney', 'Allam Chutney', 'Sambar', 'Coffee', 'Tea', 'Cut Fruits', 'Sandwich'] },
  { date: '2026-04-11', meal: 'welcome drinks', items: ['Pineapple Juice', 'Salted Boiled Rajma', 'Seethaphalam Juice', 'Watermelon Juice', 'Aloo Cheese Balls', 'Spring Rolls'] },
  { date: '2026-04-11', meal: 'lunch', items: ['Mamidikaya Pappu', 'Bhendi Fry', 'Gobi Pakodi', 'Panasapottu Koora', 'Vankaya Karam Curry', 'Mealmaker Curry', 'Gongura Pachadi', 'Tomato Pachadi', 'Kandhi Podi', 'Sambar', 'Perugu', 'White Rice', 'Challa Merapakayalu', 'Appadalu', 'Vadiyalu', 'Ghee', 'Bobbatu', 'Laddoo', 'Carrot Halwa', 'Rumali Roti', 'Paneer Curry', 'Veg Pulao', 'Tamalapaaku Bhajji', 'Apricot Delight'] },
  { date: '2026-04-11', meal: 'snacks', items: ['Aloo Bonda', 'Pan'] },
  { date: '2026-04-11', meal: 'evening snacks', items: ['Onion Samosa', 'Masala Dal Vada', 'Fried Mirchi', 'Palakova', 'Coffee', 'Tea'] },
  { date: '2026-04-11', meal: 'dinner', items: ['Pulka', 'Palak Paneer', 'White Rice', 'Tomato Rasam', 'Aratikaya Curry', 'Dosavakaya', 'Semiya Payasam', 'Pan', 'Curd', 'Buttermilk'] },
  // 12th April
  { date: '2026-04-12', meal: 'breakfast', items: ['Idly', 'Set Dosa', 'Puri', 'Chutney', 'Allam Chutney', 'Sambar', 'Kaarapodi', 'Ghee', 'Tea', 'Coffee'] },
  { date: '2026-04-12', meal: 'welcome drinks', items: ['Fruit Punch', 'Kiwi Cooler', 'Veg Manchuria', 'Mixed Pakoda'] },
  { date: '2026-04-12', meal: 'live counter', items: ['Sketch Counter', 'Photo Counter', 'Bangle Making', 'Temporary Tattoo', 'Balloon Counter', 'Chat Counter', 'Pani Puri Counter', 'Barbeque', 'Chocolate Popcorn', 'Cheese Popcorn', 'Kova Bobbatu', 'Cut Fruits'] },
  { date: '2026-04-12', meal: 'lunch', items: ['Soup', 'Tomato Rice', 'Veg Biryani', 'Puri', 'Butter Naan', 'White Rice', 'Paneer Butter Masala', 'Bagara Baingan', 'Chana Masala', 'Bhendi Cashew Fry', 'Beans Kobbari Curry', 'Mirchi Bhajji', 'Sambar', 'Palakura Pappu', 'Gongura Chutney', 'Tomato Chutney', 'Kandi Podi', 'Majjiga Pulusu', 'Curd', 'Onion Raitha', 'Challa Merapakayalu', 'Appadalu', 'Vadiyalu'] },
  { date: '2026-04-12', meal: 'evening snacks', items: ['Khubani Ka Halwa', 'Double Ka Meetha', 'Ice Cream with Gulab Jamun', 'Live Pan'] },
  { date: '2026-04-12', meal: 'dinner', items: ['Tea', 'Coffee', 'Bondi Mixture', 'Sweet Item', 'Curd Rice', 'Chapati', 'Buttermilk', 'Mixed Vegetable Curry', 'Jeera Rice'] },
];

async function main() {
  const existingMenuItems = await prisma.menuItem.findMany();
  const allReportItems = [...new Set(report.flatMap(r => r.items))];
  
  const mapping = {};
  const missing = [];
  
  allReportItems.forEach(item => {
    const match = existingMenuItems.find(mi => mi.name.toLowerCase().includes(item.toLowerCase()) || item.toLowerCase().includes(mi.name.toLowerCase()));
    if (match) {
      mapping[item] = match;
    } else {
      missing.push(item);
    }
  });

  console.log('MAPPING FOUND:', JSON.stringify(mapping, null, 2));
  console.log('MISSING ITEMS:', JSON.stringify(missing, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
