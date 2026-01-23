# Database Schema and Relations

This document explains the database schema and how tables relate to each other.
It is based on `prisma/schema.prisma`.

## Overview

Core business flow:

Customer → Order → OrderItem → MenuItem  
Order → Bill  
Order → Expense  
Supervisor → Order

Operational support:

User → LoginAuditLog  
Stock → StockTransaction  
Inventory (standalone)  
Workforce (standalone)  
Enquiry (standalone)

## Tables and Relationships

### Customer
- Stores customer profile details.
- Relationship:
  - One customer has many orders.

### Supervisor
- Stores supervisor profile details for catering services.
- Relationship:
  - One supervisor can manage many orders.
  - An order may or may not have a supervisor assigned.

### MenuItem
- Master list of menu items.
- Relationship:
  - One menu item can appear in many order items.

### Order
- Central table for each event/order.
- Relationships:
  - Belongs to exactly one customer.
  - May belong to one supervisor.
  - Has many order items.
  - Has one bill (optional at the DB level but expected in app flow).
  - Has many expenses.

### OrderItem
- Join table between Order and MenuItem.
- Relationships:
  - Belongs to one order.
  - Belongs to one menu item.
- Purpose:
  - Represents each menu item included in an order with quantity.

### Bill
- Financial record linked to an order.
- Relationships:
  - One-to-one with order (unique `orderId`).

### Expense
- Tracks expenses for an order (or optionally unassigned).
- Relationships:
  - Belongs to one order (nullable).
- Notes:
  - Can be marked as bulk expense and allocated across orders using JSON fields.

### User
- Application user accounts for admin and super admin roles.
- Relationships:
  - One user has many login audit logs.

### LoginAuditLog
- Stores each login attempt for auditing.
- Relationships:
  - Belongs to one user.

### Stock
- Inventory stock items (gas, store, vegetables, disposables).
- Relationships:
  - One stock item has many stock transactions.

### StockTransaction
- Tracks stock movement in/out.
- Relationships:
  - Belongs to one stock item.

### Inventory
- Non-consumable assets like vessels and serving items.
- Relationships:
  - Standalone table (no foreign keys).

### Workforce
- Stores internal workforce members (chef, supervisor, transport).
- Relationships:
  - Standalone table (no foreign keys).

### Enquiry
- Stores enquiries from external sources.
- Relationships:
  - Standalone table (no foreign keys).

## Cardinality Summary

- Customer 1 → * Order
- Supervisor 1 → * Order (nullable)
- Order 1 → * OrderItem
- MenuItem 1 → * OrderItem
- Order 1 → 1 Bill
- Order 1 → * Expense (nullable order on Expense)
- User 1 → * LoginAuditLog
- Stock 1 → * StockTransaction

## Deletion Behavior

- Deleting an Order cascades to OrderItem.
- Deleting a User cascades to LoginAuditLog.
- Deleting a Stock item cascades to StockTransaction.
- Deleting an Order does NOT delete Expenses; expenses are set to null.

## Notes on JSON Fields

Some columns use JSON for flexible structures:
- `Order.mealTypeAmounts`, `Order.stalls`, `Order.services`
- `Bill.paymentHistory`
- `Expense.calculationDetails`, `Expense.bulkAllocations`

These are used for dynamic, UI-driven data and are not normalized into separate tables.
