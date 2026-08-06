import { Request, Response } from "express";
import { getSupabase } from "../config/supabase";
import { dbWriteLogAndExecute } from "../database/writeLogger";
import { broadcastUpdate } from "../services/sseService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

let memoryRewards = [
  {
    id: "rew-1",
    title: "خصم 10% على أي قطعة",
    titleEn: "10% Off Any Piece",
    cost: 500,
    code: "VERO10POINTS",
    description: "استبدل 500 نقطة ولاء بخصم 10% على مشترياتك القادمة",
    descriptionEn: "Redeem 500 loyalty points for 10% off your next purchase",
    discountPercent: 10
  },
  {
    id: "rew-2",
    title: "خصم 20% لكبار العملاء VIP",
    titleEn: "20% VIP Exclusive Discount",
    cost: 1000,
    code: "VEROVIP20",
    description: "استبدل 1000 نقطة للحصول على خصم 20% حصري",
    descriptionEn: "Redeem 1000 points for an exclusive 20% VIP discount",
    discountPercent: 20
  },
  {
    id: "rew-3",
    title: "شحن جوي مجاني لكافة الطلبات",
    titleEn: "Free Worldwide Air Express Shipping",
    cost: 300,
    code: "FREESHIPVERO",
    description: "استبدل 300 نقطة ولاء للحصول على شحن مجاني سريع",
    descriptionEn: "Redeem 300 points for free express shipping on any order",
    discountPercent: 0
  }
];

export async function getRewards(req: Request, res: Response) {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: dbRewards, error } = await supabase.from("rewards").select("*");
      if (!error && dbRewards && dbRewards.length > 0) {
        const mapped = dbRewards.map((r: any) => ({
          id: r.id,
          title: r.title,
          titleEn: r.title_en || r.title,
          cost: Number(r.cost),
          code: r.code,
          description: r.description,
          descriptionEn: r.description_en || r.description,
          discountPercent: Number(r.discount_percent || 0)
        }));
        return res.json(mapped);
      }
    }
  } catch (err: any) {
    console.warn("[Supabase Fetch Warning] /api/rewards:", err?.message || err);
  }

  return res.json(memoryRewards);
}

export async function createReward(req: Request, res: Response) {
  const newRew = req.body;
  const rewardId = newRew.id || `rew-${Date.now()}`;
  const rewObj = {
    id: rewardId,
    title: newRew.title || "مكافأة جديدة",
    titleEn: newRew.titleEn || newRew.title || "New VIP Reward",
    cost: Number(newRew.cost || 500),
    code: newRew.code || `VERO${Date.now().toString().slice(-4)}`,
    description: newRew.description || "استبدل نقاطك للمكافأة",
    descriptionEn: newRew.descriptionEn || "Redeem your loyalty points",
    discountPercent: Number(newRew.discountPercent || 10)
  };

  memoryRewards = [rewObj, ...memoryRewards.filter((r) => r.id !== rewObj.id)];

  await dbWriteLogAndExecute("rewards", "Create Reward", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("rewards").upsert([
      {
        id: rewObj.id,
        title: rewObj.title,
        title_en: rewObj.titleEn,
        cost: rewObj.cost,
        code: rewObj.code,
        description: rewObj.description,
        description_en: rewObj.descriptionEn,
        discount_percent: rewObj.discountPercent
      }
    ], { onConflict: "id" }).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(memoryRewards);
}

export async function deleteReward(req: Request, res: Response) {
  const rewardId = req.params.id;

  memoryRewards = memoryRewards.filter((r) => r.id !== rewardId);

  await dbWriteLogAndExecute("rewards", "Delete Reward", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("rewards").delete().eq("id", rewardId);
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(memoryRewards);
}

export async function redeemReward(req: AuthenticatedRequest, res: Response) {
  const { rewardId, pointsCost } = req.body;
  const userEmail = req.user?.email || req.body.userEmail;

  const supabase = getSupabase();
  if (supabase && userEmail) {
    const { data: dbUser } = await supabase.from("users").select("loyalty_points").eq("email", userEmail.toLowerCase()).single();
    if (dbUser) {
      const currentPts = dbUser.loyalty_points || 0;
      const newPts = Math.max(0, currentPts - Number(pointsCost || 0));
      await supabase.from("users").update({ loyalty_points: newPts }).eq("email", userEmail.toLowerCase());
    }
  }
  broadcastUpdate();
  res.json({ success: true, rewardId, userEmail });
}
