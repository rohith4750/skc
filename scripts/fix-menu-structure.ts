import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * This script updates menu items to have proper structure:
 * - type: 'lunch' or 'dinner' (meal type)  
 * - description: Category like 'SWEETS (Any Two)', 'DAL (Any One)'
 */

// Map of old types to their category descriptions
const categoryMapping: Record<string, string> = {
  'welcome_drink': 'WELCOME DRINK (Any One)',
  'soup': 'SOUP (Any One)',
  'starter': 'STARTER (Any One)',
  'sweets': 'SWEETS (Any Two)',
  'roti': 'ROTI (Any One)',
  'hot': 'HOT (Any One)',
  'rice': 'FLAVOUR RICE (Any One)',
  'fry': 'FRY (Any One)',
  'dal': 'DAL (Any One)',
  'liquid': 'LIQUIDS (Any Two)',
  'north_indian': 'NORTH INDIAN DISHES (Any Three)',
  'south_indian_curry': 'SOUTH INDIAN CURRY (Any One)',
  'pickle': 'PICKLES (Any Two)',
  'chutney': 'CHUTNEYS (Any Two)',
  'powder': 'POWDER (Any Two)',
  'common': 'COMMON ITEMS',
  'breakfast': 'BREAKFAST',
  'snacks': 'SNACKS',
}

async function fixMenuStructure() {
  console.log('🔧 Fixing menu item structure...\n')

  try {
    // Get all menu items
    const allItems = await prisma.menuItem.findMany()
    console.log(`Found ${allItems.length} menu items\n`)

    let updated = 0
    let skipped = 0

    for (const item of allItems) {
      const currentType = item.type
      
      // Determine new meal type
      let newType = 'lunch' // Default to lunch
      
      // Keep ONLY breakfast and snacks as separate types
      // Everything else (sweets, dal, rice, curries, etc.) goes to lunch
      if (currentType === 'breakfast') {
        newType = 'breakfast'
      } else if (currentType === 'snacks') {
        newType = 'snacks'
      } else {
        // All other items including SWEETS are lunch/dinner items
        newType = 'lunch'
      }

      // Get category description
      const categoryDescription = categoryMapping[currentType] || currentType.toUpperCase()

      // Update the item
      try {
        await prisma.menuItem.update({
          where: { id: item.id },
          data: {
            type: newType,
            description: categoryDescription,
          },
        })
        
        updated++
        
        if (updated % 50 === 0) {
          console.log(`✅ Updated ${updated} items...`)
        }
      } catch (error) {
        console.error(`❌ Failed to update ${item.name}:`, error)
        skipped++
      }
    }

    console.log('\n✅ Update completed!')
    console.log(`   Total items: ${allItems.length}`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Skipped: ${skipped}`)

    // Show summary by type
    console.log('\n📊 Summary by meal type:')
    const summary = await prisma.menuItem.groupBy({
      by: ['type'],
      _count: true,
    })
    
    summary.forEach(({ type, _count }) => {
      console.log(`   ${type.padEnd(15)}: ${_count} items`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMenuStructure()
