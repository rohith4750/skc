# SKC Caterers - Complete System Features & Pages Overview

This document provides a comprehensive list of every page and feature available in the SKC Caterers management system.

---

## 1. Core Order Management

### Dashboard (`/`)
* **Purpose**: High-level overview of business operations.
* **Key Features**:
    * **Quick Summary**: Real-time stats for Pending Orders, Active Bills, Total Customers, and Current Month Revenue.
    * **Active Monthly View**: Visual indicator of orders for the current month.
    * **Action Shortcuts**: Direct links to Create Order, Order Hub, and Bill Management.
    * **Role-Based Visibility**: Analytics and financial summaries are restricted based on user role.

### Order Hub (`/orders/center`)
* **Purpose**: The operational command center for managing active catering events.
* **Key Features**:
    * **Status Management**: View and update order statuses (Pending, In-Progress, Completed, Cancelled).
    * **Advanced Filtering**: 
        * Filter by Status, Month, Year, and specific Date.
        * Search by Customer Name, Phone, Email, or Event Name.
        * Filter by Meal Type (Breakfast, Lunch, Dinner, etc.).
    * **Multi-Order Operations**: Select multiple orders to **Merge** them into a single event.
    * **Order Separation**: Discard/Separate specific dates or meal sessions from a merged order.
    * **Exports**:
        * Generate **Menu PDF** in English or Telugu.
        * Generate **Menu Image (PNG)** for quick WhatsApp sharing.
    * **Customer Communication**: Send Order Details/Menu directly to customer email with PDF attachment.
    * **Quick Preview**: Instant view of order items without leaving the hub.

### Past Events (`/orders/history`)
* **Purpose**: Archive of all historical orders and completed events.
* **Key Features**:
    * **Full History**: Access every order ever placed.
    * **Financial Reconciliation**: Review total amounts and payment status for past events.
    * **Re-Order Capability**: View details of old events to replicate menu items for recurring customers.
    * **Compact Export**: Integrated capability to download historical data for archival.

### Create Order (`/orders/create`)
* **Purpose**: Comprehensive form for scheduling new catering events.
* **Key Features**:
    * **Customer Selection**: Choose from existing customers or add a new one on-the-fly.
    * **Multi-Date Planning**: Schedule items across multiple dates within a single order.
    * **Meal Session Management**: Define specific sessions (Breakfast, Lunch, Snacks, Dinner, etc.) with custom timings.
    * **Member Counts**: Specify the number of guests for each meal session to calculate quantities.
    * **Bilingual Menu Selection**: Select items from the catalog (English/Telugu) with optional customization notes for the chef.
    * **Stall Management**: Add specific food stalls (Live Counter, Juice Bar, etc.) with descriptions.
    * **Financial Calculation**:
        * Input plate rates or lumsum amounts.
        * Auto-calculate total, taxes (if applicable), and remaining balance.
        * Record advance payments with payment mode (Cash, UPI, Bank).

### Quotations (`/orders/quotations`)
* **Purpose**: Manage formal proposals before they become orders.
* **Key Features**:
    * **Quotation Lifecycle**: Create, Edit, and Print quotations for clients.
    * **Convert to Order**: One-click conversion of a quotation into an active order upon customer approval.
    * **Status Tracking**: Track which quotes are pending, expired, or converted.

### Calendar & Event Planner (`/orders/overview`)
* **Purpose**: Visual scheduling tool.
* **Key Features**:
    * **Calendar View**: See all upcoming events on a monthly calendar grid.
    * **Event Color Coding**: Different colors for different event statuses.
    * **Drag & Drop Planning**: (If supported) Visual planning of kitchen capacity.
    * **Quick Details**: Click any calendar entry to see customer and menu summary.

---

## 2. Customer Management

### Customers (`/customers`)
* **Purpose**: CRM for tracking all client interactions.
* **Key Features**:
    * **Customer Directory**: Full list with search and pagination.
    * **Unified Order History**: View every order associated with a specific customer.
    * **Outstanding Profile**: Instantly see if a customer has pending bills across multiple past events.
    * **Contact Info**: Store Email, Phone, and Address for automated communications.

---

## 3. Menu Management

### Menu Catalog (`/menu`)
* **Purpose**: Master database of all food items.
* **Key Features**:
    * **Bilingual Database**: Every item supports **English** and **Telugu** names and descriptions.
    * **Categorization**: Group items by type (Cuisine, Meal Type, Category).
    * **Price Management**: Standard pricing for items (can be overridden during order creation).
    * **Bulk Import/Export**: Tools for managing the catalog at scale.

