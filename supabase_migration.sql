-- =============================================================================
-- PRODUCTION-READY SUPABASE POSTGRESQL MIGRATION SCRIPT
-- Application: VERO E-Commerce Platform
-- Database: PostgreSQL 15 (Supabase Compatible)
-- Idempotent & Safe for Re-execution (Preserves all existing data)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. USERS / PROFILES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  avatar TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer',
  tier TEXT DEFAULT 'Bronze',
  loyalty_points INTEGER DEFAULT 0,
  total_spent NUMERIC(12, 2) DEFAULT 0.00,
  addresses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='loyalty_points') THEN
    ALTER TABLE public.users ADD COLUMN loyalty_points INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='total_spent') THEN
    ALTER TABLE public.users ADD COLUMN total_spent NUMERIC(12, 2) DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='tier') THEN
    ALTER TABLE public.users ADD COLUMN tier TEXT DEFAULT 'Bronze';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='role') THEN
    ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'customer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='avatar') THEN
    ALTER TABLE public.users ADD COLUMN avatar TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='phone') THEN
    ALTER TABLE public.users ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='addresses') THEN
    ALTER TABLE public.users ADD COLUMN addresses JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.users;

-- -----------------------------------------------------------------------------
-- 2. CATEGORIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  slug TEXT UNIQUE,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='categories' AND column_name='name_ar') THEN
    ALTER TABLE public.categories ADD COLUMN name_ar TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='categories' AND column_name='name_en') THEN
    ALTER TABLE public.categories ADD COLUMN name_en TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='categories' AND column_name='slug') THEN
    ALTER TABLE public.categories ADD COLUMN slug TEXT;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. PRODUCTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  description TEXT,
  description_ar TEXT,
  description_en TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  original_price NUMERIC(12, 2),
  sale_price NUMERIC(12, 2),
  sku TEXT,
  stock INTEGER DEFAULT 10,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT FALSE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  coming_soon BOOLEAN DEFAULT FALSE,
  pre_order BOOLEAN DEFAULT FALSE,
  points_earned INTEGER DEFAULT 0,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  sizes TEXT[] DEFAULT ARRAY[]::TEXT[],
  materials TEXT[] DEFAULT ARRAY[]::TEXT[],
  colors TEXT[] DEFAULT ARRAY[]::TEXT[],
  variants JSONB DEFAULT '[]'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='name_ar') THEN
    ALTER TABLE public.products ADD COLUMN name_ar TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='name_en') THEN
    ALTER TABLE public.products ADD COLUMN name_en TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='description_ar') THEN
    ALTER TABLE public.products ADD COLUMN description_ar TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='description_en') THEN
    ALTER TABLE public.products ADD COLUMN description_en TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='sku') THEN
    ALTER TABLE public.products ADD COLUMN sku TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='stock') THEN
    ALTER TABLE public.products ADD COLUMN stock INTEGER DEFAULT 10;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='sale_price') THEN
    ALTER TABLE public.products ADD COLUMN sale_price NUMERIC(12, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='is_featured') THEN
    ALTER TABLE public.products ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='coming_soon') THEN
    ALTER TABLE public.products ADD COLUMN coming_soon BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='pre_order') THEN
    ALTER TABLE public.products ADD COLUMN pre_order BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='points_earned') THEN
    ALTER TABLE public.products ADD COLUMN points_earned INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='variants') THEN
    ALTER TABLE public.products ADD COLUMN variants JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='seo_title') THEN
    ALTER TABLE public.products ADD COLUMN seo_title TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='seo_description') THEN
    ALTER TABLE public.products ADD COLUMN seo_description TEXT;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. PRODUCT IMAGES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. CART TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  selected_size TEXT,
  selected_material TEXT,
  selected_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. WISHLIST TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 7. ORDERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE,
  user_id TEXT,
  email TEXT NOT NULL,
  shipping_name TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  governorate TEXT,
  shipping_zip TEXT,
  shipping_phone TEXT NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'Order Placed',
  subtotal NUMERIC(12, 2) DEFAULT 0.00,
  shipping_cost NUMERIC(12, 2) DEFAULT 0.00,
  discount NUMERIC(12, 2) DEFAULT 0.00,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  earned_points INTEGER DEFAULT 0,
  used_points INTEGER DEFAULT 0,
  tracking_number TEXT,
  estimated_delivery_date TIMESTAMPTZ,
  admin_notes TEXT,
  customer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='governorate') THEN
    ALTER TABLE public.orders ADD COLUMN governorate TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='payment_status') THEN
    ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='tracking_number') THEN
    ALTER TABLE public.orders ADD COLUMN tracking_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='estimated_delivery_date') THEN
    ALTER TABLE public.orders ADD COLUMN estimated_delivery_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='admin_notes') THEN
    ALTER TABLE public.orders ADD COLUMN admin_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='customer_notes') THEN
    ALTER TABLE public.orders ADD COLUMN customer_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='earned_points') THEN
    ALTER TABLE public.orders ADD COLUMN earned_points INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='used_points') THEN
    ALTER TABLE public.orders ADD COLUMN used_points INTEGER DEFAULT 0;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 8. ORDER ITEMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  size TEXT,
  material TEXT,
  color TEXT
);

