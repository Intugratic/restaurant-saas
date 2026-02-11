-- Restaurant SaaS - Complete Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET row_security = on;

-- ========================================
-- TENANTS (Multi-tenant SaaS)
-- ========================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  custom_domain VARCHAR(255),
  logo_url TEXT,
  plan_type VARCHAR(50) DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'premium', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- OUTLETS
-- ========================================
CREATE TABLE outlets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- USERS (Admin, Waiter, Kitchen, Customer)
-- ========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE SET NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'outlet_admin', 'waiter', 'kitchen', 'customer')),
  password_hash TEXT,
  loyalty_points INTEGER DEFAULT 0,
  fcm_token TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- TABLES (Restaurant Tables)
-- ========================================
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  table_number VARCHAR(50) NOT NULL,
  qr_code_url TEXT,
  qr_code_id VARCHAR(100) UNIQUE,
  capacity INTEGER DEFAULT 4,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- MENU ITEMS
-- ========================================
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_hi VARCHAR(255),
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  veg_nonveg VARCHAR(20) CHECK (veg_nonveg IN ('veg', 'non-veg', 'egg')),
  spice_level VARCHAR(20) CHECK (spice_level IN ('mild', 'medium', 'spicy')),
  prep_time_mins INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- ORDERS
-- ========================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  waiter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_number VARCHAR(50) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
  total_amount DECIMAL(10, 2) DEFAULT 0,
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- ========================================
-- ORDER ITEMS
-- ========================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  special_notes TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served'))
);

-- ========================================
-- KOT (Kitchen Order Tickets)
-- ========================================
CREATE TABLE kot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  kot_number VARCHAR(50) UNIQUE,
  items_json JSONB,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'ready', 'served')),
  printed_at TIMESTAMP,
  ready_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- INVENTORY
-- ========================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  stock_quantity DECIMAL(10, 2) DEFAULT 0,
  unit VARCHAR(50),
  reorder_level DECIMAL(10, 2) DEFAULT 10,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- PAYMENTS
-- ========================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'upi', 'razorpay')),
  payment_gateway VARCHAR(50),
  transaction_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  razorpay_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- ========================================
-- NOTIFICATIONS
-- ========================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  type VARCHAR(50),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_orders_tenant ON orders(tenant_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_tables_outlet ON tables(outlet_id);
CREATE INDEX idx_menu_tenant ON menu_items(tenant_id, outlet_id);
CREATE INDEX idx_inventory_stock ON inventory(stock_quantity);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kot ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy: Users can only access data from their tenant
CREATE POLICY tenant_isolation_policy ON orders
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Similar policies should be created for other tables

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE order_seq;

CREATE TRIGGER set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

-- Auto-generate KOT number
CREATE OR REPLACE FUNCTION generate_kot_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.kot_number := 'KOT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('kot_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE kot_seq;

CREATE TRIGGER set_kot_number
BEFORE INSERT ON kot
FOR EACH ROW
EXECUTE FUNCTION generate_kot_number();

-- Auto-update inventory when KOT is created
CREATE OR REPLACE FUNCTION update_inventory_on_kot()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  menu_id UUID;
  qty INTEGER;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items_json)
  LOOP
    menu_id := (item->>'menu_item_id')::UUID;
    qty := (item->>'quantity')::INTEGER;
    
    UPDATE inventory
    SET stock_quantity = stock_quantity - qty,
        last_updated = NOW()
    WHERE menu_item_id = menu_id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_trigger
AFTER INSERT ON kot
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_kot();

-- ========================================
-- REALTIME PUBLICATION (for Supabase Realtime)
-- ========================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE kot;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
