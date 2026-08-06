import { Request, Response } from "express";
import { getSupabase } from "../config/supabase";
import { dbWriteLogAndExecute } from "../database/writeLogger";
import { broadcastUpdate } from "../services/sseService";

let memoryPromos = [
  { id: "SAVE10", code: "SAVE10", discountPercent: 10, isActive: true, description: "Save 10% on luxury catalog" },
  { id: "VERO20", code: "VERO20", discountPercent: 20, isActive: true, description: "20% Exclusive VIP Discount" }
];

export async function getPromos(req: Request, res: Response) {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: dbCoupons, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (!error && dbCoupons && dbCoupons.length > 0) {
        const mapped = dbCoupons.map((c: any) => ({
          id: c.id || c.code,
          code: c.code,
          discountPercent: Number(c.discount_percent || 0),
          isActive: c.active !== false,
          description: c.description || `Save ${c.discount_percent}% on luxury catalog`
        }));
        return res.json(mapped);
      }
    }
  } catch (err: any) {
    console.warn("[Supabase Fetch Warning] /api/promos:", err?.message || err);
  }

  return res.json(memoryPromos);
}

export async function createPromo(req: Request, res: Response) {
  const newPromo = req.body;
  const couponId = newPromo.id || `coupon-${Date.now()}`;
  const promoObj = {
    id: couponId,
    code: (newPromo.code || "SAVE10").toUpperCase(),
    discountPercent: Number(newPromo.discountPercent || 10),
    isActive: newPromo.isActive !== false,
    description: `Save ${newPromo.discountPercent || 10}% on luxury catalog`
  };

  memoryPromos = [promoObj, ...memoryPromos.filter((p) => p.id !== promoObj.id && p.code !== promoObj.code)];

  await dbWriteLogAndExecute("coupons", "Create Coupon", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("coupons").upsert([
      {
        id: promoObj.id,
        code: promoObj.code,
        discount_percent: promoObj.discountPercent,
        active: promoObj.isActive
      }
    ], { onConflict: "id" }).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(memoryPromos);
}

export async function deletePromo(req: Request, res: Response) {
  const promoId = req.params.id;

  memoryPromos = memoryPromos.filter((p) => p.id !== promoId && p.code !== promoId);

  await dbWriteLogAndExecute("coupons", "Delete Coupon", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("coupons").delete().eq("id", promoId);
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(memoryPromos);
}