-- -----------------------------------------------------------------------------
-- 9. ORDER TRACKING HISTORY TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_tracking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. REVIEWS & RELATED TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  user_email TEXT,
  rating NUMERIC(2, 1) NOT NULL,
  title TEXT,
  comment TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id TEXT REFERENCES public.reviews(id) ON DELETE CASCADE,
  url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id TEXT REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  UNIQUE(review_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id TEXT REFERENCES public.reviews(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id TEXT REFERENCES public.reviews(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 11. COUPONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percent NUMERIC(5, 2) NOT NULL,
  max_discount NUMERIC(12, 2),
  min_order_amount NUMERIC(12, 2) DEFAULT 0.00,
  active BOOLEAN DEFAULT TRUE,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 12. LOYALTY POINTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'earn' | 'redeem'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 13. NOTIFICATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 14. ADDRESSES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  governorate TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 15. INDEXES FOR HIGH PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_tracking_order ON public.order_tracking_history(order_id);

-- -----------------------------------------------------------------------------
-- 16. HELPER FUNCTIONS AND TRIGGERS FOR UPDATED_AT
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_modtime') THEN
    CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_modtime') THEN
    CREATE TRIGGER update_products_modtime BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_modtime') THEN
    CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Allow public read access to catalog
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public Read Products" ON public.products;
  CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
  CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Public Read Product Images" ON public.product_images;
  CREATE POLICY "Public Read Product Images" ON public.product_images FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Public Read Reviews" ON public.reviews;
  CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Allow All Full Access" ON public.users;
  CREATE POLICY "Allow All Full Access" ON public.users FOR ALL USING (true);

  DROP POLICY IF EXISTS "Allow All Full Access Orders" ON public.orders;
  CREATE POLICY "Allow All Full Access Orders" ON public.orders FOR ALL USING (true);

  DROP POLICY IF EXISTS "Allow All Full Access Order Items" ON public.order_items;
  CREATE POLICY "Allow All Full Access Order Items" ON public.order_items FOR ALL USING (true);

  DROP POLICY IF EXISTS "Allow All Full Access Cart" ON public.cart;
  CREATE POLICY "Allow All Full Access Cart" ON public.cart FOR ALL USING (true);

  DROP POLICY IF EXISTS "Allow All Full Access Wishlist" ON public.wishlist;
  CREATE POLICY "Allow All Full Access Wishlist" ON public.wishlist FOR ALL USING (true);

  DROP POLICY IF EXISTS "Allow All Full Access Reviews" ON public.reviews;
  CREATE POLICY "Allow All Full Access Reviews" ON public.reviews FOR ALL USING (true);

  DROP POLICY IF EXISTS "Allow All Full Access Coupons" ON public.coupons;
  CREATE POLICY "Allow All Full Access Coupons" ON public.coupons FOR ALL USING (true);
END $$;

-- -----------------------------------------------------------------------------
-- 18. STORAGE BUCKET CREATION (IF MISSING)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-assets', 'product-assets', true)
ON CONFLICT (id) DO NOTHING;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public Read Storage" ON storage.objects;
  CREATE POLICY "Public Read Storage" ON storage.objects FOR SELECT USING (bucket_id = 'product-assets');

  DROP POLICY IF EXISTS "Public Upload Storage" ON storage.objects;
  CREATE POLICY "Public Upload Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-assets');
END $$;
