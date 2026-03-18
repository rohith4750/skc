const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customerId = '28ba4780-93d8-4585-8fc9-083d29b4e48d';
  
  const orders = await prisma.order.findMany({
    where: { customerId },
    include: {
      items: {
        include: {
          menuItem: true
        }
      }
    }
  });

  let sql = `-- FOOD MENU REPORT MIGRATION FOR CUSTOMER: Manikyarao Behara Garu
-- DATE: 18 March 2026

BEGIN;

-- 1. DELETE EXISTING ORDERS FOR THIS CUSTOMER
DELETE FROM order_items WHERE "orderId" IN (SELECT id FROM orders WHERE "customerId" = '${customerId}');
DELETE FROM orders WHERE "customerId" = '${customerId}';

`;

  // Collect all unique menu items used
  const menuItems = new Map();
  orders.forEach(order => {
    order.items.forEach(item => {
      menuItems.set(item.menuItem.id, item.menuItem);
    });
  });

  sql += `-- 2. ENSURE MENU ITEMS EXIST
`;
  menuItems.forEach(mi => {
    const types = JSON.stringify(mi.type).replace('[', '{').replace(']', '}');
    sql += `INSERT INTO menu_items (id, name, "nameTelugu", type, description, "descriptionTelugu", price, unit, "isActive")
VALUES ('${mi.id}', '${mi.name.replace(/'/g, "''")}', ${mi.nameTelugu ? `'${mi.nameTelugu.replace(/'/g, "''")}'` : 'NULL'}, '${types}', ${mi.description ? `'${mi.description.replace(/'/g, "''")}'` : 'NULL'}, ${mi.descriptionTelugu ? `'${mi.descriptionTelugu.replace(/'/g, "''")}'` : 'NULL'}, ${mi.price || 'NULL'}, ${mi.unit ? `'${mi.unit}'` : 'NULL'}, true)
ON CONFLICT (id) DO NOTHING;
`;
  });

  sql += `
-- 3. INSERT NEW ORDERS
`;
  orders.forEach(order => {
    const eventDate = order.eventDate.toISOString();
    sql += `INSERT INTO orders (id, "customerId", "eventName", "eventType", "eventDate", "totalAmount", status, "remainingAmount", "advancePaid", "createdAt", "updatedAt")
VALUES ('${order.id}', '${order.customerId}', '${order.eventName.replace(/'/g, "''")}', '${order.eventType.replace(/'/g, "''")}', '${eventDate}', ${order.totalAmount}, 'pending', ${order.remainingAmount}, 0, NOW(), NOW());

`;
    sql += `-- ITEMS FOR ORDER ${order.eventName}
`;
    order.items.forEach(item => {
      sql += `INSERT INTO order_items (id, "orderId", "menuItemId", "mealType", quantity)
VALUES ('${item.id}', '${order.id}', '${item.menuItemId}', '${item.mealType}', 1);
`;
    });
    sql += `\n`;
  });

  sql += `COMMIT;
`;

  console.log(sql);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
