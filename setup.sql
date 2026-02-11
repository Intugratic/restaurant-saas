-- Restaurant SaaS Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants (Multi-restaurant support)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    logo_url TEXT,
    stripe_account_id TEXT,
    razorpay_key_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'waiter', 'kitchen', 'customer')),
    phone TEXT,
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tables
CREATE TABLE restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    qr_code_url TEXT,
    qr_token TEXT UNIQUE, -- for secure QR validation
    status TEXT CHECK (status IN ('available', 'occupied')) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, table_number)
);

-- Inventory
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    unit TEXT, -- kg, pieces, liters
    min_threshold INTEGER DEFAULT 10,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Items
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT, -- starters, mains, desserts, beverages
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    inventory_item_id UUID REFERENCES inventory(id),
    inventory_deduction INTEGER DEFAULT 1, -- how much to deduct per order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES restaurant_tables(id),
    customer_phone TEXT,
    customer_name TEXT,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'paid')) DEFAULT 'pending',
    total_amount DECIMAL(10,2) DEFAULT 0,
    loyalty_points_earned INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('stripe', 'razorpay', 'cash')),
    transaction_id TEXT,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_menu_items_tenant ON menu_items(tenant_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- Row Level Security (RLS)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Menu Items: Public can read, admins can write
CREATE POLICY "Anyone can view menu items"
    ON menu_items FOR SELECT
    USING (available = true);

CREATE POLICY "Admins can manage menu items"
    ON menu_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.tenant_id = menu_items.tenant_id
            AND user_profiles.role = 'admin'
        )
    );

-- Orders: Customers can create, staff can update
CREATE POLICY "Anyone can create orders"
    ON orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Staff can view tenant orders"
    ON orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.tenant_id = orders.tenant_id
            AND user_profiles.role IN ('admin', 'waiter', 'kitchen')
        )
    );

CREATE POLICY "Staff can update orders"
    ON orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.tenant_id = orders.tenant_id
            AND user_profiles.role IN ('admin', 'waiter', 'kitchen')
        )
    );

-- Inventory: Only admins
CREATE POLICY "Admins can manage inventory"
    ON inventory FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.tenant_id = inventory.tenant_id
            AND user_profiles.role = 'admin'
        )
    );

-- Function: Auto-deduct inventory on KOT
CREATE OR REPLACE FUNCTION deduct_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
        UPDATE inventory
        SET quantity = quantity - (
            SELECT COALESCE(SUM(oi.quantity * mi.inventory_deduction), 0)
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id = NEW.id
            AND mi.inventory_item_id = inventory.id
        )
        WHERE id IN (
            SELECT mi.inventory_item_id
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id = NEW.id
            AND mi.inventory_item_id IS NOT NULL
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deduct_inventory
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION deduct_inventory_on_order();

-- Function: Calculate loyalty points (1 point per ₹100)
CREATE OR REPLACE FUNCTION calculate_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        NEW.loyalty_points_earned = FLOOR(NEW.total_amount / 100);
        
        -- Add to customer profile if exists
        IF NEW.customer_phone IS NOT NULL THEN
            UPDATE user_profiles
            SET loyalty_points = loyalty_points + NEW.loyalty_points_earned
            WHERE phone = NEW.customer_phone
            AND tenant_id = NEW.tenant_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_loyalty_points
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION calculate_loyalty_points();

-- Seed Demo Data (Optional - for testing)
INSERT INTO tenants (name, domain) VALUES ('Demo Restaurant', 'demo.restaurant-saas.com');

-- Get the tenant ID
DO $$
DECLARE
    demo_tenant_id UUID;
BEGIN
    SELECT id INTO demo_tenant_id FROM tenants WHERE domain = 'demo.restaurant-saas.com';
    
    -- Create demo tables
    INSERT INTO restaurant_tables (tenant_id, table_number, qr_token) VALUES
    (demo_tenant_id, 'T1', encode(gen_random_bytes(16), 'hex')),
    (demo_tenant_id, 'T2', encode(gen_random_bytes(16), 'hex')),
    (demo_tenant_id, 'T3', encode(gen_random_bytes(16), 'hex'));
    
    -- Create demo inventory
    INSERT INTO inventory (tenant_id, item_name, quantity, unit, min_threshold) VALUES
    (demo_tenant_id, 'Chicken', 50, 'kg', 10),
    (demo_tenant_id, 'Rice', 100, 'kg', 20),
    (demo_tenant_id, 'Paneer', 30, 'kg', 5);
    
    -- Create demo menu
    INSERT INTO menu_items (tenant_id, name, description, price, category, available) VALUES
    (demo_tenant_id, 'Butter Chicken', 'Classic creamy tomato-based curry', 350.00, 'Mains', true),
    (demo_tenant_id, 'Paneer Tikka', 'Grilled cottage cheese with spices', 250.00, 'Starters', true),
    (demo_tenant_id, 'Biryani', 'Fragrant rice with chicken/veg', 300.00, 'Mains', true),
    (demo_tenant_id, 'Gulab Jamun', 'Sweet milk dumplings in syrup', 80.00, 'Desserts', true),
    (demo_tenant_id, 'Mango Lassi', 'Creamy yogurt drink', 100.00, 'Beverages', true);
END $$;

-- Analytics View (for admin dashboard)
CREATE OR REPLACE VIEW daily_sales AS
SELECT 
    tenant_id,
    DATE(created_at) as sale_date,
    COUNT(*) as total_orders,
    SUM(total_amount) as revenue,
    AVG(total_amount) as avg_order_value
FROM orders
WHERE status = 'paid'
GROUP BY tenant_id, DATE(created_at)
ORDER BY sale_date DESC;

COMMENT ON TABLE tenants IS 'Multi-tenant support for white-label SaaS';
COMMENT ON COLUMN restaurant_tables.qr_token IS 'Secure token to prevent QR spoofing';
COMMENT ON FUNCTION deduct_inventory_on_order IS 'Auto-deducts inventory when order confirmed';