---

## 4. Financial Management (Super Admin Exclusive)

### Bills (`/bills`)
* **Purpose**: Invoice generation and payment tracking.
* **Key Features**:
    * **Automatic Generation**: Bills are auto-generated when an order status moves to "In-Progress".
    * **Payment History**: Detailed log of every installment paid by the customer.
    * **Installment Tracking**: Partial payment support with automatic balance calculation.
    * **Professional Invoicing**:
        * Generate and download professional **Bill PDFs**.
        * Integrated Email delivery to customers.

### Expenses (`/expenses`)
* **Purpose**: Internal cost tracking and profitability analysis.
* **Key Features**:
    * **Regular Expenses**: Track costs linked to specific orders (Labour, Materials, Transport).
    * **Bulk Expenses**: Record large purchases (e.g., store groceries) and allocate costs across multiple orders.
    * **Allocation Methods**: Distribute bulk costs equally, by plate count, or by manual percentage.
    * **Category Tracking**: Break down costs by Supervisor, Chef, Labours, Transport, Gas, etc.

### Store Calculator (`/expenses/store-calculator`)
* **Purpose**: Utility for calculating complex grocery and store withdrawals.
* **Key Features**:
    * **Ingredient Pricing**: Manage pricing for common store items.
    * **Usage Calculation**: Calculate exact cost of materials used for an event based on quantities.

### Workforce & Outstanding (`/workforce`, `/workforce/outstanding`)
* **Purpose**: Payroll and contractor payment management.
* **Key Features**:
    * **Member Management**: Directory of Chefs, Supervisors, and Helpers.
    * **Outstanding Ledger**: Real-time view of money owed to workers based on recorded expenses.
    * **Payment Recording**: Mark payments to workforce members and keep a history.

### Analytics (`/analytics`)
* **Purpose**: Data-driven business insights.
* **Key Features**:
    * **Revenue Trends**: Monthly and yearly growth charts.
    * **Expense Analysis**: Category-wise breakdown of where money is spent.
    * **Predictive Forecasting**: AI-driven projections for future revenue and orders based on historical patterns.
    * **Customer Lifetime Value**: Identifying top-spending customers.
    * **P&L Analytics**: "Profit per Plate" analysis for every event.

---

## 5. Stock & Inventory

### Stock (`/stock`)
* **Purpose**: Consumable items tracking (Gas, Vegetables, Disposables).
* **Key Features**:
    * **Quantity Tracking**: Current stock levels with Unit management.
    * **Low-Stock Alerts**: Automated warnings when levels drop below a threshold.
    * **Transaction History**: Log of every "In" (Purchase) and "Out" (Usage).

### Inventory (`/inventory`)
* **Purpose**: Asset management (Vessels, Utensils, Furniture).
* **Key Features**:
    * **Asset Directory**: Track quantity and condition of non-consumable items.
    * **Location Tracking**: Know where assets are (Main Office, Godown, Event Site).

---

## 6. Tax Management

### Income Tax Return (`/tax`)
* **Purpose**: Preparation tool for ITR.
* **Key Features**:
    * **Financial Year Filtering**: View data for specific FY periods (April-March).
    * **Tax Regime Support**: Calculate tax liability under both **Old** and **New** regimes.
    * **Presumptive Taxation (44AD)**: Specialized support for business turnover-based tax calculation (8% or 6% rates).
    * **Deduction Management**: Sections 80C, 80D, 24, etc.
    * **Professional Report**: Generate a comprehensive tax liability summary as a PDF.

---

## 7. System Administration

### User Management (`/users`)
* **Purpose**: Security and access control.
* **Key Features**:
    * **Role-Based Access Control (RBAC)**: Support for `admin` and `super_admin` roles.
    * **Audit Logs**: Track every login attempt, including IP address, device info, and location.

### Enquiries (`/enquiries`)
* **Purpose**: Website lead management.
* **Key Features**:
    * **Lead Capture**: Display enquiries received from the public website or contact forms.
    * **Follow-up Tracking**: Mark leads as contacted or converted.

---

## 8. Cross-Cutting Technical Features

1. **Bilingual Support**: Most customer-facing documents (Menu, Details) support both English and Telugu.
2. **Integrated Notifications**: In-app alerts for low stock, unpaid bills, and upcoming events.
3. **Advanced PDF Engine**: High-fidelity PDF generation for Bills, Menus, and Reports.
4. **Mobile Responsive**: The entire system is designed to work seamlessly on Tablets and Mobile devices for on-site management.
5. **Secure Authentication**: Encrypted password storage and session management with audit trails.
