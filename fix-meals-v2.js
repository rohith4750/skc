const fs = require('fs');
const file = 'd:/WORKKKKK/skc/skc/app/expenses/create/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

const regex1 = /const getOrderPlates = \(order: Order\): number => \{([\s\S]*?)    if \(order\.numberOfMembers\) return order\.numberOfMembers/;

const replacement1 = `const getOrderPlates = (order: Order, mealTypeIds?: string[]): number => {
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

    if (order.numberOfMembers) return order.numberOfMembers`;

if (txt.match(regex1)) {
  txt = txt.replace(regex1, replacement1);
  console.log('Replaced function signature.');
} else {
  console.log('Failed to match getOrderPlates regex');
}

const regex2 = /\} else if \(method === 'by-plates'\) \{([\s\S]*?)const ordersWithPlates = selectedOrders\.map\(order => \(\{([\s\S]*?)order,([\s\S]*?)plates: getOrderPlates\(order\)([\s\S]*?)\}\)\)/;

const replacement2 = `} else if (method === 'by-plates') {
      const filterByMealTypes = formData.category === 'chef' && formData.calculationMethod === 'plate-wise' && formData.selectedMealTypes.length > 0
      const mealTypeIds = filterByMealTypes ? formData.selectedMealTypes.map(m => m.id) : undefined

      const ordersWithPlates = selectedOrders.map(order => ({
        order,
        plates: getOrderPlates(order, mealTypeIds)
      }))`;

if (txt.match(regex2)) {
  txt = txt.replace(regex2, replacement2);
  console.log('Replaced by-plates invocation.');
} else {
  console.log('Failed to match by-plates regex');
}

fs.writeFileSync(file, txt);
