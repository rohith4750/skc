// API-based storage using Next.js API routes
// Replace localStorage with API calls

export class Storage {
  private static async fetchAPI(endpoint: string, options?: RequestInit) {
    const response = await fetch(`/api/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `API error: ${response.statusText}`)
    }
    
    return response.json()
  }

  // Helper to convert database dates to ISO strings
  private static formatDates(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.formatDates(item))
    }
    if (data && typeof data === 'object') {
      const formatted: any = {}
      for (const [key, value] of Object.entries(data)) {
        if (value instanceof Date) {
          formatted[key] = value.toISOString()
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          formatted[key] = this.formatDates(value)
        } else if (Array.isArray(value)) {
          formatted[key] = value.map(item => this.formatDates(item))
        } else {
          formatted[key] = value
        }
      }
      return formatted
    }
    return data
  }

  // Customers
  static async getCustomers() {
    const data = await this.fetchAPI('customers')
    return this.formatDates(data)
  }

  static async saveCustomer(customer: any) {
    if (customer.id) {
      const data = await this.fetchAPI(`customers/${customer.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          message: customer.message,
        }),
      })
      return this.formatDates(data)
    } else {
      const data = await this.fetchAPI('customers', {
        method: 'POST',
        body: JSON.stringify({
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          message: customer.message,
        }),
      })
      return this.formatDates(data)
    }
  }

  static async deleteCustomer(id: string) {
    await this.fetchAPI(`customers/${id}`, {
      method: 'DELETE',
    })
  }

  // Menu Items
  static async getMenuItems() {
    const data = await this.fetchAPI('menu')
    return this.formatDates(data)
  }

  static async saveMenuItem(item: any) {
    if (item.id) {
      const data = await this.fetchAPI(`menu/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: item.name,
          type: item.type,
          description: item.description,
          isActive: item.isActive,
        }),
      })
      return this.formatDates(data)
    } else {
      const data = await this.fetchAPI('menu', {
        method: 'POST',
        body: JSON.stringify({
          name: item.name,
          type: item.type,
          description: item.description,
          isActive: item.isActive !== undefined ? item.isActive : true,
        }),
      })
      return this.formatDates(data)
    }
  }

  static async deleteMenuItem(id: string) {
    await this.fetchAPI(`menu/${id}`, {
      method: 'DELETE',
    })
  }

  // Orders
  static async getOrders() {
    const data = await this.fetchAPI('orders')
    return this.formatDates(data)
  }

  static async saveOrder(order: any) {
    const data = await this.fetchAPI('orders', {
      method: 'POST',
      body: JSON.stringify({
        customerId: order.customerId,
        supervisorId: order.supervisorId,
        items: order.items,
        totalAmount: order.totalAmount,
        advancePaid: order.advancePaid,
        remainingAmount: order.remainingAmount,
        status: order.status || 'pending',
        mealTypeAmounts: order.mealTypeAmounts,
        stalls: order.stalls,
        discount: order.discount || 0,
      }),
    })
    return this.formatDates(data)
  }

  static async deleteOrder(id: string) {
    await this.fetchAPI(`orders/${id}`, {
      method: 'DELETE',
    })
  }

  // Bills
  static async getBills() {
    const data = await this.fetchAPI('bills')
    return this.formatDates(data)
  }

  static async saveBill(bill: any) {
    const data = await this.fetchAPI('bills', {
      method: 'PUT',
      body: JSON.stringify({
        id: bill.id,
        paidAmount: bill.paidAmount,
        remainingAmount: bill.remainingAmount,
        status: bill.status,
      }),
    })
    return this.formatDates(data)
  }

  // Supervisors
  static async getSupervisors() {
    const data = await this.fetchAPI('supervisors')
    return this.formatDates(data)
  }

  static async saveSupervisor(supervisor: any) {
    if (supervisor.id) {
      const data = await this.fetchAPI(`supervisors/${supervisor.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: supervisor.name,
          email: supervisor.email,
          phone: supervisor.phone,
          cateringServiceName: supervisor.cateringServiceName,
          isActive: supervisor.isActive,
        }),
      })
      return this.formatDates(data)
    } else {
      const data = await this.fetchAPI('supervisors', {
        method: 'POST',
        body: JSON.stringify({
          name: supervisor.name,
          email: supervisor.email,
          phone: supervisor.phone,
          cateringServiceName: supervisor.cateringServiceName,
          isActive: supervisor.isActive !== undefined ? supervisor.isActive : true,
        }),
      })
      return this.formatDates(data)
    }
  }

  static async deleteSupervisor(id: string) {
    await this.fetchAPI(`supervisors/${id}`, {
      method: 'DELETE',
    })
  }
}
