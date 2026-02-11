import { PrismaClient } from '@prisma/client'
import { cleanedMenuItems } from './cleaned-menu-data'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning up existing menu items...')
  
  // Delete all existing menu items
  const deleted = await prisma.menuItem.deleteMany({})
  console.log(`✅ Deleted ${deleted.count} existing menu items`)

  console.log('\n📦 Inserting cleaned menu items...')
  
  let inserted = 0
  let skipped = 0
  const errors: string[] = []

  for (const item of cleanedMenuItems) {
    try {
      await prisma.menuItem.create({
        data: {
          name: item.name,
          nameTelugu: item.nameTelugu,
          type: item.type,
          description: item.category,
          descriptionTelugu: item.categoryTelugu,
          isActive: true,
        },
      })
      inserted++
      
      // Log progress every 50 items
      if (inserted % 50 === 0) {
        console.log(`   Inserted ${inserted} items...`)
      }
    } catch (error: any) {
      skipped++
      const errorMsg = `Failed to insert "${item.name}": ${error.message}`
      errors.push(errorMsg)
      console.log(`⚠️  ${errorMsg}`)
    }
  }

  console.log('\n✅ Seed completed!')
  console.log(`   Total items processed: ${cleanedMenuItems.length}`)
  console.log(`   Successfully inserted: ${inserted}`)
  console.log(`   Skipped (duplicates/errors): ${skipped}`)
  
  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors occurred:`)
    errors.forEach(err => console.log(`   - ${err}`))
  }

  // Show summary by category
  console.log('\n📊 Summary by type:')
  const summary: Record<string, number> = {}
  
  const allItems = await prisma.menuItem.findMany()
  allItems.forEach(item => {
    summary[item.type] = (summary[item.type] || 0) + 1
  })
  
  Object.entries(summary)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type.padEnd(20)}: ${count} items`)
    })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
