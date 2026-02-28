# Catering Management System

A comprehensive Next.js application for managing catering services, customers, orders, bills, and supervisors.

## Features

### Customer Management
- Create and manage customer profiles (name, phone, email, address)
- Store custom greeting messages for each customer
- Send messages via Email, WhatsApp, or SMS
- Full CRUD operations

### Menu Management
- Master table for menu items
- Menu items organized by type (Breakfast, Lunch, Dinner, Snacks)
- Active/Inactive status management

### Order Management
- Create orders with multiple menu items (checkbox selection)
- Filter orders by supervisor
- Calculate total amount, advance payments, and remaining amounts
- Link orders to customers and supervisors

### Bills Management
- Automatic bill generation when orders are created
- Table view for all bills
- Track advance payments, paid amounts, and remaining balances
- Mark bills as paid
- Print bills
- Status tracking (pending, partial, paid)

### Supervisor Management
- Manage supervisors with assigned catering services
- Each supervisor can access and manage their assigned orders
- Filter orders by supervisor

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Custom styling (no UI libraries)
- **React Icons** - Icon library
- **PostgreSQL** - Database
- **Prisma** - ORM for database management
- **jsPDF** - PDF generation

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your PostgreSQL database and update the `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/catering_db?schema=public"
```

3. Generate Prisma Client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. (Optional) Seed the database with menu items:
```bash
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE catering_db;
```

2. Update the `DATABASE_URL` in your `.env` file with your database credentials

3. Run migrations:
```bash
npx prisma migrate dev
```

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── api/             # API routes (backend)
│   │   ├── customers/   # Customer API endpoints
│   │   ├── menu/        # Menu API endpoints
│   │   ├── orders/      # Order API endpoints
│   │   ├── bills/       # Bill API endpoints
│   │   └── supervisors/ # Supervisor API endpoints
│   ├── customers/       # Customer management pages
│   ├── menu/            # Menu management pages
│   ├── orders/          # Order management pages
│   ├── bills/           # Bill management pages
│   ├── supervisors/     # Supervisor management pages
│   └── layout.tsx       # Root layout with sidebar
├── components/          # Reusable components
│   └── layout/          # Layout components (Sidebar)
├── lib/                 # Utility functions
│   ├── storage-api.ts   # API-based storage (uses API routes)
│   └── utils.ts         # Helper functions
├── prisma/              # Prisma schema and migrations
│   └── schema.prisma    # Database schema
└── types/               # TypeScript type definitions
    └── index.ts         # All type definitions
```

## Central Routing And Side Menu Config

Route and side menu metadata is centralized in:

- `constants/menu.ts`

This file is the source of truth for:

- `menuData`: Sidebar-visible routes.
- `loginRoutes`: Public routes outside authenticated layout.
- `adminRoutes`: Authenticated routes (including hidden routes not shown in sidebar).

Each route config object includes:

- `name`: Display title.
- `route`: URL path.
- `file`: Component file path.
- `icon`: Icon key used by sidebar rendering.
- `permissions`: Access rule key.
- `showInSideMenu`: Controls sidebar visibility.

Implementation references:

- `components/layout/Sidebar.tsx` renders menu items from `menuData`.
- `components/layout/Header.tsx` resolves page titles from route config.
- `lib/constants.ts` derives public auth paths from `loginRoutes`.

## Database Schema

The application uses the following main models:
- **Customer** - Customer information
- **MenuItem** - Menu items catalog
- **Supervisor** - Supervisor information
- **Order** - Customer orders
- **OrderItem** - Items in an order
- **Bill** - Bills linked to orders

## API Routes

All API routes are available under `/api/`:
- `GET/POST /api/customers` - Get all/create customer
- `PUT/DELETE /api/customers/[id]` - Update/delete customer
- `GET/POST /api/menu` - Get all/create menu item
- `PUT/DELETE /api/menu/[id]` - Update/delete menu item
- `GET/POST /api/orders` - Get all/create order
- `DELETE /api/orders/[id]` - Delete order
- `GET/PUT /api/bills` - Get all/update bill
- `GET/POST /api/supervisors` - Get all/create supervisor
- `PUT/DELETE /api/supervisors/[id]` - Update/delete supervisor

## Switching from localStorage to Database

The application can work with either localStorage or PostgreSQL:

- **For development/testing**: Use `lib/storage.ts` (localStorage)
- **For production**: Use `lib/storage-api.ts` (PostgreSQL via API routes)

To switch to database:
1. Set up PostgreSQL and run migrations
2. Replace imports of `lib/storage` with `lib/storage-api` in your components
3. Update all Storage method calls to use `await` (they're now async)

## Future Enhancements

- User authentication and authorization
- Email service integration (SendGrid, AWS SES)
- SMS service integration (Twilio, AWS SNS)
- WhatsApp Business API integration
- Payment gateway integration
- Reports and analytics
- Print templates for bills
- Multi-language support
- Real-time notifications

## License

MIT
