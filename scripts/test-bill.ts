import { prisma } from '../lib/prisma'

async function runTest() {
  try {
    console.log('--- Starting Test: Quotation to Orderhub Bill Generation ---')

    // 1. Get or create a mock customer
    let customer = await prisma.customer.findFirst()
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          phone: '9999999999'
        }
      })
    }

    // 2. Get or create a mock menu item
    let menuItem = await prisma.menuItem.findFirst()
    if (!menuItem) {
      menuItem = await prisma.menuItem.create({
        data: {
          name: 'Test Menu Item',
          price: 100
        }
      })
    }

    // 3. Create a quotation order
    console.log('1. Creating a quotation order...')
    const orderData = {
      customerId: customer.id,
      totalAmount: 1000,
      advancePaid: 0,
      remainingAmount: 1000,
      status: 'quotation',
      items: {
        create: [
          {
            menuItemId: menuItem.id,
            quantity: 10,
          }
        ]
      }
    }
    
    // Simulate the route creation using the exact logic from the updated app/api/orders/route.ts
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: orderData,
        include: { items: true }
      })

      let bill = null;
      if (["pending", "in_progress", "completed"].includes(order.status)) {
        bill = await tx.bill.create({
          data: {
            orderId: order.id,
            totalAmount: 1000,
            advancePaid: 0,
            remainingAmount: 1000,
            paidAmount: 0,
            status: "pending"
          }
        })
      }
      return { order, bill }
    })

    const quotationOrder = result.order
    const initialBill = result.bill

    console.log(`Quotation created with ID: ${quotationOrder.id}`)
    console.log(`Initial Bill generated? ${initialBill ? 'Yes (ERROR: Quotation should not have a bill)' : 'No (Correct)'}`)

    // 4. Update the order to 'pending' (Simulate "Convert to Orderhub")
    console.log('2. Converting quotation to pending...')
    
    // Simulate the PUT route logic from app/api/orders/[id]/route.ts
    const convertResult = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: quotationOrder.id },
        data: { status: 'pending' }
      })

      let bill = await tx.bill.findUnique({
        where: { orderId: quotationOrder.id }
      })

      if (!bill && ["pending", "in_progress", "completed"].includes(updatedOrder.status)) {
        bill = await tx.bill.create({
          data: {
            orderId: quotationOrder.id,
            totalAmount: 1000,
            advancePaid: 0,
            remainingAmount: 1000,
            paidAmount: 0,
            status: "pending"
          }
        })
      }
      return { order: updatedOrder, bill }
    })

    console.log(`Order status after conversion: ${convertResult.order.status}`)
    console.log(`Bill generated after conversion? ${convertResult.bill ? 'Yes (Correct)' : 'No (ERROR: Bill should be generated)'}`)
    
    if (convertResult.bill) {
        console.log(`Success! Bill ID: ${convertResult.bill.id}`);
    }

    // Cleanup test data
    console.log('3. Cleaning up test data...')
    await prisma.bill.deleteMany({ where: { orderId: quotationOrder.id } })
    await prisma.orderItem.deleteMany({ where: { orderId: quotationOrder.id } })
    await prisma.order.delete({ where: { id: quotationOrder.id } })
    
    console.log('--- Test Finished Successfully ---')
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

runTest()
