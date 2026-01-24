# SKC Caterers - Complete Application Overview

**Comprehensive documentation covering hierarchy, database, local setup, and business logic**

---

## Table of Contents

1. [Application Hierarchy (File Structure)](#1-application-hierarchy-file-structure)
2. [Database Architecture](#2-database-architecture)
3. [Local Development Setup](#3-local-development-setup)
4. [Business Logic & Workflows](#4-business-logic--workflows)
5. [API Endpoints Reference](#5-api-endpoints-reference)
6. [Technology Stack](#6-technology-stack)

---

## 1. Application Hierarchy (File Structure)

### Root Directory Structure

```
skc/
├── app/                          # Next.js App Router (Main Application)
│   ├── api/                      # Backend API Routes
│   ├── alerts/                   # Alerts Management Page
│   ├── analytics/                # Analytics Dashboard
│   ├── audit-logs/               # Login Audit Logs Page
│   ├── bills/                    # Bills Management Pages
│   ├── customers/                # Customer Management Pages
│   ├── inventory/                # Inventory Management Pages
│   ├── login/                    # Authentication Pages
│   ├── menu/                     # Menu Management Page
│   ├── orders/                   # Order Management Pages
│   ├── profile/                  # User Profile Page
│   ├── reset-password/           # Password Reset Page
│   ├── stock/                    # Stock Management Pages
│   ├── supervisors/              # Supervisor Management Page
│   ├── tax/                      # Tax Management Page
│   ├── users/                    # User Management Page
│   ├── globals.css               # Global Styles
│   ├── layout.tsx                # Root Layout Component
│   └── page.tsx                  # Dashboard/Home Page
│
├── components/                   # Reusable React Components
│   ├── layout/                   # Layout Components
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx           # Main Navigation Sidebar
│   ├── notifications/            # Notification System
│   │   ├── NotificationCenter.tsx
│   │   └── useNotifications.ts
│   ├── AuthGuard.tsx             # Authentication Wrapper
│   ├── ConfirmModal.tsx          # Confirmation Dialogs
│   ├── FormError.tsx             # Form Error Display
│   ├── GlobalFetchInterceptor.tsx # API Request Interceptor
│   ├── GlobalLoader.tsx          # Global Loading Indicator
│   ├── Logo.tsx                  # Logo Component
│   ├── RoleGuard.tsx             # Role-based Access Control
│   ├── table-configs.tsx         # Table Configuration
│   └── Table.tsx                    # Reusable Table Component
│
├── lib/                          # Utility Libraries & Helpers
│   ├── auth.ts                   # Authentication Utilities
│   ├── email-server.ts           # Server-side Email Service
│   ├── email.ts                  # Email Utilities
│   ├── fetch-with-loader.ts     # API Fetch with Loading State
│   ├── initMenu.ts               # Menu Initialization
│   ├── loading-events.ts         # Loading Event Management
│   ├── notifications.ts          # Notification System
│   ├── pdf-template.tsx          # PDF Generation Templates
│   ├── prisma.ts                 # Prisma Client Instance
│   ├── storage-api.ts            # Database Storage Layer
│   ├── storage.ts                # LocalStorage (Legacy)
│   ├── utils.ts                  # General Utilities
│   └── validation.ts             # Input Validation
│
├── prisma/                       # Database Schema & Migrations
│   ├── schema.prisma             # Prisma Schema Definition
│   └── migrations/               # Database Migration Files
│
├── public/                       # Static Assets
│   └── images/                   # Image Assets
│
├── types/                        # TypeScript Type Definitions
│   └── index.ts                  # All Type Definitions
│
├── .env.local                    # Local Environment Variables (Gitignored)
├── .env                         # Default Environment Variables
├── .gitignore                   # Git Ignore Rules
├── next.config.js                # Next.js Configuration
├── package.json                  # Dependencies & Scripts
├── postcss.config.js             # PostCSS Configuration
├── tailwind.config.ts            # Tailwind CSS Configuration
├── tsconfig.json                 # TypeScript Configuration
└── vercel.json                   # Vercel Deployment Configuration
```

### App Directory Structure (Detailed)

```
app/
├── api/                          # Backend API Routes
│   ├── alerts/
│   │   └── route.ts              # GET - System alerts
│   ├── analytics/
│   │   └── predictive/
│   │       └── route.ts          # GET - Predictive analytics
│   ├── auth/                     # Authentication Endpoints
│   │   ├── change-password/
│   │   │   └── route.ts          # POST - Change password
│   │   ├── forgot-password/
│   │   │   └── route.ts          # POST - Request password reset
│   │   ├── login/
│   │   │   └── route.ts          # POST - User login
│   │   ├── me/
│   │   │   └── route.ts          # POST - Get current user
│   │   └── reset-password/
│   │       └── route.ts          # POST - Reset password
│   ├── bills/
│   │   ├── [id]/
│   │   │   ├── route.ts          # GET/PUT - Bill operations
│   │   │   └── send/
│   │   │       └── route.ts      # POST - Send bill via email
│   │   └── route.ts              # GET - List all bills
│   ├── customers/
│   │   ├── [id]/
│   │   │   └── route.ts          # GET/PUT/DELETE - Customer operations
│   │   └── route.ts              # GET/POST - List/Create customers
│   ├── enquiry/
│   │   └── route.ts              # GET/POST - Enquiry management
│   ├── expenses/
│   │   ├── [id]/
│   │   │   └── route.ts          # GET/PUT/DELETE - Expense operations
│   │   └── route.ts              # GET/POST - List/Create expenses
│   ├── inventory/
│   │   ├── [id]/
│   │   │   └── route.ts          # GET/PUT/DELETE - Inventory operations
│   │   └── route.ts              # GET/POST - List/Create inventory
│   ├── menu/
│   │   ├── [id]/
│   │   │   └── route.ts          # GET/PUT/DELETE - Menu item operations
│   │   └── route.ts              # GET/POST - List/Create menu items
│   ├── notifications/
│   │   └── stream/
│   │       └── route.ts          # GET - SSE notification stream
│   ├── orders/
│   │   ├── [id]/
│   │   │   └── route.ts          # GET/PUT/DELETE - Order operations
│   │   └── route.ts              # GET/POST - List/Create orders
│   ├── stock/
│   │   ├── [id]/
│   │   │   ├── route.ts          # GET/PUT/DELETE - Stock operations
│   │   │   └── transactions/
│   │   │       └── route.ts      # GET/POST - Stock transactions
│   │   └── route.ts              # GET/POST - List/Create stock
│   ├── supervisors/
│   │   ├── [id]/
│   │   │   └── route.ts          # GET/PUT/DELETE - Supervisor operations
│   │   └── route.ts              # GET/POST - List/Create supervisors
│   ├── users/
│   │   ├── [id]/
│   │   │   └── route.ts          # GET/PUT/DELETE - User operations
│   │   ├── audit-logs/
│   │   │   └── route.ts          # GET - Login audit logs
│   │   └── route.ts              # GET/POST - List/Create users
│   └── workforce/
│       ├── [id]/
│       │   └── route.ts          # GET/PUT/DELETE - Workforce operations
│       └── route.ts              # GET/POST - List/Create workforce
│
├── orders/                       # Order Management Pages
│   ├── financial/
│   │   ├── [id]/
│   │   │   └── page.tsx          # Order financial details
│   │   └── page.tsx              # Financial overview
│   ├── history/
│   │   └── page.tsx              # Order history list
│   ├── overview/
│   │   └── page.tsx              # Order center/overview
│   ├── summary/
│   │   ├── [id]/
│   │   │   └── page.tsx          # Order summary/details
│   │   └── page.tsx              # Order summaries
│   └── page.tsx                  # Create new order
│
├── customers/                    # Customer Management
│   ├── create/
│   │   └── page.tsx            # Create new customer
│   └── page.tsx                 # Customer list
│
├── stock/                        # Stock Management
│   ├── create/
│   │   └── page.tsx            # Create stock item
│   ├── transaction/
│   │   └── page.tsx            # Stock transactions
│   └── page.tsx                 # Stock list
│
├── inventory/                    # Inventory Management
│   ├── create/
│   │   └── page.tsx            # Create inventory item
│   └── page.tsx                 # Inventory list
│
└── [other-pages]/               # Other feature pages
```

---

## 2. Database Architecture

### Database Technology
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Connection**: Via `DATABASE_URL` environment variable

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Customer   │─────────│    Order    │─────────│  Supervisor │
└─────────────┘   1    *└─────────────┘    *    1└─────────────┘
                           │
                           │ 1
                           │
                           │ *
                    ┌─────────────┐
                    │ OrderItem  │
                    └─────────────┘
                           │
                           │ *
                           │
                    ┌─────────────┐
                    │  MenuItem   │
                    └─────────────┘

┌─────────────┐         ┌─────────────┐
│    Order   │─────────│    Bill    │
└─────────────┘   1    1└─────────────┘

┌─────────────┐         ┌─────────────┐
│    Order    │─────────│   Expense  │
└─────────────┘   1    *└─────────────┘
                           (nullable)

┌─────────────┐         ┌─────────────┐
│    User    │─────────│LoginAuditLog│
└─────────────┘   1    *└─────────────┘

┌─────────────┐         ┌─────────────┐
│    Stock   │─────────│StockTransac│
└─────────────┘   1    *└─────────────┘
```

### Database Models

#### 1. Customer
```prisma
model Customer {
  id        String   @id @default(uuid())
  name      String
  phone     String
  email     String
  address   String
  message   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]
}
```
- **Purpose**: Stores customer information
- **Relationships**: One-to-Many with Orders

#### 2. Supervisor
```prisma
model Supervisor {
  id                  String  @id @default(uuid())
  name                String
  email               String
  phone               String
  cateringServiceName String
  isActive            Boolean @default(true)
  orders              Order[]
}
```
- **Purpose**: Manages supervisors for catering services
- **Relationships**: One-to-Many with Orders (optional)

#### 3. MenuItem
```prisma
model MenuItem {
  id                String      @id @default(uuid())
  name              String
  nameTelugu        String?
  type              String
  description       String?
  descriptionTelugu String?
  isActive          Boolean     @default(true)
  orders            OrderItem[]
}
```
- **Purpose**: Master catalog of menu items
- **Relationships**: One-to-Many with OrderItems

#### 4. Order
```prisma
model Order {
  id              String      @id @default(uuid())
  customerId      String
  customer        Customer    @relation(...)
  supervisorId    String?
  supervisor      Supervisor? @relation(...)
  items           OrderItem[]
  orderType       OrderType?  @default(EVENT)
  orderSource     OrderSource? @default(ADMIN)
  totalAmount     Float
  advancePaid     Float       @default(0)
  remainingAmount Float
  status          String      @default("pending")
  mealTypeAmounts Json?
  stalls          Json?
  transportCost   Float       @default(0)
  discount        Float       @default(0)
  eventName       String?
  services        Json?
  numberOfMembers Int?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  bill            Bill?
  expenses        Expense[]
}
```
- **Purpose**: Central business entity for catering orders
- **Relationships**: 
  - Many-to-One with Customer
  - Many-to-One with Supervisor (optional)
  - One-to-Many with OrderItems
  - One-to-One with Bill
  - One-to-Many with Expenses

#### 5. OrderItem
```prisma
model OrderItem {
  id         String   @id @default(uuid())
  orderId    String
  order      Order    @relation(...)
  menuItemId String
  menuItem   MenuItem @relation(...)
  quantity   Int?     @default(1)
}
```
- **Purpose**: Join table linking Orders to MenuItems
- **Relationships**: Many-to-One with Order and MenuItem

#### 6. Bill
```prisma
model Bill {
  id              String   @id @default(uuid())
  orderId         String   @unique
  order           Order    @relation(...)
  totalAmount     Float
  advancePaid     Float    @default(0)
  remainingAmount Float
  paidAmount      Float    @default(0)
  status          String   @default("pending")
  paymentHistory  Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```
- **Purpose**: Financial record for orders
- **Relationships**: One-to-One with Order

#### 7. Expense
```prisma
model Expense {
  id                 String   @id @default(uuid())
  orderId            String?
  order              Order?   @relation(...)
  category           String
  amount             Float
  paidAmount         Float    @default(0)
  paymentStatus      String   @default("pending")
  description        String?
  recipient          String?
  paymentDate        DateTime @default(now())
  eventDate          DateTime?
  notes              String?
  calculationDetails Json?
  isBulkExpense      Boolean  @default(false)
  bulkAllocations    Json?
  allocationMethod   String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```
- **Purpose**: Tracks expenses (can be linked to orders or bulk)
- **Relationships**: Many-to-One with Order (nullable)

#### 8. User
```prisma
model User {
  id                String   @id @default(uuid())
  username          String   @unique
  email             String   @unique
  passwordHash      String
  role              String   @default("admin")
  resetToken        String?
  resetTokenExpiry  DateTime?
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  loginLogs         LoginAuditLog[]
}
```
- **Purpose**: Application user accounts
- **Roles**: "admin" or "super_admin"
- **Relationships**: One-to-Many with LoginAuditLog

#### 9. LoginAuditLog
```prisma
model LoginAuditLog {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(...)
  username    String
  ipAddress   String?
  userAgent   String?
  device      String?
  browser     String?
  os          String?
  location    String?
  loginTime   DateTime @default(now())
  success     Boolean  @default(true)
  failReason  String?
}
```
- **Purpose**: Audit trail for login attempts
- **Relationships**: Many-to-One with User

#### 10. Stock
```prisma
model Stock {
  id          String            @id @default(uuid())
  name        String
  category    String
  unit        String
  currentStock Float            @default(0)
  minStock    Float?
  maxStock    Float?
  price       Float?
  supplier    String?
  location    String?
  description String?
  isActive    Boolean           @default(true)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  transactions StockTransaction[]
}
```
- **Purpose**: Consumable stock items (gas, vegetables, disposables)
- **Relationships**: One-to-Many with StockTransaction

#### 11. StockTransaction
```prisma
model StockTransaction {
  id          String   @id @default(uuid())
  stockId     String
  stock       Stock    @relation(...)
  type        String   // "in" or "out"
  quantity    Float
  price       Float?
  totalAmount Float?
  reference   String?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```
- **Purpose**: Tracks stock movements
- **Relationships**: Many-to-One with Stock

#### 12. Inventory
```prisma
model Inventory {
  id          String   @id @default(uuid())
  name        String
  category    String
  quantity    Int      @default(0)
  minQuantity Int?
  unit        String
  condition   String   @default("good")
  location    String?
  supplier    String?
  purchaseDate DateTime?
  purchasePrice Float?
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```
- **Purpose**: Non-consumable assets (vessels, utensils)
- **Relationships**: None (standalone)

#### 13. Workforce
```prisma
model Workforce {
  id        String   @id @default(uuid())
  name      String
  role      String   // "chef", "supervisor", "transport"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
- **Purpose**: Internal workforce members
- **Relationships**: None (standalone, matched with expenses by name)

#### 14. Enquiry
```prisma
model Enquiry {
  id        String   @id @default(uuid())
  name      String
  phone     String
  email     String
  subject   String
  message   String
  source    String
  createdAt DateTime @default(now())
}
```
- **Purpose**: External enquiries from websites
- **Relationships**: None (standalone)

### Enums

```prisma
enum OrderType {
  EVENT
  LUNCH_PACK
}

enum OrderSource {
  ADMIN
  CUSTOMER
}
```

### Deletion Behavior

- **Order deletion**: Cascades to OrderItems, deletes associated Bill
- **User deletion**: Cascades to LoginAuditLog
- **Stock deletion**: Cascades to StockTransaction
- **Order deletion**: Sets Expense.orderId to NULL (does not delete expenses)

---

## 3. Local Development Setup

### Prerequisites

1. **Node.js** 18+ installed
2. **PostgreSQL** database running locally or remote
3. **npm** or **yarn** package manager

### Step-by-Step Setup

#### Step 1: Clone and Install Dependencies

```bash
# Navigate to project directory
cd skc

# Install dependencies
npm install
```

#### Step 2: Database Setup

**Option A: Local PostgreSQL**

1. Create database:
```sql
CREATE DATABASE catering_db;
```

2. Or using command line:
```bash
createdb catering_db
```

**Option B: Remote Database (Neon, Supabase, etc.)**
- Use provided connection string

#### Step 3: Environment Variables

Create `.env.local` file in root directory:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/catering_db?schema=public"

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Configuration (Choose ONE option)

# Option 1: Gmail SMTP (Free)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Option 2: Resend (Alternative)
# RESEND_API_KEY=re_xxxxxxxxxxxxx
# RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Getting Gmail App Password:**
1. Enable 2-factor authentication on Gmail
2. Visit: https://myaccount.google.com/apppasswords
3. Generate app password for "Mail"
4. Use 16-character password in `SMTP_PASS`

#### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

#### Step 5: Run Database Migrations

```bash
npx prisma migrate dev --name init
```

#### Step 6: (Optional) Seed Menu Data

If you have seed data:
```bash
npx prisma db seed
```

#### Step 7: Start Development Server

```bash
npm run dev
```

#### Step 8: Access Application

Open browser: `http://localhost:3000`

### Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment File Priority

1. `.env.local` - **Use for local development** (gitignored)
2. `.env.production` - Production defaults (optional)
3. `.env.development` - Development defaults (optional)
4. `.env` - Default values (committed, no secrets)

### Database Management

**View Database:**
```bash
npx prisma studio
```

**Create Migration:**
```bash
npx prisma migrate dev --name migration_name
```

**Reset Database:**
```bash
npx prisma migrate reset
```

---

## 4. Business Logic & Workflows

### Core Business Flow

```
Customer Registration → Order Creation → Bill Generation → Payment Tracking → Expense Management → Analytics
```

### Order Lifecycle

#### 1. Create Order
- **Required**: `customerId`, at least one menu item
- **Process**:
  1. Validate customer exists
  2. Validate menu items exist
  3. Calculate `totalAmount` from items and additional costs
  4. Set `remainingAmount = totalAmount - advancePaid`
  5. Create Order record
  6. Create OrderItem records for each menu item
  7. **No bill created at this stage**
- **Notifications**:
  - "Order created"
  - "Advance received" (if `advancePaid > 0`)

#### 2. Update Order

**Mode A: Status-Only Update**
- Only `status` field is provided
- Process:
  1. Update order status
  2. **Bill creation trigger**: If status becomes `in-progress` or `completed`
  3. If status is `completed`: Bill forced to `paid`, balances zeroed
- Notification: "Order status updated"

**Mode B: Full Order Update**
- All order fields provided
- Process:
  1. Validate all amounts
  2. Replace menu items (delete old, insert new)
  3. Update bill if exists:
     - `paidAmount = advancePaid`
     - `remainingAmount = totalAmount - advancePaid`
     - Update status: `pending | partial | paid`
  4. Append payment history when:
     - Advance changes
     - Additional payment recorded
     - Meal type member changes
- Notifications:
  - "Order updated"
  - "Payment received" (if `advancePaid` increased)

#### 3. Delete Order
- Process:
  1. Delete associated Bill (if exists)
  2. Delete Order record
  3. OrderItems deleted automatically (cascade)

### Billing and Payments

#### Bill Creation
- **Trigger**: Order status changes to `in-progress` or `completed`
- Initial payment history recorded if advance exists

#### Bill Updates
- Can be updated directly
- Validates: `paidAmount`, `remainingAmount`, status
- Payment history appended only when `paidAmount` increases
- Order balances synchronized with bill balances

#### Payment Status Flow
```
pending → partial → paid
```

### Expense Management

#### Regular Expense
- Linked to one order (optional)
- `paymentStatus` derived from: `paidAmount` vs `amount`
- Statuses: `pending`, `partial`, `paid`

#### Bulk Expense
- **Requirements**:
  - At least 2 allocations
  - Total allocation must match expense amount
- No direct `orderId` (stored in JSON `bulkAllocations`)
- Allocation methods:
  - `equal`: Split equally
  - `manual`: Manual amounts
  - `by-plates`: Based on plate counts
  - `by-percentage`: Percentage-based

#### Expense Categories
- `supervisor`
- `chef`
- `labours`
- `boys`
- `transport`
- `gas`
- `pan`
- `store`
- `other`

### Workforce Payments
- Workforce records are independent
- Expenses matched by `recipient` name (case-insensitive)
- Summary computed:
  - `totalAmount`, `totalPaidAmount`
  - Counts: pending/partial/paid
  - `overallPaymentStatus`

### Stock Management

#### Stock Items (Consumables)
- Categories: `gas`, `store`, `vegetables`, `disposables`
- Tracks `currentStock` with transactions
- Initial stock creates automatic "in" transaction

#### Stock Transactions
- **Type**: `in` (increases) or `out` (decreases)
- **Validation**: Blocks "out" if it would make stock negative
- Tracks: quantity, price, total amount, reference, notes

### Inventory Management
- **Purpose**: Non-consumable assets
- Categories: `glasses`, `vessels`, `cooking_utensils`, `serving_items`, `storage`, `other`
- Tracks: quantity, condition, location, supplier, purchase details

### Enquiry Management
- **Source**: External websites (e.g., skconline.in)
- **Process**:
  1. Public endpoint with CORS validation
  2. Validates: name, phone, email, subject, message
  3. `source` derived from request origin
  4. Stores in database
  5. Optional email/WhatsApp notification

### Authentication & Authorization

#### User Roles
- **admin**: Standard user (limited access)
- **super_admin**: Full system access

#### Login Process
1. Accepts username or email + password
2. Validates against hashed password (bcrypt)
3. Creates login audit log (success/failure)
4. Returns JWT token (stored in localStorage)
5. Notification on successful login

#### Password Management
- **Change Password**: Requires current password
- **Forgot Password**:
  1. Generates 6-digit code
  2. Valid for 15 minutes
  3. Saves reset token + expiry
  4. Sends email (or console log if not configured)
- **Reset Password**: Validates email + code + expiry

### Alerts System
Aggregates:
- Low inventory warnings (based on `minQuantity`)
- Payment reminders (pending/partial bills)
- Failed login attempts (last 24 hours)

Sorted by severity, then by date.

### Notifications (Real-time)
- **Technology**: Server-Sent Events (SSE)
- **Process**:
  1. Client connects to `/api/notifications/stream`
  2. Server sends last 20 events from memory
  3. New events pushed in real-time
  4. Heartbeat ping every 25 seconds

### Analytics (Predictive)
- Uses historical orders and expenses
- Computes:
  - Monthly revenue, expenses, orders, profit
  - Forecasts for next N months
  - Trend direction (up/down/stable)

---

## 5. API Endpoints Reference

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with code

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Menu
- `GET /api/menu` - List all menu items
- `POST /api/menu` - Create menu item
- `GET /api/menu/[id]` - Get menu item
- `PUT /api/menu/[id]` - Update menu item
- `DELETE /api/menu/[id]` - Delete menu item

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get order
- `PUT /api/orders/[id]` - Update order
- `DELETE /api/orders/[id]` - Delete order

### Bills
- `GET /api/bills` - List all bills
- `GET /api/bills/[id]` - Get bill
- `PUT /api/bills/[id]` - Update bill
- `POST /api/bills/[id]/send` - Send bill via email

### Expenses
- `GET /api/expenses` - List all expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/[id]` - Get expense
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

### Stock
- `GET /api/stock` - List all stock items
- `POST /api/stock` - Create stock item
- `GET /api/stock/[id]` - Get stock item
- `PUT /api/stock/[id]` - Update stock item
- `DELETE /api/stock/[id]` - Delete stock item
- `GET /api/stock/[id]/transactions` - Get stock transactions
- `POST /api/stock/[id]/transactions` - Create stock transaction

### Inventory
- `GET /api/inventory` - List all inventory items
- `POST /api/inventory` - Create inventory item
- `GET /api/inventory/[id]` - Get inventory item
- `PUT /api/inventory/[id]` - Update inventory item
- `DELETE /api/inventory/[id]` - Delete inventory item

### Supervisors
- `GET /api/supervisors` - List all supervisors
- `POST /api/supervisors` - Create supervisor
- `GET /api/supervisors/[id]` - Get supervisor
- `PUT /api/supervisors/[id]` - Update supervisor
- `DELETE /api/supervisors/[id]` - Delete supervisor

### Workforce
- `GET /api/workforce` - List all workforce
- `POST /api/workforce` - Create workforce member
- `GET /api/workforce/[id]` - Get workforce member
- `PUT /api/workforce/[id]` - Update workforce member
- `DELETE /api/workforce/[id]` - Delete workforce member

### Users
- `GET /api/users` - List all users (super_admin only)
- `POST /api/users` - Create user (super_admin only)
- `GET /api/users/[id]` - Get user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user
- `GET /api/users/audit-logs` - Get login audit logs

### Enquiry
- `GET /api/enquiry` - List all enquiries
- `POST /api/enquiry` - Create enquiry (public endpoint)

### System
- `GET /api/alerts` - Get system alerts
- `GET /api/analytics/predictive` - Get predictive analytics
- `GET /api/notifications/stream` - SSE notification stream

---

## 6. Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: React Icons
- **Notifications**: React Hot Toast
- **PDF Generation**: jsPDF, html2canvas
- **WhatsApp**: react-floating-whatsapp

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: bcryptjs (password hashing)
- **Email**: Nodemailer / Resend

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **CSS Processing**: PostCSS, Autoprefixer

### Deployment
- **Platform**: Vercel (recommended)
- **Database**: Neon, Supabase, or self-hosted PostgreSQL
- **Environment**: Production environment variables via Vercel Dashboard

---

## Additional Notes

### File Naming Conventions
- **Pages**: `page.tsx` (Next.js App Router)
- **API Routes**: `route.ts`
- **Components**: PascalCase (e.g., `Sidebar.tsx`)
- **Utilities**: camelCase (e.g., `utils.ts`)

### Code Organization
- **API Logic**: All in `/app/api/` routes
- **Business Logic**: Mixed between API routes and utility functions
- **UI Components**: Reusable components in `/components/`
- **Type Definitions**: Centralized in `/types/index.ts`

### Security Considerations
- Passwords hashed with bcrypt
- JWT tokens stored in localStorage (consider httpOnly cookies for production)
- Role-based access control (RBAC)
- CORS configured for enquiry endpoint
- Environment variables for sensitive data

### Performance Optimizations
- Prisma connection pooling
- Server-side rendering (SSR) where appropriate
- Client-side caching for frequently accessed data
- Lazy loading for large lists

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Application**: SKC Caterers Management System
