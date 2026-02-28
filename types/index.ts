export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  message?: string;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  nameTelugu?: string;
  type: string[];
  description?: string;
  descriptionTelugu?: string;
  price?: number;
  unit?: string;
  isActive: boolean;
}

export interface OrderItem {
  menuItemId: string;
  quantity?: number;
}

export interface Order {
  id: string;
  serialNumber?: number;
  customerId: string;
  customer?: Customer;
  items: OrderItem[];
  orderType?: "EVENT" | "LUNCH_PACK";
  orderSource?: "ADMIN" | "CUSTOMER";
  totalAmount: number;
  advancePaid: number;
  remainingAmount: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  eventName?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  timeSlot?: string | null;
  venueType?: string | null;
  venue?: string | null;
  venueAddress?: string | null;
  city?: string | null;
  menuPackage?: string | null;
  specialRequests?: string | null;
  internalNote?: string | null;
  sourceDomain?: string | null;
  customerContactName?: string | null;
  customerContactEmail?: string | null;
  customerContactPhone?: string | null;
  discount?: number;
  services?: string[] | null;
  mealTypeAmounts?: Record<
    string,
    | {
        menuType?: string;
        amount?: number;
        date?: string;
        services?: string[];
        numberOfMembers?: number;
        pricingMethod?: "manual" | "plate-based";
        numberOfPlates?: number;
        platePrice?: number;
        manualAmount?: number;
        originalMembers?: number;
      }
    | number
  > | null;
  stalls?: Array<{
    category: string;
    description: string;
    cost: number | string;
  }> | null;
  numberOfMembers?: number | null;
  transportCost?: number;
  waterBottlesCost?: number;
  supervisorId?: string;
  supervisor?: Supervisor;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryEntry {
  id?: string;
  amount: number;
  totalPaid: number;
  remainingAmount: number;
  status: "pending" | "partial" | "paid";
  date: string;
  source?:
    | "order-edit"
    | "bill-update"
    | "status-update"
    | "booking"
    | "revision"
    | "payment";
  method?: "cash" | "upi" | "card" | "bank_transfer" | "other";
  membersChanged?: number;
  totalPriceChange?: number;
  notes?: string;
}

export interface Bill {
  id: string;
  serialNumber?: number;
  orderId: string;
  order?: Order;
  totalAmount: number;
  advancePaid: number;
  remainingAmount: number;
  paidAmount: number;
  status: "pending" | "partial" | "paid";
  paymentHistory?: PaymentHistoryEntry[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface Supervisor {
  id: string;
  name: string;
  email: string;
  phone: string;
  cateringServiceName: string;
  isActive: boolean;
}

export interface BulkAllocation {
  orderId: string;
  orderName: string; // Customer name + event name for display
  amount: number;
  percentage?: number;
  plates?: number; // For "by-plates" allocation method
}

export interface Expense {
  id: string;
  orderId?: string;
  order?: Order & { customer?: Customer };
  category: string;
  amount: number;
  paidAmount?: number;
  paymentStatus?: "pending" | "partial" | "paid";
  description?: string;
  recipient?: string;
  paymentDate: string;
  eventDate?: string;
  notes?: string;
  calculationDetails?: {
    method?: "plate-wise" | "total";
    plates?: number;
    perPlateAmount?: number;
    numberOfLabours?: number;
    numberOfBoys?: number;
    perUnitAmount?: number;
    mealTypePlates?: Array<{ mealType: string; plates: number }>;
  };
  // Bulk Allocation Fields
  isBulkExpense?: boolean;
  bulkAllocations?: BulkAllocation[];
  allocationMethod?: "equal" | "manual" | "by-plates" | "by-percentage";
  createdAt: string;
  updatedAt: string;
}
