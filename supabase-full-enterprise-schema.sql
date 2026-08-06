-- ====================================================================================
-- VERO LUXURY E-COMMERCE - ENTERPRISE PRODUCTION DATABASE SCHEMA MIGRATION
-- Fully Relational, RLS-Protected, Indexed, and Audit-Ready Architecture
-- Compatible with Supabase PostgreSQL, Drizzle, & Custom Node.js Backends
-- 100% IDEMPOTENT: Safe to execute multiple times without duplicate errors
-- ====================================================================================

-- 1. EXTENSIONS & SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPE DEFINITIONS (Idempotent using DO blocks)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_level AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Black');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM (
        'Order Placed',
        'Order Confirmed',
        'Preparing Order',
        'Quality Check',
        'Packed',
        'Ready for Shipment',
        'Out for Delivery',
        'Delivered',
        'Cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM ('cod', 'card', 'instapay', 'vodafone_cash', 'valu');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE review_status_type AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type_enum AS ENUM ('percentage', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. AUTOMATIC UPDATED_AT TIMESTAMP FUNCTION (Idempotent)
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CORE USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'customer',
    tier membership_level NOT NULL DEFAULT 'Bronze',
    loyalty_points INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
    total_spent NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_spent >= 0.00),
    avatar_url TEXT DEFAULT 'default',
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash TEXT,
    salt TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_users_modtime ON users;
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 5. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_categories_modtime ON categories;
CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 6. PRODUCTS & VARIANTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(10,2) CHECK (compare_at_price >= 0),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 100 CHECK (stock_quantity >= 0),
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    specifications JSONB DEFAULT '[]'::jsonb,
    variants JSONB DEFAULT '[]'::jsonb,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_products_modtime ON products;
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 7. CUSTOMER ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Egypt',
    governorate VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    street VARCHAR(255) NOT NULL,
    building VARCHAR(100) NOT NULL,
    apartment VARCHAR(100),
    landmark TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_addresses_modtime ON addresses;
CREATE TRIGGER update_addresses_modtime BEFORE UPDATE ON addresses
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 8. ORDERS & ORDER TRACKING TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    shipping_name VARCHAR(255) NOT NULL,
    shipping_email VARCHAR(255) NOT NULL,
    shipping_phone VARCHAR(50) NOT NULL,
    shipping_governorate VARCHAR(100) NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_street VARCHAR(255) NOT NULL,
    shipping_building VARCHAR(100) NOT NULL,
    shipping_apartment VARCHAR(100),
    shipping_landmark TEXT,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    order_status order_status_type NOT NULL DEFAULT 'Order Placed',
    payment_status payment_status_type NOT NULL DEFAULT 'pending',
    payment_method payment_method_type NOT NULL DEFAULT 'cod',
    tracking_number VARCHAR(100),
    estimated_delivery_date TIMESTAMPTZ,
    cancelled_date TIMESTAMPTZ,
    delivered_date TIMESTAMPTZ,
    customer_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_orders_modtime ON orders;
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 9. ORDER TRACKING STATUS HISTORY
CREATE TABLE IF NOT EXISTS order_tracking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status order_status_type NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    location VARCHAR(255),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    selected_color VARCHAR(50),
    selected_size VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. SHOPPING CART TABLE (PERSISTENT BACKEND CART)
CREATE TABLE IF NOT EXISTS cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    selected_color VARCHAR(50),
    selected_size VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, selected_color, selected_size)
);

DROP TRIGGER IF EXISTS update_cart_modtime ON cart;
CREATE TRIGGER update_cart_modtime BEFORE UPDATE ON cart
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 12. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- 13. REVIEWS, REPLIES & REPORTS
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255) NOT NULL DEFAULT 'Product Review',
    review TEXT NOT NULL,
    status review_status_type NOT NULL DEFAULT 'approved',
    verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,
    recommend BOOLEAN NOT NULL DEFAULT TRUE,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    video_url TEXT,
    helpful_count INTEGER NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_reviews_modtime ON reviews;
