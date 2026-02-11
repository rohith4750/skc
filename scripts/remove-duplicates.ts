import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * This script finds and removes duplicate menu items
 * Duplicates are identified by: same name + same type
 * Keeps the first occurrence and deletes the rest
 */

async function removeDuplicates() {
  console.log('🔍 Finding duplicate menu items...\n')

  try {
    // Get all menu items
    const allItems = await prisma.menuItem.findMany({
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })

    console.log(`Total items in database: ${allItems.length}\n`)

    // Group items by type and name to find duplicates
    const itemMap = new Map<string, typeof allItems>()
    
    for (const item of allItems) {
      const key = `${item.type}|||${item.name.toLowerCase().trim()}`
      
      if (!itemMap.has(key)) {
        itemMap.set(key, [])
      }
      itemMap.get(key)!.push(item)
    }

    // Find duplicates
    const duplicateGroups: Array<typeof allItems> = []
    
    for (const [key, items] of Array.from(itemMap.entries())) {
      if (items.length > 1) {
        duplicateGroups.push(items)
      }
    }

    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicates found! Database is clean.')
      return
    }

    console.log(`Found ${duplicateGroups.length} groups of duplicates:\n`)

    let totalDuplicates = 0
    for (const group of duplicateGroups) {
      totalDuplicates += group.length - 1
      console.log(`   ${group[0].type} - "${group[0].name}" (${group.length} copies)`)
    }

    console.log(`\nTotal duplicate items to remove: ${totalDuplicates}\n`)

    // Ask for confirmation by showing what will be deleted
    console.log('🗑️  Starting deletion process...\n')

    let deleted = 0
    let errors = 0

    for (const group of duplicateGroups) {
      // Keep the first item, delete the rest
      const [keep, ...toDelete] = group
      
      console.log(`Keeping: ${keep.type} - "${keep.name}" (ID: ${keep.id})`)
      
      for (const item of toDelete) {
        try {
          await prisma.menuItem.delete({
            where: { id: item.id },
          })
          deleted++
          console.log(`   ❌ Deleted duplicate (ID: ${item.id})`)
        } catch (error: any) {
          errors++
          console.error(`   ⚠️  Failed to delete (ID: ${item.id}):`, error.message)
        }
      }
      console.log()
    }

    console.log('\n✅ Duplicate removal completed!')
    console.log(`   Duplicates deleted: ${deleted}`)
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
    console.log(`\n✅ Total menu items remaining: ${total}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeDuplicates()
