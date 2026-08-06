import { Request, Response } from "express";
import { getSupabase } from "../config/supabase";
import { dbWriteLogAndExecute } from "../database/writeLogger";
import { createSession, isVeroAdminEmail, sanitizeString, activeSessions } from "../utils/securityUtils";
import { UserProfile } from "../types";

export async function login(req: Request, res: Response) {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabase();
  let user: UserProfile | null = null;

  if (supabase) {
    const { data: dbUser } = await supabase.from("users").select("*").eq("email", cleanEmail).maybeSingle();
    if (dbUser) {
      user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role || (isVeroAdminEmail(cleanEmail) ? "admin" : "customer"),
        tier: dbUser.tier || "Bronze",
        loyaltyPoints: dbUser.loyalty_points || 0,
        totalSpent: Number(dbUser.total_spent || 0),
        avatar: dbUser.avatar || "default",
        provider: "email",
        joinedDate: dbUser.created_at || new Date().toISOString()
      };
    }
  }

  if (!user) {
    const role = isVeroAdminEmail(cleanEmail) ? "admin" : "customer";
    user = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      name: cleanEmail.split("@")[0],
      role: role,
      tier: "Bronze",
      loyaltyPoints: 250,
      totalSpent: 0,
      avatar: "default",
      provider: "email",
      joinedDate: new Date().toISOString()
    };
  }

  const session = createSession(user.id || `u-${Date.now()}`, user.email, user.role || "customer", user.name, req.socket.remoteAddress || "127.0.0.1", req.headers["user-agent"] || "", !!rememberMe);
  res.json({ user: { ...user, sessionToken: session.token } });
}

export async function register(req: Request, res: Response) {
  const { name, email, password, rememberMe } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: "Name, email, and password are required." });

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = sanitizeString(name);
  const role = isVeroAdminEmail(cleanEmail) ? "admin" : "customer";
  const userId = `u-${Date.now()}`;

  await dbWriteLogAndExecute("users", "User Registration", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("users").upsert([
      {
        id: userId,
        email: cleanEmail,
        name: cleanName,
        role: role,
        tier: "Bronze",
        loyalty_points: 250,
        total_spent: 0,
        avatar: "default"
      }
    ], { onConflict: "email" }).select().single();
  });

  if (res.headersSent) return;

  const session = createSession(userId, cleanEmail, role, cleanName, req.socket.remoteAddress || "127.0.0.1", req.headers["user-agent"] || "", !!rememberMe);
  res.json({
    user: {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      role: role,
      tier: "Bronze",
      loyaltyPoints: 250,
      totalSpent: 0,
      avatar: "default",
      provider: "email",
      joinedDate: new Date().toISOString(),
      sessionToken: session.token
    }
  });
}

export function logout(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers["x-session-token"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : (customHeader as string);
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ success: true });
}

export async function updateProfile(req: Request, res: Response) {
  const { email, loyaltyPoints, totalSpent, tier, name, avatar } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const cleanEmail = email.trim().toLowerCase();
  const updatePayload: Record<string, any> = {};
  if (loyaltyPoints !== undefined) updatePayload.loyalty_points = Number(loyaltyPoints);
  if (totalSpent !== undefined) updatePayload.total_spent = Number(totalSpent);
  if (tier) updatePayload.tier = tier;
  if (name) updatePayload.name = name;
  if (avatar) updatePayload.avatar = avatar;

  const data = await dbWriteLogAndExecute("users", "Update Profile", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("users").update(updatePayload).eq("email", cleanEmail).select().single();
  });

  if (res.headersSent) return;
  res.json({ success: true, user: data });
}
