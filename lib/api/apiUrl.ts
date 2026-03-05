export const apiUrl = {
  // Auth
  POST_login: `/auth/login`,
  POST_logout: `/auth/logout`,
  POST_forgotPassword: `/auth/forgot-password`,
  POST_resetPassword: `/auth/reset-password`,
  POST_changePassword: `/auth/change-password`,
  GET_me: `/auth/me`,

  // Orders
  GET_getAllOrders: `/orders`,
  POST_createOrder: `/orders`,
  GET_getOrderById: (id: string | number) => `/orders/${id}`,
  PUT_updateOrder: (id: string | number) => `/orders/${id}`,
  DEL_deleteOrder: (id: string | number) => `/orders/${id}`,
  POST_sendOrderEmail: (id: string | number) => `/orders/${id}/send-email`,
  POST_mergeOrders: `/orders/merge`,
  POST_discardOrderSession: `/orders/discard-session`,
  POST_discardOrderDate: `/orders/discard-date`,

  // Bills
  GET_getAllBills: `/bills`,
  GET_getBillById: (id: string | number) => `/bills/${id}`,
  PUT_updateBill: (id: string | number) => `/bills/${id}`,
  DEL_deleteBill: (id: string | number) => `/bills/${id}`,
  POST_sendBillEmail: (id: string | number) => `/bills/${id}/send`,
  GET_getBillLedger: (id: string | number) => `/bills/${id}/ledger`,

  // Users
  GET_getAllUsers: `/users`,
  POST_createUser: `/users`,
  GET_getUserById: (id: string | number) => `/users/${id}`,
  PUT_updateUser: (id: string | number) => `/users/${id}`,
  DEL_deleteUser: (id: string | number) => `/users/${id}`,

  // Workforce
  GET_getAllWorkforce: `/workforce`,
  POST_createWorkforce: `/workforce`,
  GET_getWorkforceById: (id: string | number) => `/workforce/${id}`,
  PUT_updateWorkforce: (id: string | number) => `/workforce/${id}`,
  DEL_deleteWorkforce: (id: string | number) => `/workforce/${id}`,
  GET_getWorkforceOutstanding: `/workforce/outstanding`,
  DEL_deleteWorkforcePayment: `/workforce/payments`,
  POST_createWorkforcePayment: `/workforce/payments`,

  // Expenses
  GET_getAllExpenses: `/expenses`,
  POST_createExpense: `/expenses`,
  GET_getExpenseById: (id: string | number) => `/expenses/${id}`,
  PUT_updateExpense: (id: string | number) => `/expenses/${id}`,
  DEL_deleteExpense: (id: string | number) => `/expenses/${id}`,

  // Stock
  GET_getAllStock: `/stock`,
  POST_createStock: `/stock`,
  GET_getStockById: (id: string | number) => `/stock/${id}`,
  PUT_updateStock: (id: string | number) => `/stock/${id}`,
  DEL_deleteStock: (id: string | number) => `/stock/${id}`,
  GET_getStockTransactions: (id: string | number) =>
    `/stock/${id}/transactions`,

  // Inventory
  GET_getAllInventory: `/inventory`,
  POST_createInventory: `/inventory`,
  GET_getInventoryById: (id: string | number) => `/inventory/${id}`,
  PUT_updateInventory: (id: string | number) => `/inventory/${id}`,
  DEL_deleteInventory: (id: string | number) => `/inventory/${id}`,
};
