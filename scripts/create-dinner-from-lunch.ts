import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * This script creates dinner menu items by duplicating all lunch items
 * Lunch and Dinner will have the same items (sweets, dal, rice, curries, starters, etc.)
 */

async function createDinnerItems() {
  console.log('🍽️  Creating dinner items from lunch items...\n')

  try {
    // Get all lunch items
    const lunchItems = await prisma.menuItem.findMany({
      where: { type: 'lunch' }
    })

    console.log(`Found ${lunchItems.length} lunch items to duplicate for dinner\n`)

    // Check if dinner items already exist
    const existingDinnerItems = await prisma.menuItem.findMany({
      where: { type: 'dinner' }
    })

    if (existingDinnerItems.length > 0) {
      console.log(`⚠️  Found ${existingDinnerItems.length} existing dinner items`)
      console.log('   Deleting existing dinner items first...\n')
      
      const deleted = await prisma.menuItem.deleteMany({
        where: { type: 'dinner' }
      })
      console.log(`✅ Deleted ${deleted.count} existing dinner items\n`)
    }

    let created = 0
    let errors = 0

    console.log('📦 Creating dinner items...\n')

    for (const lunchItem of lunchItems) {
      try {
        await prisma.menuItem.create({
          data: {
            name: lunchItem.name,
            nameTelugu: lunchItem.nameTelugu,
            type: 'dinner', // Change type to dinner
            description: lunchItem.description,
            descriptionTelugu: lunchItem.descriptionTelugu,
            isActive: lunchItem.isActive,
          },
        })
        
        created++
        
        if (created % 50 === 0) {
          console.log(`✅ Created ${created} dinner items...`)
        }
      } catch (error: any) {
        errors++
        console.error(`❌ Failed to create dinner item for "${lunchItem.name}":`, error.message)
      }
    }

    console.log('\n✅ Dinner items creation completed!')
    console.log(`   Lunch items processed: ${lunchItems.length}`)
    console.log(`   Dinner items created: ${created}`)
    console.log(`   Errors: ${errors}`)

    // Show final summary
    console.log('\n📊 Final Summary by meal type:')
    const summary = await prisma.menuItem.groupBy({
      by: ['type'],
      _count: true,
    })
    
    summary.forEach(({ type, _count }) => {
      console.log(`   ${type.padEnd(15)}: ${_count} items`)
    })

    const total = await prisma.menuItem.count()
    console.log(`\n✅ Total menu items in database: ${total}`)

    console.log('\n🎉 Success! Now you have:')
    console.log('   • Lunch items: All lunch/dinner items (sweets, dal, rice, curries, etc.)')
    console.log('   • Dinner items: Same as lunch items')
    console.log('   • Breakfast items: Separate breakfast items')
    console.log('   • Snacks items: Separate snacks items')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDinnerItems()
