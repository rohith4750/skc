// Simple localStorage-based data storage
// In production, replace with a real database

export class Storage {
  private static getItem<T>(key: string): T[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  }

  private static setItem<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, JSON.stringify(data))
  }

  // Customers
  static getCustomers() {
    return this.getItem<any>('customers')
  }

  static saveCustomer(customer: any) {
    const customers = this.getCustomers()
    const existingIndex = customers.findIndex((c: any) => c.id === customer.id)
    if (existingIndex >= 0) {
      customers[existingIndex] = customer
    } else {
      customers.push(customer)
    }
    this.setItem('customers', customers)
  }

  static deleteCustomer(id: string) {
    const customers = this.getCustomers().filter((c: any) => c.id !== id)
    this.setItem('customers', customers)
  }

  // Menu Items
  static getMenuItems() {
    return this.getItem<any>('menuItems')
  }

  static saveMenuItem(item: any) {
    const items = this.getMenuItems()
    const existingIndex = items.findIndex((i: any) => i.id === item.id)
    if (existingIndex >= 0) {
      items[existingIndex] = item
    } else {
      items.push(item)
    }
    this.setItem('menuItems', items)
  }

  static deleteMenuItem(id: string) {
    const items = this.getMenuItems().filter((i: any) => i.id !== id)
    this.setItem('menuItems', items)
  }

  // Orders
  static getOrders() {
    return this.getItem<any>('orders')
  }

  static saveOrder(order: any) {
    const orders = this.getOrders()
    const existingIndex = orders.findIndex((o: any) => o.id === order.id)
    if (existingIndex >= 0) {
      orders[existingIndex] = order
    } else {
      orders.push(order)
    }
    this.setItem('orders', orders)
  }

  static deleteOrder(id: string) {
    const orders = this.getOrders().filter((o: any) => o.id !== id)
    this.setItem('orders', orders)
  }

  // Bills
  static getBills() {
    return this.getItem<any>('bills')
  }

  static saveBill(bill: any) {
    const bills = this.getBills()
    const existingIndex = bills.findIndex((b: any) => b.id === bill.id)
    if (existingIndex >= 0) {
      bills[existingIndex] = bill
    } else {
      bills.push(bill)
    }
    this.setItem('bills', bills)
  }

  // Supervisors
  static getSupervisors() {
    return this.getItem<any>('supervisors')
  }

  static saveSupervisor(supervisor: any) {
    const supervisors = this.getSupervisors()
    const existingIndex = supervisors.findIndex((s: any) => s.id === supervisor.id)
    if (existingIndex >= 0) {
      supervisors[existingIndex] = supervisor
    } else {
      supervisors.push(supervisor)
    }
    this.setItem('supervisors', supervisors)
  }

  static deleteSupervisor(id: string) {
    const supervisors = this.getSupervisors().filter((s: any) => s.id !== id)
    this.setItem('supervisors', supervisors)
  }
}
