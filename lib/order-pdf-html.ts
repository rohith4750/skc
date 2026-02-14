/**
 * Builds order PDF HTML (menu + event details) for html2canvas rendering
 * Shared between Order History and Bill page
 */

export function buildOrderPdfHtml(
  order: any,
  options: { useEnglish: boolean; formatDate: (d: string | Date) => string }
): string {
  const { useEnglish, formatDate } = options
  const customer = order.customer
  const supervisor = order.supervisor
  const mealTypeAmounts = order.mealTypeAmounts as Record<string, { amount?: number; date?: string; numberOfMembers?: number; services?: string[] } | number> | null

  const eventDates: string[] = []
  if (mealTypeAmounts) {
    Object.entries(mealTypeAmounts).forEach(([, data]) => {
      if (typeof data === 'object' && data !== null && data.date) {
        const dateStr = formatDate(data.date)
        if (!eventDates.includes(dateStr)) eventDates.push(dateStr)
      }
    })
  }
  const eventDateDisplay = eventDates.length > 0 ? eventDates.join(', ') : formatDate(order.createdAt)

  const itemsByType: Record<string, any[]> = {}
    ; (order.items || []).forEach((item: any) => {
      const type = item.menuItem?.type || 'OTHER'
      if (!itemsByType[type]) itemsByType[type] = []
      itemsByType[type].push(item)
    })

  const getMemberCount = (mealType: string): string => {
    if (mealTypeAmounts) {
      const mealData = mealTypeAmounts[mealType.toLowerCase()] as any
      if (mealData && typeof mealData === 'object' && mealData.numberOfMembers) {
        return ` (${mealData.numberOfMembers} Members)`
      }
    }
    return ''
  }

  const getMealTypePriority = (type: string) => {
    const priorities: Record<string, number> = {
      'BREAKFAST': 1,
      'LUNCH': 2,
      'DINNER': 3,
      'SNACKS': 4
    }
    return priorities[type.toUpperCase()] || 99
  }

  let menuItemsHtml = ''
  Object.keys(itemsByType)
    .sort((a, b) => getMealTypePriority(a) - getMealTypePriority(b))
    .forEach((type) => {
      const memberInfo = getMemberCount(type)

      let servicesLabel = ''
      if (mealTypeAmounts) {
        const mealKey = Object.keys(mealTypeAmounts).find(k => k.toLowerCase() === type.toLowerCase())
        const mealData = mealKey ? (mealTypeAmounts[mealKey] as any) : null

        if (mealData && Array.isArray(mealData.services) && mealData.services.length > 0) {
          const formattedServices = mealData.services.map((s: string) => {
            return s.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
          }).join(', ')
          servicesLabel = ` - Services: ${formattedServices}`
        }
      }

      menuItemsHtml += `
      <div style="grid-column: span 4; font-weight: 700; font-size: 14px; margin-top: 6px; margin-bottom: 3px; color: #222; text-transform: uppercase; padding-bottom: 2px; font-family: 'Poppins', sans-serif;">
        ${type}${memberInfo}${servicesLabel}
      </div>
    `
      itemsByType[type].forEach((item: any, index: number) => {
        const itemName = useEnglish
          ? (item.menuItem?.name || item.menuItem?.nameTelugu || 'Unknown Item')
          : (item.menuItem?.nameTelugu || item.menuItem?.name || 'Unknown Item')
        menuItemsHtml += `
        <div style="padding: 2px 4px; font-family: 'Poppins', sans-serif; line-height: 1.3; font-weight: 600; font-size: 14px;">
          ${index + 1}. ${itemName}${item.customization ? ` (${item.customization})` : ''}
        </div>
      `
      })
    })

  let stallsHtml = ''
  if (order.stalls && Array.isArray(order.stalls) && order.stalls.length > 0) {
    stallsHtml = `
      <div class="section">
        <div class="section-title">Stalls</div>
        <div style="font-size: 11px;">
      ${order.stalls.map((stall: any, idx: number) => `<div class="menu-item">${idx + 1}. ${stall.category}${stall.description ? ` - ${stall.description}` : ''}</div>`).join('')}
        </div>
      </div>
    `
  }

  return `
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { font-family: 'Poppins', sans-serif !important; }
      .header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #333; }
      .header-top { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 10px; color: #555; font-family: 'Poppins', sans-serif; }
      .header-main { font-size: 32px; font-weight: 700; margin: 15px 0 8px 0; letter-spacing: 2px; color: #1a1a1a; font-family: 'Poppins', sans-serif; }
      .header-subtitle { font-size: 14px; color: #666; margin-bottom: 12px; font-style: italic; font-family: 'Poppins', sans-serif; }
      .header-details { font-size: 9px; line-height: 1.6; color: #444; margin-top: 10px; font-family: 'Poppins', sans-serif; }
      .header-details div { margin-bottom: 3px; }
      .section { margin-bottom: 15px; font-family: 'Poppins', sans-serif; }
      .section-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #ddd; color: #222; font-family: 'Poppins', sans-serif; }
      .info-row { margin-bottom: 6px; font-family: 'Poppins', sans-serif; }
      .info-label { font-weight: 600; display: inline-block; width: 120px; font-family: 'Poppins', sans-serif; }
      .menu-item { padding: 2px 4px; font-family: 'Poppins', sans-serif; font-size: 11px; line-height: 1.3; font-weight: 600; }
    </style>
    <div class="header">
      <div class="header-top">
        <div>Telidevara Rajendraprasad</div>
        <div>ART FOOD ZONE (A Food Caterers)</div>
      </div>
      <div class="header-main">SRIVATSASA & KOWNDINYA CATERERS</div>
      <div class="header-subtitle">(Pure Vegetarian)</div>
      <div class="header-details">
        <div>Regd. No: 2361930100031</div>
        <div>Plot No. 115, Padmavathi Nagar, Bank Colony, Saheb Nag Vanathalipuram, Hyderabad - 500070.</div>
        <div>Email: pujyasri1989cya@gmail.com, Cell: 9866525102, 9963691393, 9390015302</div>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
      <div class="section">
        <div class="section-title">Customer Details</div>
        <div class="info-row"><span class="info-label">Name:</span> ${customer?.name || 'N/A'}</div>
        <div class="info-row"><span class="info-label">Phone:</span> ${customer?.phone || 'N/A'}</div>
        <div class="info-row"><span class="info-label">Email:</span> ${customer?.email || 'N/A'}</div>
        <div class="info-row"><span class="info-label">Address:</span> ${customer?.address || 'N/A'}</div>
      </div>
      <div class="section">
        <div class="section-title">Order Information</div>
        <div class="info-row"><span class="info-label">Event Date:</span> ${eventDateDisplay}</div>
        <div class="info-row"><span class="info-label">Order ID:</span> SKC-ORDER-${(order as any).serialNumber || order.id.slice(0, 8).toUpperCase()}</div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Menu Items</div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 11px;">
        ${menuItemsHtml}
      </div>
    </div>
    ${stallsHtml}
  `
}
