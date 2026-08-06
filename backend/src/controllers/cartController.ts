import crypto from "crypto";
import { Request, Response } from "express";
import { getSupabase } from "../config/supabase";
import { dbWriteLogAndExecute } from "../database/writeLogger";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function getCart(req: AuthenticatedRequest, res: Response) {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const userEmail = (req.query.userEmail as string) || req.user?.email || "guest";
      const { data, error } = await supabase.from("cart").select("*").eq("user_id", userEmail);
      if (!error && data) return res.json(data);
    }
  } catch (err) {
    // ignore
  }
  return res.json([]);
}

export async function addToCart(req: AuthenticatedRequest, res: Response) {
  const item = req.body;
  const cartId = item.id || crypto.randomUUID();
  const userEmail = item.userId || req.user?.email || "guest";

  const data = await dbWriteLogAndExecute("cart", "Add Cart Item", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("cart").insert([
      {
        id: cartId,
        user_id: userEmail,
        product_id: item.productId || item.product?.id,
        quantity: Number(item.quantity || 1),
        selected_size: item.selectedSize || "Standard",
        selected_material: item.selectedMaterial || "Gold"
      }
    ]).select().single();
  });

  if (res.headersSent) return;
  res.json(data);
}

export async function removeFromCart(req: Request, res: Response) {
  const cartId = req.params.id;
  await dbWriteLogAndExecute("cart", "Remove Cart Item", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("cart").delete().eq("id", cartId);
  });
  if (res.headersSent) return;
  res.json({ success: true, deletedId: cartId });
}
