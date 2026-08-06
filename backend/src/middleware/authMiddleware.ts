import { Request, Response, NextFunction } from "express";
import { activeSessions, isVeroAdminEmail, Session } from "../utils/securityUtils";
import { getSupabase } from "../config/supabase";

export interface AuthenticatedRequest extends Request {
  user?: Session;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers["x-session-token"] as string | undefined;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : customHeader;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token." });
  }

  const session = activeSessions.get(token);
  if (session) {
    if (session.expiresAt < Date.now()) {
      activeSessions.delete(token);
      return res.status(401).json({ error: "Unauthorized: Session expired." });
    }
    req.user = session;
    return next();
  }

  // Check Supabase Auth JWT if configured
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user && user.email) {
        const role = isVeroAdminEmail(user.email) ? "admin" : "customer";
        const verifiedSession: Session = {
          token,
          userId: user.id,
          email: user.email,
          role,
          name: user.user_metadata?.name || user.email.split("@")[0],
          createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          ip: req.socket.remoteAddress || "127.0.0.1",
          userAgent: req.headers["user-agent"] || ""
        };
        activeSessions.set(token, verifiedSession);
        req.user = verifiedSession;
        return next();
      }
    } catch (err) {
      // Token verification failed
    }
  }

  return res.status(401).json({ error: "Unauthorized: Session expired or invalid." });
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin" && !isVeroAdminEmail(req.user?.email || "")) {
      return res.status(403).json({ error: "Forbidden: Executive Admin privileges required." });
    }
    next();
  });
}
