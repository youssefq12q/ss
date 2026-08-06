import { Request, Response } from "express";
import { getSupabase } from "../config/supabase";
import { dbWriteLogAndExecute } from "../database/writeLogger";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const userEmail = (req.query.userEmail as string) || req.user?.email || "guest";
      const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userEmail).order("created_at", { ascending: false });
      if (!error && data) return res.json(data);
    }
  } catch (err) {
    // ignore
  }
  return res.json([]);
}

export async function markNotificationRead(req: Request, res: Response) {
  const notifId = req.params.id;
  const data = await dbWriteLogAndExecute("notifications", "Mark Notification Read", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("notifications").update({ read: true }).eq("id", notifId).select().single();
  });
  if (res.headersSent) return;
  res.json(data);
}
