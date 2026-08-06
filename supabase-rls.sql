-- VERO Enterprise Database Row Level Security (RLS) & Role-Based Access Control Policies (Idempotent)

-- Enable Row Level Security (RLS) on all user-related and operational tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Helper Function to check if the requesting user has 'admin' role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-------------------------------------------------------
-- 1. USERS TABLE POLICIES
-------------------------------------------------------
DROP POLICY IF EXISTS "Users: read own record" ON users;
DROP POLICY IF EXISTS "Users: update own record" ON users;
DROP POLICY IF EXISTS "Users: admin full control" ON users;

CREATE POLICY "Users: read own record" ON users
  FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users: update own record" ON users
  FOR UPDATE USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users: admin full control" ON users
  FOR ALL USING (is_admin());

-------------------------------------------------------
-- 2. ORDERS TABLE POLICIES
-------------------------------------------------------
DROP POLICY IF EXISTS "Orders: read own orders" ON orders;
DROP POLICY IF EXISTS "Orders: insert own order" ON orders;
DROP POLICY IF EXISTS "Orders: admin update" ON orders;
DROP POLICY IF EXISTS "Orders: admin delete" ON orders;

CREATE POLICY "Orders: read own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id OR email = auth.jwt() ->> 'email' OR is_admin());

CREATE POLICY "Orders: insert own order" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR email = auth.jwt() ->> 'email' OR is_admin());

CREATE POLICY "Orders: admin update" ON orders
  FOR UPDATE USING (is_admin());

CREATE POLICY "Orders: admin delete" ON orders
  FOR DELETE USING (is_admin());

-------------------------------------------------------
-- 3. ORDER ITEMS TABLE POLICIES
-------------------------------------------------------
DROP POLICY IF EXISTS "OrderItems: read own items" ON order_items;
DROP POLICY IF EXISTS "OrderItems: insert own items" ON order_items;

CREATE POLICY "OrderItems: read own items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.email = auth.jwt() ->> 'email' OR is_admin())
    )
  );

CREATE POLICY "OrderItems: insert own items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.email = auth.jwt() ->> 'email' OR is_admin())
    )
  );

-------------------------------------------------------
-- 4. CART & WISHLIST POLICIES
-------------------------------------------------------
DROP POLICY IF EXISTS "Cart: customer own items" ON cart;
DROP POLICY IF EXISTS "Wishlist: customer own items" ON wishlist;

CREATE POLICY "Cart: customer own items" ON cart
  FOR ALL USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Wishlist: customer own items" ON wishlist
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-------------------------------------------------------
-- 5. REVIEWS POLICIES
-------------------------------------------------------
DROP POLICY IF EXISTS "Reviews: read approved reviews" ON reviews;
DROP POLICY IF EXISTS "Reviews: insert own review" ON reviews;
DROP POLICY IF EXISTS "Reviews: update own review" ON reviews;
DROP POLICY IF EXISTS "Reviews: delete review" ON reviews;

CREATE POLICY "Reviews: read approved reviews" ON reviews
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR is_admin());

CREATE POLICY "Reviews: insert own review" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Reviews: update own review" ON reviews
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Reviews: delete review" ON reviews
  FOR DELETE USING (auth.uid() = user_id OR is_admin());

-------------------------------------------------------
-- 6. AUDIT LOGS POLICIES
-------------------------------------------------------
DROP POLICY IF EXISTS "AuditLogs: admin only" ON audit_logs;

CREATE POLICY "AuditLogs: admin only" ON audit_logs
  FOR ALL USING (is_admin());

-------------------------------------------------------
-- 7. PRODUCTS, PROMOS, REWARDS
-------------------------------------------------------
DROP POLICY IF EXISTS "Products: public read" ON products;
DROP POLICY IF EXISTS "Products: admin write" ON products;
DROP POLICY IF EXISTS "Promos: public read active" ON promos;
DROP POLICY IF EXISTS "Promos: admin write" ON promos;
DROP POLICY IF EXISTS "Rewards: public read" ON rewards;
DROP POLICY IF EXISTS "Rewards: admin write" ON rewards;

CREATE POLICY "Products: public read" ON products FOR SELECT USING (true);
CREATE POLICY "Products: admin write" ON products FOR ALL USING (is_admin());

CREATE POLICY "Promos: public read active" ON promos FOR SELECT USING (true);
CREATE POLICY "Promos: admin write" ON promos FOR ALL USING (is_admin());

CREATE POLICY "Rewards: public read" ON rewards FOR SELECT USING (true);
CREATE POLICY "Rewards: admin write" ON rewards FOR ALL USING (is_admin());
