export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  message?: string
  createdAt: string
}

export interface MenuItem {
  id: string
  name: string
  nameTelugu?: string
  type: string
  description?: string
  descriptionTelugu?: string
  isActive: boolean
}

export interface OrderItem {
  menuItemId: string
  quantity?: number
}

export interface Order {
  id: string
  customerId: string
  customer?: Customer
  items: OrderItem[]
  totalAmount: number
  advancePaid: number
  remainingAmount: number
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  supervisorId: string
  createdAt: string
  updatedAt: string
}

export interface Bill {
  id: string
  orderId: string
  order?: Order
  totalAmount: number
  advancePaid: number
  remainingAmount: number
  paidAmount: number
  status: 'pending' | 'partial' | 'paid'
  createdAt: string
  updatedAt: string
}

export interface Supervisor {
  id: string
  name: string
  email: string
  phone: string
  cateringServiceName: string
  isActive: boolean
}

export interface Expense {
  id: string
  orderId?: string
  order?: Order & { customer?: Customer }
  category: string
  amount: number
  paidAmount?: number
  paymentStatus?: 'pending' | 'partial' | 'paid'
  description?: string
  recipient?: string
  paymentDate: string
  eventDate?: string
  notes?: string
  calculationDetails?: {
    method?: 'plate-wise' | 'total'
    plates?: number
    perPlateAmount?: number
    numberOfLabours?: number
    numberOfBoys?: number
    perUnitAmount?: number
  }
  createdAt: string
  updatedAt: string
}
