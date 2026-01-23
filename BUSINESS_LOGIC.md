# Business Logic Overview

This document explains the core business logic implemented in the app.
It summarizes how data flows through the main workflows and APIs.

## Core Concepts

- The system manages catering orders, payments, expenses, workforce payouts, and inventory.
- Orders are the central business object. Bills and expenses are tied to orders.
- Notifications are published for major events (orders, payments, expenses, stock, auth).

## Order Lifecycle

### Create Order
- Required: `customerId`, at least one menu item.
- Amounts are normalized to numbers:
  - `totalAmount`, `advancePaid`, `remainingAmount`.
- Order items are created as a list of `OrderItem` records.
- No bill is created at order creation time.
- Notifications:
  - "Order created"
  - "Advance received" (only if `advancePaid > 0`)

### Update Order
- Two update modes:
  1) Status-only update
  2) Full order update with items and amounts

#### Status-only Update
- If only `status` is provided:
  - Order status is updated.
  - Bill is created only when status becomes `in-progress` or `completed`.
  - If status becomes `completed`, bill is forced to `paid` and order balances are zeroed.
- Notification: "Order status updated"

#### Full Order Update
- All amounts are validated.
- Menu items are replaced in full:
  - Existing items deleted.
  - New items inserted.
- Bill is updated if it exists:
  - `paidAmount` = `advancePaid`
  - `remainingAmount` = `totalAmount - advancePaid`
  - `status` becomes `pending | partial | paid`
  - Payment history entries are appended when:
    - Advance changes
    - Additional payment is recorded
    - Meal type member changes occur
- Notification: "Order updated"
- If `advancePaid` increased, a "Payment received" notification is sent.

### Delete Order
- Deletes the bill for that order (if any).
- Deletes the order itself.
- Order items are deleted automatically via cascade.

## Billing and Payments

### Bill Creation
- Bills are created only when:
  - Order status changes to `in-progress` or `completed`.
- Initial payment history is recorded if an advance exists.

### Bill Updates
- Bills can be updated directly:
  - Validates `paidAmount`, `remainingAmount`, and status.
  - Appends payment history only when paid amount increases.
- Order balances are synchronized with bill balances.

## Expenses

### Regular Expense
- Linked to one order (optional).
- `paymentStatus` is derived from `paidAmount` vs `amount`.

### Bulk Expense
- Must have at least 2 allocations.
- Total allocation must match expense amount.
- Bulk expenses do not have a direct `orderId`.
- Allocations are stored in JSON.

### Expense Updates
- Allows partial updates with validation.
- Recalculates payment status when paid amount changes.

## Workforce Payments

- Workforce records are independent.
- When listing workforce, expenses are matched by `recipient` name:
  - Case-insensitive, exact or partial match.
- Summary fields are computed:
  - `totalAmount`, `totalPaidAmount`
  - counts of pending / partial / paid
  - `overallPaymentStatus`

## Stock and Inventory

### Stock (Consumables)
- Stock items track `currentStock` and have transactions.
- Initial stock creates an "in" transaction automatically.
- Stock transactions:
  - `in` increases stock
  - `out` decreases stock (blocked if it would go negative)

### Inventory (Assets)
- Standalone items (e.g., vessels, serving items).
- Simple create/list with validation.

## Enquiries

- Public enquiry endpoint with strict CORS.
- Validates name, phone, email, subject, message.
- `source` is derived from request origin/host when possible.

## Authentication

### Login
- Accepts username or email with password.
- Validates credentials against hashed passwords.
- Login audit logs are created (success and failure).
- Notification published on successful login.

### Change Password
- Requires current password.
- New password is hashed and saved.

### Forgot Password
- Generates 6-digit code valid for 15 minutes.
- Saves reset token + expiry on user record.
- Sends email if configured (falls back to console log).
- Always returns success to prevent email enumeration.

### Reset Password
- Validates email + code + expiry.
- Updates password and clears reset token.
- Notification published on successful reset.

## Alerts and Monitoring

The alerts endpoint aggregates:
- Low inventory warnings (based on `minQuantity`, default 10).
- Payment reminders for pending/partial bills.
- Failed login attempts in last 24 hours.

Alerts are sorted by severity, then by date.

## Notifications (Live Stream)

- Server-Sent Events (SSE) stream of notifications.
- When a client connects:
  - Sends last 20 events from memory.
  - Pushes new events in real time.
  - Sends a heartbeat ping every 25s.

## Analytics (Predictive)

- Uses historical orders and expenses to compute:
  - Monthly revenue, expenses, orders, profit.
  - Forecasts for next N months.
  - Trend direction (up/down/stable).

## Reference (Main APIs)

- Orders: `GET/POST /api/orders`, `GET/PUT/DELETE /api/orders/[id]`
- Bills: `GET /api/bills`, `PUT /api/bills/[id]`
- Expenses: `GET/POST /api/expenses`, `GET/PUT/DELETE /api/expenses/[id]`
- Stock: `GET/POST /api/stock`, `GET/POST /api/stock/[id]/transactions`
- Inventory: `GET/POST /api/inventory`
- Workforce: `GET/POST /api/workforce`
- Customers: `GET/POST /api/customers`
- Menu: `GET/POST /api/menu`
- Supervisors: `GET/POST /api/supervisors`
- Users: `GET/POST /api/users`, `GET /api/users/audit-logs`
- Auth: `POST /api/auth/login`, `POST /api/auth/me`, `POST /api/auth/change-password`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- Enquiry: `GET/POST /api/enquiry`
- Alerts: `GET /api/alerts`
- Notifications: `GET /api/notifications/stream`
