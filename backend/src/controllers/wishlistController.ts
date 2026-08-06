import crypto from "crypto";
import { Request, Response } from "express";
import { getSupabase } from "../config/supabase";
import { dbWriteLogAndExecute } from "../database/writeLogger";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function getWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const userEmail = (req.query.userEmail as string) || req.user?.email || "guest";
      const { data, error } = await supabase.from("wishlist").select("*").eq("user_id", userEmail);
      if (!error && data) return res.json(data);
    }
  } catch (err) {
    // ignore
  }
  return res.json([]);
}

export async function addToWishlist(req: AuthenticatedRequest, res: Response) {
  const item = req.body;
  const wishId = item.id || crypto.randomUUID();
  const userEmail = item.userId || req.user?.email || "guest";

  const data = await dbWriteLogAndExecute("wishlist", "Add Wishlist Item", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("wishlist").insert([
      {
        id: wishId,
        user_id: userEmail,
        product_id: item.productId || item.product?.id
      }
    ]).select().single();
  });

  if (res.headersSent) return;
  res.json(data);
}

export async function removeFromWishlist(req: Request, res: Response) {
  const wishId = req.params.id;
  await dbWriteLogAndExecute("wishlist", "Remove Wishlist Item", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("wishlist").delete().eq("id", wishId);
  });
  if (res.headersSent) return;
  res.json({ success: true, deletedId: wishId });
}
