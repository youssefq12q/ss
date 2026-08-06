import { Request, Response } from "express";
import { getSupabase } from "../config/supabase";
import { dbWriteLogAndExecute } from "../database/writeLogger";
import { broadcastUpdate } from "../services/sseService";

export async function getUsers(req: Request, res: Response) {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: dbUsers, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
      if (!error && dbUsers) {
        const mapped = dbUsers.map((u: any) => ({
          id: u.id,
          name: u.name || u.email?.split("@")[0] || "Client",
          email: u.email,
          role: u.role || "customer",
          tier: u.tier || "Bronze",
          loyaltyPoints: Number(u.loyalty_points || 0),
          totalSpent: Number(u.total_spent || 0),
          avatar: u.avatar || "default",
          createdAt: u.created_at
        }));
        return res.json(mapped);
      }
    }
  } catch (err: any) {
    console.warn("[Supabase Fetch Warning] /api/users:", err?.message || err);
  }

  return res.json([]);
}

export async function createUser(req: Request, res: Response) {
  const newUser = req.body;
  const userId = newUser.id || `user-${Date.now()}`;

  const data = await dbWriteLogAndExecute("users", "Create User", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("users").upsert([
      {
        id: userId,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role || "customer",
        tier: newUser.tier || "Bronze",
        loyalty_points: Number(newUser.loyaltyPoints || 0),
        total_spent: Number(newUser.totalSpent || 0),
        avatar: newUser.avatar || "default"
      }
    ], { onConflict: "email" }).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
}

export async function updateUser(req: Request, res: Response) {
  const userId = req.params.id;
  const updated = req.body;

  const data = await dbWriteLogAndExecute("users", "Update User", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("users").update({
      name: updated.name,
      role: updated.role,
      tier: updated.tier,
      loyalty_points: Number(updated.loyaltyPoints || 0),
      total_spent: Number(updated.totalSpent || 0)
    }).eq("id", userId).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
}

export async function deleteUser(req: Request, res: Response) {
  const userId = req.params.id;

  await dbWriteLogAndExecute("users", "Delete User", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("users").delete().eq("id", userId);
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json({ success: true, deletedId: userId });
}
