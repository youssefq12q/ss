import crypto from "crypto";

export interface Session {
  token: string;
  userId: string;
  email: string;
  role: string;
  name: string;
  createdAt: number;
  expiresAt: number;
  ip: string;
  userAgent: string;
}

export const activeSessions: Map<string, Session> = new Map();
export const loginFailures: Map<string, { count: number; lockUntil: number }> = new Map();

export function isVeroAdminEmail(email: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === "vero2026@vero.com" || clean.endsWith("@vero.com");
}

export function sanitizeString(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(/[<>]/g, "").trim();
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!hash || !salt) return false;
  const verifyHash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
}

export function createSession(userId: string, email: string, role: string, name: string, ip: string, userAgent: string, rememberMe: boolean): Session {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const session: Session = {
    token,
    userId,
    email,
    role,
    name,
    createdAt: now,
    expiresAt: now + duration,
    ip,
    userAgent
  };
  activeSessions.set(token, session);
  return session;
}

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
