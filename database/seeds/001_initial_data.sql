-- Initial Seed Data for VERO Accessories
INSERT INTO public.categories (id, name, slug) VALUES
  ('rings', 'Rings', 'rings'),
  ('bracelets', 'Bracelets', 'bracelets'),
  ('necklaces', 'Necklaces', 'necklaces'),
  ('earrings', 'Earrings', 'earrings')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.coupons (id, code, discount_percent, active) VALUES
  ('coupon-vero10', 'VERO10', 10, true),
  ('coupon-vip20', 'VIP20', 20, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, name, role, tier, loyalty_points, total_spent) VALUES
  ('user-vero-admin', 'vero2026@vero.com', 'VERO Executive Admin', 'admin', 'Platinum', 5000, 125000),
  ('user-customer-demo', 'arthurdevelopment101@gmail.com', 'Arthur Collector', 'customer', 'Gold', 1250, 42000)
ON CONFLICT (id) DO NOTHING;
