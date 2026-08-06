import path from "path";
import fs from "fs";
import dotenv from "dotenv";

const envFiles = [".env.local", ".env"];
export const loadedEnvFiles: string[] = [];

for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    loadedEnvFiles.push(envFile);
  }
}

export function normalizeSupabaseUrl(rawUrl: string): string {
  let cleaned = (rawUrl || "").replace(/^['"]|['"]$/g, "").trim();
  if (!cleaned) return "";
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

export function resolveSupabaseEnv() {
  const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

  const url = normalizeSupabaseUrl(rawUrl);
  const key = (rawKey || "").replace(/^['"]|['"]$/g, "").trim();

  if (url) {
    process.env.SUPABASE_URL = url;
    process.env.VITE_SUPABASE_URL = url;
  }
  if (key) {
    process.env.SUPABASE_ANON_KEY = key;
    process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || key;
  }

  return { url, key, rawUrl, rawKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = resolveSupabaseEnv();
  if (!url || !key) return false;
  if (url === "https://your-project.supabase.co" || url.includes("your-project")) return false;
  if (key === "your-anon-key" || key === "your-service-role-key" || key === "1") return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname;
    if (!host) return false;
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host.includes("your-project")) return false;
    return host.includes(".");
  } catch {
    return false;
  }
}
