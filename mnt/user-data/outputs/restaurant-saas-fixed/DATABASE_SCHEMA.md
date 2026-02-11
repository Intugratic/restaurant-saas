# Restaurant SaaS - Database Schema (ERD)

## Tables & Relationships

```
┌─────────────────┐
│   TENANTS       │
├─────────────────┤
│ id (PK)         │
│ name            │
│ subdomain       │
│ custom_domain   │
│ logo_url        │
│ plan_type       │
│ is_active       │
│ created_at      │
└─────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────┐       ┌─────────────────┐
│   OUTLETS       │       │   USERS         │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ tenant_id (FK)  │◄──────│ tenant_id (FK)  │
│ name            │       │ outlet_id (FK)  │
│ address         │       │ email           │
│ phone           │       │ phone           │
│ is_active       │       │ role            │
│ created_at      │       │ password_hash   │
└─────────────────┘       │ loyalty_points  │
        │                 │ created_at      │
        │ 1:N             └─────────────────┘
        ▼
┌─────────────────┐
│   TABLES        │
├─────────────────┤
│ id (PK)         │
│ outlet_id (FK)  │
│ table_number    │
│ qr_code_url     │
│ qr_code_id      │
│ capacity        │
│ status          │
│ created_at      │
└─────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────┐       ┌─────────────────┐
│   ORDERS        │       │   MENU_ITEMS    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ tenant_id (FK)  │       │ tenant_id (FK)  │
│ outlet_id (FK)  │       │ outlet_id (FK)  │
│ table_id (FK)   │       │ name            │
│ customer_id(FK) │       │ name_hi         │
│ waiter_id (FK)  │       │ description     │
│ order_number    │       │ category        │
│ status          │       │ price           │
│ total_amount    │       │ image_url       │
│ created_at      │       │ is_available    │
│ confirmed_at    │       │ veg_nonveg      │
│ completed_at    │       │ spice_level     │
└─────────────────┘       │ prep_time_mins  │
        │                 │ created_at      │
        │ 1:N             └─────────────────┘
        ▼                         │
┌─────────────────┐               │
│  ORDER_ITEMS    │               │
├─────────────────┤               │
│ id (PK)         │               │
│ order_id (FK)   │               │
│ menu_item_id(FK)│───────────────┘
│ quantity        │
│ unit_price      │
│ special_notes   │
│ status          │
└─────────────────┘
        │
        │ 1:1
        ▼
┌─────────────────┐
│   KOT           │
├─────────────────┤
│ id (PK)         │
│ order_id (FK)   │
│ kot_number      │
│ items_json      │
│ status          │
│ printed_at      │
│ ready_at        │
│ created_at      │
└─────────────────┘

┌─────────────────┐
│  INVENTORY      │
├─────────────────┤
│ id (PK)         │
│ tenant_id (FK)  │
│ outlet_id (FK)  │
│ menu_item_id(FK)│
│ stock_quantity  │
│ unit            │
│ reorder_level   │
│ last_updated    │
└─────────────────┘

┌─────────────────┐
│   PAYMENTS      │
├─────────────────┤
│ id (PK)         │
│ order_id (FK)   │
│ amount          │
│ payment_method  │
│ payment_gateway │
│ transaction_id  │
│ status          │
│ razorpay_id     │
│ created_at      │
│ completed_at    │
└─────────────────┘

┌─────────────────┐
│ NOTIFICATIONS   │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ order_id (FK)   │
│ type            │
│ message         │
│ is_read         │
│ fcm_token       │
│ created_at      │
└─────────────────┘
```

## Field Details & Constraints

### TENANTS (Multi-tenant SaaS)
- `id`: UUID primary key
- `subdomain`: Unique (e.g., "pizzahut" → pizzahut.yourplatform.com)
- `custom_domain`: Optional (e.g., "order.pizzahut.com")
- `plan_type`: ENUM('free', 'basic', 'premium', 'enterprise')

### USERS (Admin, Waiter, Kitchen, Customer)
- `role`: ENUM('super_admin', 'outlet_admin', 'waiter', 'kitchen', 'customer')
- `loyalty_points`: Integer, default 0

### TABLES
- `status`: ENUM('available', 'occupied', 'reserved')
- `qr_code_id`: Unique identifier for QR generation

### ORDERS
- `status`: ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')
- Indexed on: tenant_id, outlet_id, table_id, created_at

### ORDER_ITEMS
- `status`: ENUM('pending', 'preparing', 'ready', 'served')

### KOT (Kitchen Order Ticket)
- `status`: ENUM('new', 'in_progress', 'ready', 'served')
- Auto-generated from confirmed orders

### INVENTORY
- Auto-deducts based on KOT items
- Alert when stock_quantity <= reorder_level

### PAYMENTS
- `status`: ENUM('pending', 'completed', 'failed', 'refunded')
- `payment_method`: ENUM('cash', 'card', 'upi', 'razorpay')

## Indexes
```sql
CREATE INDEX idx_orders_tenant ON orders(tenant_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_tables_outlet ON tables(outlet_id);
CREATE INDEX idx_menu_tenant ON menu_items(tenant_id, outlet_id);
CREATE INDEX idx_inventory_stock ON inventory(stock_quantity);
```

## Relationships Summary
- Tenant → Outlets (1:N)
- Tenant → Users (1:N)
- Outlet → Tables (1:N)
- Outlet → Menu Items (1:N)
- Table → Orders (1:N)
- Order → Order Items (1:N)
- Order → KOT (1:1)
- Order → Payment (1:1)
- User → Orders (as customer, 1:N)
- User → Orders (as waiter, 1:N)
- Menu Item → Inventory (1:1)
