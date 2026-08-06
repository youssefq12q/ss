import { getSupabase } from "../config/supabase";
import { PRODUCTS } from "../data";

export async function seedSupabaseDatabase() {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // 1. Categories
    const { data: catCheck } = await supabase.from("categories").select("id").limit(1);
    if (!catCheck || catCheck.length === 0) {
      console.log("[Supabase Auto-Seed] Seeding categories table...");
      const catRows = [
        { id: "rings", name: "Rings", slug: "rings" },
        { id: "bracelets", name: "Bracelets", slug: "bracelets" },
        { id: "necklaces", name: "Necklaces", slug: "necklaces" },
        { id: "earrings", name: "Earrings", slug: "earrings" }
      ];
      await supabase.from("categories").upsert(catRows, { onConflict: "id" });
    }

    // 2. Products
    const { data: prodCheck } = await supabase.from("products").select("id").limit(1);
    if (!prodCheck || prodCheck.length === 0) {
      console.log("[Supabase Auto-Seed] Seeding products table...");
      const prodRows = PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        category_id: p.categoryId || "rings",
        price: p.price,
        original_price: p.originalPrice || null,
        points_earned: p.pointsEarned || Math.floor(p.price / 100),
        stock: p.stock === undefined ? 10 : p.stock,
        is_new: !!p.isNew,
        pre_order: Boolean(p.isPreOrder),
        images: [p.image, ...(p.secondaryImages || [])].filter(Boolean),
        sizes: p.sizeOptions || ["Standard", "Premium"],
        materials: p.materialOptions || ["#E5D5BC", "#E5E4E2"],
        description: p.description || ""
      }));
      await supabase.from("products").upsert(prodRows, { onConflict: "id" });
    }

    // 3. Coupons
    const { data: couponCheck } = await supabase.from("coupons").select("id").limit(1);
    if (!couponCheck || couponCheck.length === 0) {
      console.log("[Supabase Auto-Seed] Seeding coupons table...");
      await supabase.from("coupons").upsert([
        { id: "coupon-vero10", code: "VERO10", discount_percent: 10, active: true },
        { id: "coupon-vip20", code: "VIP20", discount_percent: 20, active: true }
      ], { onConflict: "id" });
    }

    // 4. Admin and Customer Users
    const { data: userCheck } = await supabase.from("users").select("id").limit(1);
    if (!userCheck || userCheck.length === 0) {
      console.log("[Supabase Auto-Seed] Seeding users table...");
      await supabase.from("users").upsert([
        {
          id: "user-vero-admin",
          email: "vero2026@vero.com",
          name: "VERO Executive Admin",
          role: "admin",
          tier: "Platinum",
          loyalty_points: 5000,
          total_spent: 125000
        },
        {
          id: "user-customer-demo",
          email: "arthurdevelopment101@gmail.com",
          name: "Arthur Collector",
          role: "customer",
          tier: "Gold",
          loyalty_points: 1250,
          total_spent: 42000
        }
      ], { onConflict: "id" });
    }

    // 5. Reviews
    const { data: reviewCheck } = await supabase.from("reviews").select("id").limit(1);
    if (!reviewCheck || reviewCheck.length === 0) {
      console.log("[Supabase Auto-Seed] Seeding reviews table...");
      await supabase.from("reviews").upsert([
        {
          id: "rev-1",
          product_id: PRODUCTS[0]?.id || "prod-royal-emerald-ring",
          user_name: "Eleanor Vance",
          user_email: "eleanor@example.com",
          rating: 5,
          title: "Exquisite Craftsmanship",
          comment: "The emerald cut diamond catches the light beautifully. Superb quality!",
          helpful_count: 12,
          verified_purchase: true,
          status: "approved"
        }
      ], { onConflict: "id" });
    }

    console.log("[Supabase Auto-Seed] ✅ Auto-seeding check completed successfully!");
  } catch (err) {
    console.error("[Supabase Auto-Seed Error]:", err);
  }
}