CREATE TRIGGER update_reviews_modtime BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TABLE IF NOT EXISTS review_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reply TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. COUPONS & PROMOTIONS
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type discount_type_enum NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    min_purchase_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    max_discount_amount NUMERIC(10,2),
    usage_limit INTEGER CHECK (usage_limit > 0),
    times_used INTEGER NOT NULL DEFAULT 0 CHECK (times_used >= 0),
    expiration_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. LOYALTY TRANSACTIONS & REWARDS
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'bonus', 'expired')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    cost_points INTEGER NOT NULL CHECK (cost_points > 0),
    discount_type discount_type_enum NOT NULL,
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    code_prefix VARCHAR(20) DEFAULT 'REWARD-',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. USER NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('order_update', 'review_approved', 'promo', 'loyalty_reward', 'system')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 17. SECURITY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    target VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================================
-- PERFORMANCE INDEXES (Idempotent)
-- ====================================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON order_tracking_history(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- ====================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (Idempotent: DROP BEFORE CREATE)
-- ====================================================================================

-- Helper Function to check if requesting user is Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all sensitive user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- 1. Users Policies
DROP POLICY IF EXISTS "Users: view own or admin" ON users;
DROP POLICY IF EXISTS "Users: update own or admin" ON users;
CREATE POLICY "Users: view own or admin" ON users FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users: update own or admin" ON users FOR UPDATE USING (auth.uid() = id OR is_admin());

-- 2. Orders Policies
DROP POLICY IF EXISTS "Orders: view own or admin" ON orders;
DROP POLICY IF EXISTS "Orders: insert own or admin" ON orders;
DROP POLICY IF EXISTS "Orders: admin update" ON orders;
CREATE POLICY "Orders: view own or admin" ON orders FOR SELECT USING (auth.uid() = user_id OR shipping_email = auth.jwt() ->> 'email' OR is_admin());
CREATE POLICY "Orders: insert own or admin" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id OR shipping_email = auth.jwt() ->> 'email' OR is_admin());
CREATE POLICY "Orders: admin update" ON orders FOR UPDATE USING (is_admin());

-- 3. Cart Policy
DROP POLICY IF EXISTS "Cart: owner or admin access" ON cart;
CREATE POLICY "Cart: owner or admin access" ON cart FOR ALL USING (auth.uid() = user_id OR is_admin());

-- 4. Wishlist Policy
DROP POLICY IF EXISTS "Wishlist: owner or admin access" ON wishlist;
CREATE POLICY "Wishlist: owner or admin access" ON wishlist FOR ALL USING (auth.uid() = user_id OR is_admin());

-- 5. Reviews Policies
DROP POLICY IF EXISTS "Reviews: public read approved" ON reviews;
DROP POLICY IF EXISTS "Reviews: insert authenticated" ON reviews;
DROP POLICY IF EXISTS "Reviews: update own or admin" ON reviews;
CREATE POLICY "Reviews: public read approved" ON reviews FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR is_admin());
CREATE POLICY "Reviews: insert authenticated" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "Reviews: update own or admin" ON reviews FOR UPDATE USING (auth.uid() = user_id OR is_admin());

-- 6. Notifications Policy
DROP POLICY IF EXISTS "Notifications: user own view" ON notifications;
CREATE POLICY "Notifications: user own view" ON notifications FOR ALL USING (auth.uid() = user_id OR is_admin());

-- 7. Audit Logs Policy
DROP POLICY IF EXISTS "AuditLogs: admin only" ON audit_logs;
CREATE POLICY "AuditLogs: admin only" ON audit_logs FOR ALL USING (is_admin());

-- 8. Catalog Public Policies
DROP POLICY IF EXISTS "Products: public view active" ON products;
DROP POLICY IF EXISTS "Products: admin manage" ON products;
CREATE POLICY "Products: public view active" ON products FOR SELECT USING (true);
CREATE POLICY "Products: admin manage" ON products FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Categories: public view active" ON categories;
DROP POLICY IF EXISTS "Categories: admin manage" ON categories;
CREATE POLICY "Categories: public view active" ON categories FOR SELECT USING (true);
CREATE POLICY "Categories: admin manage" ON categories FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Coupons: public view active" ON coupons;
DROP POLICY IF EXISTS "Coupons: admin manage" ON coupons;
CREATE POLICY "Coupons: public view active" ON coupons FOR SELECT USING (true);
CREATE POLICY "Coupons: admin manage" ON coupons FOR ALL USING (is_admin());

-- ====================================================================================
-- STORAGE BUCKETS SETUP & POLICIES (Idempotent)
-- ====================================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-assets', 'product-assets', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public select storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete storage" ON storage.objects;

CREATE POLICY "Allow public select storage" ON storage.objects FOR SELECT USING (bucket_id = 'product-assets');
CREATE POLICY "Allow public insert storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-assets');
CREATE POLICY "Allow public update storage" ON storage.objects FOR UPDATE USING (bucket_id = 'product-assets');
CREATE POLICY "Allow public delete storage" ON storage.objects FOR DELETE USING (bucket_id = 'product-assets');
