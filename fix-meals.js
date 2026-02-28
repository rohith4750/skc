const fs = require('fs');

const file = 'd:/WORKKKKK/skc/skc/app/expenses/create/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

const t1 = `  // Get plates/members count for an order (for by-plates allocation)
  const getOrderPlates = (order: Order): number => {
    if (order.numberOfMembers) return order.numberOfMembers
    // Try to get from mealTypeAmounts
    if (order.mealTypeAmounts) {
      let totalPlates = 0
      Object.values(order.mealTypeAmounts).forEach((meal: any) => {
        if (typeof meal === 'object' && meal.numberOfPlates) {
          totalPlates += meal.numberOfPlates
        } else if (typeof meal === 'object' && meal.numberOfMembers) {
          totalPlates += meal.numberOfMembers
        }
      })
      if (totalPlates > 0) return totalPlates
    }
    return 100 // Default if not found
  }`;

const r1 = `  // Get plates/members count for an order (for by-plates allocation)
  const getOrderPlates = (order: Order, mealTypeIds?: string[]): number => {
    if (mealTypeIds && mealTypeIds.length > 0) {
      if (order.mealTypeAmounts) {
        let totalPlates = 0
        Object.entries(order.mealTypeAmounts).forEach(([key, mealData]) => {
          let label = key
          if (mealData && typeof mealData === 'object' && (mealData as any).menuType) {
            label = (mealData as any).menuType
          }
          const mealId = label.toLowerCase().trim()
          
          if (mealTypeIds.includes(mealId)) {
            if (mealData && typeof mealData === 'object' && (mealData as any).numberOfPlates) {
              totalPlates += (mealData as any).numberOfPlates
            } else if (mealData && typeof mealData === 'object' && (mealData as any).numberOfMembers) {
              totalPlates += (mealData as any).numberOfMembers
            }
          }
        })
        if (totalPlates > 0) return totalPlates
      }
      return 0
    }

    if (order.numberOfMembers) return order.numberOfMembers
    // Try to get from mealTypeAmounts
    if (order.mealTypeAmounts) {
      let totalPlates = 0
      Object.values(order.mealTypeAmounts).forEach((meal: any) => {
        if (typeof meal === 'object' && meal.numberOfPlates) {
          totalPlates += meal.numberOfPlates
        } else if (typeof meal === 'object' && meal.numberOfMembers) {
          totalPlates += meal.numberOfMembers
        }
      })
      if (totalPlates > 0) return totalPlates
    }
    return 100 // Default if not found
  }`;

const t2 = `    } else if (method === 'by-plates') {
      const ordersWithPlates = selectedOrders.map(order => ({
        order,
        plates: getOrderPlates(order)
      }))
      const totalPlates = ordersWithPlates.reduce((sum, o) => sum + o.plates, 0)`;

const r2 = `    } else if (method === 'by-plates') {
      const filterByMealTypes = formData.category === 'chef' && formData.calculationMethod === 'plate-wise' && formData.selectedMealTypes.length > 0
      const mealTypeIds = filterByMealTypes ? formData.selectedMealTypes.map(m => m.id) : undefined

      const ordersWithPlates = selectedOrders.map(order => ({
        order,
        plates: getOrderPlates(order, mealTypeIds)
      }))
      const totalPlates = ordersWithPlates.reduce((sum, o) => sum + o.plates, 0)`;

if (txt.includes(t1) && txt.includes(t2)) {
  txt = txt.replace(t1, r1);
  txt = txt.replace(t2, r2);
  fs.writeFileSync(file, txt);
  console.log('done!');
} else {
  console.log('could not find chunks');
}
