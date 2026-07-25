# Catering Management System (SKC Caterers)

A multi-platform system for managing catering services, customers, orders, bills, expenses, stock, and real-time workforce tracking. The system consists of:
1. **Web/Desktop application (`skc`)**: A Next.js 14 & Electron desktop shell for administrators.
2. **Mobile companion app (`skc-mobile`)**: An Expo (React Native) app for supervisors, delivery workforce, and field agents.

---

## Table of Contents

1. [System Flow Overview](#1-system-flow-overview)
2. [Database Schema & Entity Relationships](#2-database-schema--entity-relationships)
3. [Step-by-Step Business Workflows](#3-step-by-step-business-workflows)
   - [Order & Quotation Lifecycle](#order--quotation-lifecycle)
   - [Billing & Payments Lifecycle](#billing--payments-lifecycle)
   - [Expense Management (Regular vs. Bulk)](#expense-management-regular-vs-bulk)
   - [Workforce Payments & Payout Matching](#workforce-payments--payout-matching)
   - [Real-time Delivery Location Tracking Flow](#real-time-delivery-location-tracking-flow)
   - [Stock & Inventory Flow](#stock--inventory-flow)
4. [Real-time Events, Alerts & Notifications](#4-real-time-events-alerts--notifications)
5. [Mobile Companion Application (`skc-mobile`)](#5-mobile-companion-application-skc-mobile)
6. [Architecture & Technology Stack](#6-architecture--technology-stack)
7. [Getting Started & Local Development Setup](#7-getting-started--local-development-setup)
8. [Electron Desktop Packaging](#8-electron-desktop-packaging)

---

## 1. System Flow Overview

The SKC Caterers system is built around a centralized workflow designed to handle everything from initial customer enquiries to post-event financial analysis and live tracking of deliveries.

```mermaid
graph TD
    A[Customer Enquiry / Signup] --> B[Create Order / Quotation]
    B --> C{Order Status Change?}
    C -->|in-progress / completed| D[Generate Bill]
    C -->|cancelled / quotation / pending| E[Keep as Quotation]
    D --> F[Log Payments & Track Balance]
    D --> G[Track Event Expenses]
    G --> H[Allocate Expenses to Workforce]
    F --> I[Financial Analytics & Reports]
    G --> I
    I --> J[Stock/Inventory Alerts & Live SSE Notifications]
    
    %% Mobile flow
    B -.-> K[Mobile App: View/Edit Orders]
    D -.-> L[Mobile App: Collect Payments]
    H -.-> M[Mobile App: Delivery Tracking]
    M -.-> N[Upload Real-time GPS coordinates]
    N -.-> J
```

---

## 2. Database Schema & Entity Relationships

The PostgreSQL database (managed via Prisma) maps out the relationships between customers, supervisors, orders, menu items, bills, expenses, stock, inventory, and workforce tracking.

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    SUPERVISOR ||--o{ ORDER : supervises
    ORDER ||--o{ ORDER_ITEM : contains
    MENU_ITEM ||--o{ ORDER_ITEM : customizes
    ORDER ||--|| BILL : generates
    ORDER ||--o{ EXPENSE : incurs
    USER ||--o{ LOGIN_AUDIT_LOG : tracks
    STOCK ||--o{ STOCK_TRANSACTION : records
    WORKFORCE ||--o{ DELIVERY_LOCATION : records
```

### Main Database Entities & Rules

*   **Customer (`Customer`)**: Stores profile details (name, phone, email, address, custom message settings). Can be associated with a `CustomerUser` login profile.
*   **MenuItem (`MenuItem`)**: Master catalog of catering dishes, including English and Telugu names, category types (Breakfast, Lunch, Dinner, Snacks), unit prices, and status.
*   **Order (`Order`)**: The central object representing a booking. Tracks amounts, events, venues, stalls, services, and supervisor assignments.
*   **OrderItem (`OrderItem`)**: Join table between `Order` and `MenuItem` capturing selected items, quantity, meal type, and customization notes (e.g., spice level).
*   **Supervisor (`Supervisor`)**: Profiles for catering site managers who supervise orders.
*   **Bill (`Bill`)**: Stores the payment ledger linked 1-to-1 with an order.
*   **Expense (`Expense`)**: Tracks expenditures. Can be tied directly to one order or split across multiple orders as a bulk expense.
*   **Workforce (`Workforce`)**: Internal employees (e.g., chefs, transport, boys) who receive payout matching based on expense recipient names.
*   **DeliveryLocation (`DeliveryLocation`)**: Stores coordinates (`lat`, `lng`, timestamp) uploaded by the workforce mobile app for active delivery tracking.
*   **Stock (`Stock`)**: Tracks raw materials and consumables (e.g., gas, vegetables, disposables) with transaction logs.
*   **Inventory (`Inventory`)**: Tracks non-consumables (vessels, serving plates, spoons) and physical asset conditions.

---

## 3. Step-by-Step Business Workflows

### Order & Quotation Lifecycle

An order begins as a pending quotation and progresses through execution to final completion.

```mermaid
stateDiagram-v2
    [*] --> Quotation: Customer or Admin Creates Order
    Quotation --> Pending: Finalizing Details / Items / Timings
    Pending --> InProgress: Event Execution Commenced (Triggers Bill Creation)
    InProgress --> Completed: Event Finished (Forces Bill Status: Paid)
    InProgress --> Cancelled: Order Terminated
    Pending --> Cancelled: Order Terminated
    Quotation --> Cancelled: Order Terminated
```

1.  **Quotation / Creation**:
    *   An order is created via `/api/orders` specifying a customer, items, date, venue, transport, discount, and any advance payment.
    *   The backend validates all amounts and generates `OrderItem` linkages.
    *   **Crucial Rule**: No `Bill` record is created at initial creation when the order status is set to `quotation` or `pending`.
2.  **Status Transition (Triggering Bills)**:
    *   When an order's status is updated to `in_progress` or `completed`, a **Bill is automatically generated** if one does not exist.
    *   If the status is marked as `completed`, the order balances are zeroed and the bill status is forced to `paid`.
3.  **Order Modifications**:
    *   A full update deletes existing order items and replaces them with new ones.
    *   If the order amounts change, the corresponding `Bill` (if already generated) is automatically updated to reflect the new `totalAmount`, `paidAmount` (synced to new `advancePaid`), and `remainingAmount`.

---

### Billing & Payments Lifecycle

Bills keep track of the financial ledger of each order.

```mermaid
stateDiagram-v2
    [*] --> Pending: Bill Created (No payment beyond advance)
    Pending --> Partial: Partial Payment Logged (Paid < Total)
    Partial --> Paid: Paid Amount Equals Total
    Pending --> Paid: Full Payment Received
```

*   **Payment History**: When payments are received, they are appended to the `paymentHistory` JSON array in the `Bill` record. Each record contains:
    *   `amountPaid`: Decimal value of this transaction.
    *   `paymentDate`: Timestamp of the transaction.
    *   `paymentMethod`: Cash, UPI, Bank Transfer, or Cheque.
    *   `notes`: Any reference or memo.
*   **Balance Sync**: Anytime the `paidAmount` or `totalAmount` in a bill updates:
    *   `remainingAmount` is calculated as `totalAmount - paidAmount`.
    *   The payment status changes: `pending` -> `partial` -> `paid`.
    *   The parent `Order` record's `advancePaid` and `remainingAmount` fields are automatically updated to match.

---

### Expense Management (Regular vs. Bulk)

Expenses allow caterers to calculate their net profit margins for events.

```mermaid
graph TD
    A[Log Expense] --> B{Bulk Expense?}
    B -->|No| C[Link to Single Order]
    C --> D[Update Order Remaining Expense Ledger]
    B -->|Yes| E[Select Allocation Method]
    E --> F[Equal / Manual / By Plates / By Percentage]
    F --> G[Distribute Costs Across Target Orders via JSON]
```

1.  **Regular Expenses**:
    *   Tied directly to an `orderId`.
    *   Tracks fields like `category` (chef, supervisor, transport, gas, etc.), `amount`, `paidAmount`, `recipient`, and `paymentDate`.
    *   `paymentStatus` is derived automatically (`pending`, `partial`, `paid`) depending on whether `paidAmount` matches the total `amount`.
2.  **Bulk Expenses**:
    *   Covers multiple event orders simultaneously (e.g., purchasing a wholesale batch of vegetables or gas cylinders used for three different events).
    *   `isBulkExpense` is set to `true`, and `orderId` is set to `null`.
    *   The allocation is defined in a `bulkAllocations` JSON array.
    *   **Allocation Methods**:
        *   `equal`: The total expense is divided equally among the listed orders.
        *   `manual`: The operator specifies the exact amount allocated to each order.
        *   `by-plates`: Divides the expense proportionally based on the total plate count of each order.
        *   `by-percentage`: Allocates based on user-defined percentages.

---

### Workforce Payments & Payout Matching

Workforce profiles (e.g., chefs, transportation drivers, and supervisors) operate independently of expenses in the database. Payout tracking uses the following rule:

*   **Case-Insensitive Payout Matching**: When retrieving workforce details, the system looks up all `Expense` records where the `recipient` name matches the workforce member's `name` (case-insensitive, exact or partial match).
*   **Aggregated Metrics**: The app dynamically aggregates matched expenses to display a live dashboard of outstanding payroll obligations:
    *   `totalAmount`: Sum of all expenses under their name.
    *   `totalPaidAmount`: Sum of actual payments issued to them.
    *   `remainingAmount`: Outstanding debt.
    *   `overallPaymentStatus`: Status indicator of their payments (`pending`, `partial`, `paid`).

---

### Real-Time Delivery Location Tracking Flow

The system provides live GPS tracking of food deliveries from the kitchen to the venue.

1.  **Workforce Identification**: Each active delivery driver profile in `Workforce` contains a unique `trackingToken`.
2.  **Mobile Tracking**: When a driver starts a delivery, the mobile app hooks into the device's GPS and broadcasts coordinate changes (`lat`, `lng`) along with the `trackingToken` to the server API (`/api/workforce/[id]/locations`).
3.  **Live Storage**: The server writes the coordinates directly into the `DeliveryLocation` table.
4.  **Admin Monitoring**: The Next.js admin portal retrieves coordinates for active workers and renders their live locations using a map component (Leaflet/React-Leaflet).

---

### Stock & Inventory Flow

The stock and inventory system manages materials and assets used across catering operations.

```mermaid
sequenceDiagram
    participant User as Store Manager
    participant Stock as Stock Database
    participant Log as Stock Transactions
    
    User->>Stock: Register Stock (Sets name, minStock, supplier)
    Note over Stock,Log: Creates automatic "in" Transaction
    User->>Log: Add "in" Transaction (Replenish Stock)
    Log->>Stock: Increment currentStock
    User->>Log: Add "out" Transaction (Consume Stock for Event)
    alt Out Quantity > currentStock
        Log-->>User: Abort: Insufficient Stock
    else Out Quantity <= currentStock
        Log->>Stock: Decrement currentStock
    end
```

*   **Stock (Consumables)**:
    *   Tracks items like gas cylinders, cooking oil, and vegetables.
    *   Contains `currentStock`, `minStock`, and `maxStock` fields.
    *   "in" transactions increase `currentStock`, and "out" transactions decrease it.
    *   The API enforces that "out" transactions are blocked if they would reduce `currentStock` below zero.
*   **Inventory (Non-Consumable Assets)**:
    *   Tracks utensils, large vessels, and serving spoons.
    *   Does not use transaction logs; uses a flat quantity manager with quality metrics: `good`, `fair`, `damaged`, or `repair`.

---

## 4. Real-Time Events, Alerts & Notifications

To keep administrative operators informed of critical events, the application features two main pathways:

### 1. Server-Sent Events (SSE) Live Notifications
*   Clients establish a persistent connection to `/api/notifications/stream`.
*   Whenever a critical business action completes (e.g., order created, payment received, low stock threshold hit, login success/failure), the server fires a real-time notification payload.
*   Upon connecting, clients receive the last 20 events held in server memory followed by real-time updates.

### 2. Consolidated Alerts
The system checks for operational issues on the `/api/alerts` endpoint:
*   **Low Stock**: Stock items whose `currentStock` is below `minStock` or Inventory items whose `quantity` is below `minQuantity`.
*   **Pending Payments**: Generated bills that are past due and still flagged as `pending` or `partial`.
*   **Failed Logins**: Checks the `LoginAuditLog` table for failed attempts in the last 24 hours to alert administrators of potential security threats.

---

## 5. Mobile Companion Application (`skc-mobile`)

The mobile client is built using React Native and Expo, providing an on-the-go portal for staff members.

### Directory Structure
```
skc-mobile/
├── src/
│   ├── components/       # Custom React Native UI components
│   ├── navigation/       # Navigation stack configurations
│   ├── redux/            # Redux Toolkit state stores
│   ├── screens/          # Screen components
│   └── services/         # API clients and Auth context
```

### Main Screens
*   **`LoginScreen`**: Authenticate administrators and supervisors on-site.
*   **`HomeScreen`**: Dynamic dashboard displaying daily operations, count summaries, and quick links.
*   **`OrdersScreen` / `OrderDetailScreen` / `NewOrderScreen`**: Manage, edit, and create bookings on the go.
*   **`BillsScreen`**: Keep track of bills and log partial/full payments immediately at the venue.
*   **`ExpensesScreen`**: Log expenses like local labor, boys, transport, and ingredients directly from the site.
*   **`DeliveryScreen`**: GPS transmitter module that initiates background tracking and streams coordinates to the database.
*   **`StockScreen`**: View and adjust inventory stock levels from the storage facility.

---

## 6. Architecture & Technology Stack

The application is structured as a monorepo containing a web-based client/server system that can be packaged into a native desktop shell:

*   **Frontend Framework**: Next.js 14 (App Router) utilizing TypeScript.
*   **Mobile Framework**: Expo / React Native using React Native Paper for UI styling and Redux Toolkit for state management.
*   **Database Client**: Prisma ORM with a PostgreSQL client.
*   **Styling**: Custom Tailwind CSS (for web) and React Native Paper (for mobile).
*   **Desktop Shell**: Electron integration with a preloader script (`preload.js`) for offline caching support.
*   **PDF Generation**: `jsPDF` and `html2canvas` for compiling and saving professional invoices.
*   **Real-time Infrastructure**: Pusher integration or fallback Server-Sent Events (SSE).
*   **Communication Channels**: Integration with Resend/Nodemailer for emails, and Twilio/WhatsApp APIs for status messaging.

---

## 7. Getting Started & Local Development Setup

### Prerequisites
*   Node.js 18+
*   PostgreSQL Database instance

### Web/Desktop App Installation (`skc`)
1.  **Install dependencies**:
    ```bash
    cd skc
    npm install
    ```
2.  **Configure environment variables** by creating a `.env` file in the `skc` root:
    ```env
    DATABASE_URL="postgresql://username:password@localhost:5432/catering_db?schema=public"
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    
    # SMTP email configuration
    SMTP_HOST="smtp.gmail.com"
    SMTP_PORT=587
    SMTP_SECURE=false
    SMTP_USER="example@gmail.com"
    SMTP_PASS="xxxx xxxx xxxx xxxx"
    SMTP_FROM="example@gmail.com"
    ```
3.  **Initialize Database Schema and Client**:
    ```bash
    npx prisma generate
    npx prisma migrate dev --name init
    ```
4.  **Seed Default Menu Items**:
    ```bash
    npx prisma db seed
    ```
5.  **Run in Development Mode**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

### Mobile App Installation (`skc-mobile`)
1.  **Install dependencies**:
    ```bash
    cd skc-mobile
    npm install
    ```
2.  **Run with Expo**:
    ```bash
    npm run start
    ```
    Scan the generated QR code with your Expo Go app (on iOS or Android) to run the application.

---

## 8. Electron Desktop Packaging

The application runs inside a local Electron container wrapper for Windows, providing native file printing capabilities and menu controls.

*   **Run Desktop App in Dev Mode**:
    ```bash
    npm run electron-dev
    ```
*   **Pack Electron App (Directory layout)**:
    ```bash
    npm run electron-pack
    ```
*   **Build Installer (.exe installer)**:
    ```bash
    npm run electron-dist
    ```
    This builds the final installer and saves it to the `dist` directory, producing `SKC Caterers Setup 1.0.0.exe`.
