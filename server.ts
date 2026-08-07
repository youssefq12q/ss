import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS } from "./src/data";

// Load environment variables from .env files
const envFiles = [".env.local", ".env"];
const loadedEnvFiles: string[] = [];

for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    loadedEnvFiles.push(envFile);
  }
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Helper to normalize Supabase URL
function normalizeSupabaseUrl(rawUrl: string): string {
  let cleaned = (rawUrl || "").replace(/^['"]|['"]$/g, "").trim();
  if (!cleaned) return "";
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

function resolveSupabaseEnv() {
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

function isSupabaseConfigured(): boolean {
  const { url, key } = resolveSupabaseEnv();
  return !!(
    url &&
    (url.startsWith("http://") || url.startsWith("https://")) &&
    url !== "https://your-project.supabase.co" &&
    !url.includes("your-project") &&
    key &&
    key !== "your-anon-key" &&
    key !== "your-service-role-key" &&
    key !== "1"
  );
}

let dbClient: any = null;
function getSupabase() {
  if (isSupabaseConfigured()) {
    if (!dbClient) {
      const { url, key } = resolveSupabaseEnv();
      dbClient = createClient(url, key);
      console.log(`[Express Server] Supabase client initialized -> ${url}`);
    }
    return dbClient;
  }
  return null;
}

// Log startup environment diagnostics
const initialEnv = resolveSupabaseEnv();
const initialConfigured = isSupabaseConfigured();
console.log(`=======================================================`);
console.log(`[Express Server Startup Diagnostic]`);
console.log(`Loaded Env Files: ${loadedEnvFiles.join(", ") || "None"}`);
console.log(`Resolved Supabase URL: ${initialEnv.url || "MISSING"}`);
console.log(`Resolved Supabase Key: ${initialEnv.key ? "PRESENT (" + initialEnv.key.length + " chars)" : "MISSING"}`);
if (initialConfigured) {
  console.log(`Status: ✅ Supabase Live Database Connection ACTIVE`);
} else {
  console.warn(`Status: ⚠️ Demo Mode Active`);
}
console.log(`=======================================================`);

// AUTO-SEED SUPABASE DATABASE IF EMPTY
async function seedSupabaseDatabase() {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // 1. Categories
    const { data: catCheck } = await supabase.from("categories").select("id").limit(1);
    if (!catCheck || catCheck.length === 0) {
      console.log("[Supabase Auto-Seed] Seeding categories table...");
      const catRows = [
        { id: "rings", name: "Rings", slug: "rings" },
        { id: "bracelets", name: "Bracelets", slug: "bracelets" },
        { id: "necklaces", name: "Necklaces", slug: "necklaces" },
        { id: "earrings", name: "Earrings", slug: "earrings" }
      ];
      await supabase.from("categories").upsert(catRows, { onConflict: "id" });
    }

    // 2. Products
    const { data: prodCheck } = await supabase.from("products").select("id").limit(1);
    if (!prodCheck || prodCheck.length === 0) {
      console.log("[Supabase Auto-Seed] Seeding products table...");
      const prodRows = PRODUCTS.map(p => ({
        id: p.id,
        name: p.name,
        category_id: p.categoryId || "rings",
        price: p.price,
        original_price: p.originalPrice || null,
        points_earned: p.pointsEarned || Math.floor(p.price / 100),
        stock: p.stock === undefined ? 10 : p.stock,
        is_new: !!p.isNew,
        pre_order: Boolean(p.isPreOrder),
        images: [p.image, ...(p.secondaryImages || [])].filter(Boolean),
        sizes: p.sizeOptions || ["Standard", "Premium"],
        materials: p.materialOptions || ["#E5D5BC", "#E5E4E2"],
        description: p.description || ""
      }));
      await supabase.from("products").upsert(prodRows, { onConflict: "id" });
    }

    // 3. Coupons
    const { data: couponCheck } = await supabase.from("coupons").select("id").limit(1);
    if (!couponCheck || couponCheck.length === 0) {
      console.log("[Supabase Auto-Seed] Seeding coupons table...");
      await supabase.from("coupons").upsert([
        { id: "coupon-vero10", code: "VERO10", discount_percent: 10, active: true },
        { id: "coupon-vip20", code: "VIP20", discount_percent: 20, active: true }
      ], { onConflict: "id" });
    }

    // 4. Admin and Customer Users
    const { data: userCheck } = await supabase.from("users").select("id").limit(1);
    if (!userCheck || userCheck.length === 0) {
      console.log("[Supabase Auto-Seed] Seeding users table...");
      await supabase.from("users").upsert([
        {
          id: "user-vero-admin",
          email: "vero2026@vero.com",
          name: "VERO Executive Admin",
          role: "admin",
          tier: "Platinum",
          loyalty_points: 5000,
          total_spent: 125000
        },
        {
          id: "user-customer-demo",
          email: "arthurdevelopment101@gmail.com",
          name: "Arthur Collector",
          role: "customer",
          tier: "Gold",
          loyalty_points: 1250,
          total_spent: 42000
        }
      ], { onConflict: "id" });
    }

    // 5. Reviews
    const { data: reviewCheck } = await supabase.from("reviews").select("id").limit(1);
    if (!reviewCheck || reviewCheck.length === 0) {
      console.log("[Supabase Auto-Seed] Seeding reviews table...");
      await supabase.from("reviews").upsert([
        {
          id: "rev-1",
          product_id: PRODUCTS[0]?.id || "prod-royal-emerald-ring",
          user_name: "Eleanor Vance",
          user_email: "eleanor@example.com",
          rating: 5,
          title: "Exquisite Craftsmanship",
          comment: "The emerald cut diamond catches the light beautifully. Superb quality!",
          helpful_count: 12,
          verified_purchase: true,
          status: "approved"
        }
      ], { onConflict: "id" });
    }

    console.log("[Supabase Auto-Seed] ✅ Auto-seeding check completed successfully!");
  } catch (err) {
    console.error("[Supabase Auto-Seed Error]:", err);
  }
}

// Trigger auto-seeding
seedSupabaseDatabase();

// Central Logger and Executor for Database Writes
async function dbWriteLogAndExecute(
  table: string,
  actionName: string,
  req: any,
  res: any,
  operation: () => Promise<{ data: any; error: any }>
) {
  console.log(`=======================================================`);
  console.log(`[DB WRITE REQUEST RECEIVED] ${req.method} ${req.path}`);
  console.log(`Action: ${actionName}`);
  console.log(`SQL Table: ${table}`);
  console.log(`Payload:`, JSON.stringify(req.body, null, 2));

  const supabase = getSupabase();
  if (!supabase) {
    console.error(`[DB WRITE FAILED] Supabase client is NOT configured.`);
    return res.status(500).json({ error: "Supabase database client is not configured." });
  }

  try {
    const { data, error } = await operation();
    if (error) {
      console.error(`[DB WRITE ERROR] Table: ${table} | Supabase Error:`, JSON.stringify(error, null, 2));
      console.log(`=======================================================`);
      return res.status(500).json({
        error: `Supabase database error: ${error.message || "Failed to execute database write"}`,
        code: error.code,
        details: error.details,
        hint: error.hint,
        table
      });
    }

    console.log(`[DB WRITE SUCCESS] Table: ${table} | Insert/Update Result:`, JSON.stringify(data, null, 2));
    console.log(`=======================================================`);
    return data;
  } catch (err: any) {
    console.error(`[DB WRITE UNHANDLED EXCEPTION] Table: ${table} | Error:`, err);
    console.log(`=======================================================`);
    return res.status(500).json({ error: err.message || "Internal database server error", table });
  }
}

// Security & Audit Log Helper
const AUDIT_LOGS_FILE = path.join(process.cwd(), "audit-logs.json");
const DB_FILE = path.join(process.cwd(), "products-db.json");
const ORDERS_FILE = path.join(process.cwd(), "orders-db.json");

function getProductsFromDisk(): any[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error("Error reading products-db.json:", err);
  }
  return PRODUCTS;
}

function saveProductsToDisk(productsArr: any[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(productsArr, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving products-db.json:", err);
  }
}

let memoryProducts: any[] = getProductsFromDisk();
let memoryPromos: any[] = [
  { id: "coupon-vero10", code: "VERO10", discountPercent: 10, isActive: true, description: "Save 10% on luxury catalog" },
  { id: "coupon-vip20", code: "VIP20", discountPercent: 20, isActive: true, description: "Save 20% on luxury catalog" }
];

function getAuditLogsFromDisk(): any[] {
  try {
    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      const content = fs.readFileSync(AUDIT_LOGS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading audit logs:", err);
  }
  return [];
}

function logAuditEvent(userId: string, userEmail: string, action: string, targetResource: string, details: string, ipAddress: string) {
  const logEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    userId,
    userEmail,
    action,
    targetResource,
    details,
    ipAddress
  };
  const logs = getAuditLogsFromDisk();
  logs.unshift(logEntry);
  if (logs.length > 500) logs.pop();
  try {
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving audit log:", err);
  }
}

// Password Hashing Helper
function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!hash || !salt) return false;
  const verifyHash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
}

// Session Token Storage
interface Session {
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

const activeSessions: Map<string, Session> = new Map();
const loginFailures: Map<string, { count: number; lockUntil: number }> = new Map();

function checkLoginBruteForce(email: string): { isLocked: boolean; remainingSeconds: number } {
  const now = Date.now();
  const record = loginFailures.get(email.toLowerCase());
  if (!record) return { isLocked: false, remainingSeconds: 0 };
  if (record.lockUntil > now) {
    return { isLocked: true, remainingSeconds: Math.ceil((record.lockUntil - now) / 1000) };
  }
  return { isLocked: false, remainingSeconds: 0 };
}

function recordFailedLogin(email: string): number {
  const key = email.toLowerCase();
  const now = Date.now();
  const record = loginFailures.get(key) || { count: 0, lockUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockUntil = now + 15 * 60 * 1000;
  }
  loginFailures.set(key, record);
  return record.count;
}

function clearFailedLogin(email: string) {
  loginFailures.delete(email.toLowerCase());
}

function createSession(userId: string, email: string, role: string, name: string, ip: string, userAgent: string, rememberMe: boolean): Session {
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

function isVeroAdminEmail(email: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === "vero2026@vero.com" || clean.endsWith("@vero.com");
}

function sanitizeString(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(/[<>]/g, "").trim();
}

function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers["x-session-token"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : (customHeader as string);

  if (!token) {
    const userEmail = req.headers["x-user-email"] as string;
    if (userEmail) {
      const role = isVeroAdminEmail(userEmail) ? "admin" : "customer";
      req.user = {
        userId: userEmail,
        email: userEmail,
        role: role,
        name: userEmail.split("@")[0],
        token: "header-token",
        ip: req.socket.remoteAddress || "127.0.0.1"
      };
      return next();
    }
    return res.status(401).json({ error: "Unauthorized: Missing authentication token." });
  }

  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ error: "Unauthorized: Session expired or invalid." });
  }

  req.user = session;
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin" && !isVeroAdminEmail(req.user?.email)) {
      return res.status(403).json({ error: "Forbidden: Executive Admin privileges required." });
    }
    next();
  });
}

// Product Mappers
function mapSupabaseToAppProduct(p: any) {
  if (!p) return null;

  // 1. Determine images
  let images: string[] = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    images = p.images;
  } else if (p.image) {
    images = [p.image, ...(Array.isArray(p.secondaryImages) ? p.secondaryImages : [])];
  } else if (p.images && typeof p.images === "string") {
    images = [p.images];
  }

  const mainImage = images[0] || p.image || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80";
  const secImages = images.slice(1).filter((img: string) => img !== mainImage);

  // 2. Category
  const catId = p.categoryId || p.category_id || "rings";
  const catName = p.categoryName || (catId.charAt(0).toUpperCase() + catId.slice(1));

  // 3. Prices
  const origPrice = p.originalPrice !== undefined ? (p.originalPrice === "" ? undefined : Number(p.originalPrice)) : (p.original_price ? Number(p.original_price) : undefined);
  const currentPrice = Number(p.price || 0);

  let discountPct: number | undefined = p.discountPercent !== undefined ? (p.discountPercent === "" ? undefined : Number(p.discountPercent)) : undefined;
  if (discountPct === undefined && origPrice && origPrice > currentPrice) {
    discountPct = Math.round(((origPrice - currentPrice) / origPrice) * 100);
  }

  // 4. Points
  const pts = p.pointsEarned !== undefined ? (p.pointsEarned === "" ? undefined : Number(p.pointsEarned)) : (p.points_earned ? Number(p.points_earned) : Math.floor(currentPrice / 100));

  // 5. Badges
  const isNewVal = p.isNew !== undefined ? Boolean(p.isNew) : (p.is_new !== undefined ? Boolean(p.is_new) : true);
  const isPreOrderVal = p.isPreOrder !== undefined ? Boolean(p.isPreOrder) : Boolean(p.pre_order ?? p.is_pre_order);

  // 6. Options
  const mats = Array.isArray(p.materialOptions) && p.materialOptions.length > 0 ? p.materialOptions : (Array.isArray(p.materials) && p.materials.length > 0 ? p.materials : ["#E5D5BC", "#E5E4E2"]);
  const sizes = Array.isArray(p.sizeOptions) && p.sizeOptions.length > 0 ? p.sizeOptions : (Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ["Standard", "Premium"]);
  const details = Array.isArray(p.details) && p.details.length > 0 ? p.details : ["18k Gold Finish", "Hand-polished"];

  return {
    id: String(p.id),
    name: p.name || "Untitled Creation",
    categoryId: catId,
    categoryName: catName,
    price: currentPrice,
    originalPrice: origPrice,
    discountPercent: discountPct,
    pointsEarned: pts,
    image: mainImage,
    secondaryImages: secImages,
    description: p.description || "",
    tagline: p.tagline || `"${p.name || 'VERO Creation'}"`,
    isNew: isNewVal,
    isPreOrder: isPreOrderVal,
    materialOptions: mats,
    sizeOptions: sizes,
    details: details,
    craftsmanship: p.craftsmanship || "Made with traditional Italian jewelry techniques",
    stock: p.stock === null || p.stock === undefined || p.stock === "" ? undefined : Number(p.stock)
  };
}

// API Routes - Config & Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", supabaseConfigured: isSupabaseConfigured() });
});

app.get("/api/supabase/config", (req, res) => {
  const env = resolveSupabaseEnv();
  const configured = isSupabaseConfigured();
  return res.json({
    isConfigured: configured,
    url: env.url,
    keyConfigured: !!env.key,
    anonKey: env.key,
    loadedEnvFiles
  });
});

// Real-Time SSE Endpoint
let sseClients: any[] = [];
function broadcastUpdate() {
  sseClients.forEach((client) => {
    try {
      client.write("data: REFRESH\n\n");
    } catch (err) {}
  });
}

app.get("/api/updates", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("data: CONNECTED\n\n");
  sseClients.push(res);
  const heartbeat = setInterval(() => {
    try {
      res.write("data: PING\n\n");
    } catch (err) {}
  }, 25000);
  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter((client) => client !== res);
  });
});

// AUTH ENDPOINTS
app.post("/api/auth/login", async (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabase();
  let user: any = null;

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
        avatar: dbUser.avatar || "default"
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
      avatar: "default"
    };
  }

  const session = createSession(user.id, user.email, user.role, user.name, req.socket.remoteAddress || "127.0.0.1", req.headers["user-agent"] || "", !!rememberMe);
  res.json({ user: { ...user, sessionToken: session.token } });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, rememberMe } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: "Name, email, and password are required." });

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = sanitizeString(name);
  const role = isVeroAdminEmail(cleanEmail) ? "admin" : "customer";
  const userId = `u-${Date.now()}`;

  const writeData = await dbWriteLogAndExecute("users", "User Registration", req, res, async () => {
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
      sessionToken: session.token
    }
  });
});

app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers["x-session-token"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : (customHeader as string);
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

app.put("/api/auth/profile", async (req: any, res: any) => {
  const { email, loyaltyPoints, totalSpent, tier, name, avatar } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const cleanEmail = email.trim().toLowerCase();
  const updatePayload: any = {};
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
});

// CATEGORIES ENDPOINTS
app.get("/api/categories", async (req, res) => {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true });
    if (!error && data && data.length > 0) {
      return res.json(data);
    }
  }
  res.json([
    { id: "rings", name: "Rings", slug: "rings" },
    { id: "bracelets", name: "Bracelets", slug: "bracelets" },
    { id: "necklaces", name: "Necklaces", slug: "necklaces" },
    { id: "earrings", name: "Earrings", slug: "earrings" }
  ]);
});

app.post("/api/categories", requireAdmin, async (req: any, res: any) => {
  const newCat = req.body;
  if (!newCat.id) newCat.id = newCat.slug || `cat-${Date.now()}`;

  const data = await dbWriteLogAndExecute("categories", "Create Category", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("categories").upsert([
      {
        id: newCat.id,
        name: newCat.name,
        slug: newCat.slug || newCat.id,
        image: newCat.image || null
      }
    ], { onConflict: "id" }).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
});

// PRODUCTS ENDPOINTS
app.get("/api/products", async (req, res) => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: productsData, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (!error && productsData && productsData.length > 0) {
        const mapped = productsData.map(mapSupabaseToAppProduct).filter(Boolean);
        // Merge Supabase products with memoryProducts so custom local products aren't lost!
        const productMap = new Map<string, any>();
        memoryProducts.forEach((p) => { if (p && p.id) productMap.set(String(p.id), p); });
        mapped.forEach((p) => { if (p && p.id) productMap.set(String(p.id), p); });
        memoryProducts = Array.from(productMap.values());
        saveProductsToDisk(memoryProducts);
        return res.json(memoryProducts);
      }
    } catch (e) {
      console.warn("Supabase products fetch failed, using memory fallback:", e);
    }
  }

  return res.json(memoryProducts);
});

app.get("/api/products/:idOrSlug", async (req, res) => {
  const { idOrSlug } = req.params;
  let decoded = idOrSlug;
  try {
    decoded = decodeURIComponent(idOrSlug).toLowerCase().trim();
  } catch (e) {
    decoded = idOrSlug.toLowerCase().trim();
  }

  const found = memoryProducts.find((p) => {
    if (!p) return false;
    const pId = p.id ? String(p.id).toLowerCase().trim() : "";
    const pNameRaw = (p.name || "").toLowerCase().trim();
    return pId === decoded || pNameRaw === decoded;
  });

  if (found) {
    return res.json(found);
  }

  return res.json(memoryProducts);
});

app.post("/api/products", requireAdmin, async (req: any, res: any) => {
  const newProduct = req.body;
  if (!newProduct.id) newProduct.id = `prod-${Date.now()}`;

  const mappedNewProduct = mapSupabaseToAppProduct(newProduct) || newProduct;
  memoryProducts = [mappedNewProduct, ...memoryProducts.filter((p) => p.id !== mappedNewProduct.id)];
  saveProductsToDisk(memoryProducts);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const allImages = [newProduct.image, ...(newProduct.secondaryImages || [])].filter(Boolean);
      await supabase.from("products").upsert([
        {
          id: newProduct.id,
          name: newProduct.name,
          category_id: newProduct.categoryId || "rings",
          price: Number(newProduct.price),
          original_price: newProduct.originalPrice ? Number(newProduct.originalPrice) : null,
          points_earned: newProduct.pointsEarned ? Number(newProduct.pointsEarned) : Math.floor(Number(newProduct.price) / 100),
          stock: newProduct.stock === undefined ? 10 : Number(newProduct.stock),
          is_new: !!newProduct.isNew,
          pre_order: Boolean(newProduct.isPreOrder),
          images: allImages,
          sizes: newProduct.sizeOptions || ["Standard", "Premium"],
          materials: newProduct.materialOptions || ["#E5D5BC", "#E5E4E2"],
          description: newProduct.description || ""
        }
      ], { onConflict: "id" });
    } catch (e) {
      console.warn("Supabase product upsert notice:", e);
    }
  }

  broadcastUpdate();
  res.json(mappedNewProduct);
});

app.put("/api/products/:id", requireAdmin, async (req: any, res: any) => {
  const productId = req.params.id;
  const updated = req.body;
  const mappedUpdated = mapSupabaseToAppProduct(updated) || updated;

  memoryProducts = memoryProducts.map((p) => (p.id === productId ? mappedUpdated : p));
  saveProductsToDisk(memoryProducts);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const allImages = [updated.image, ...(updated.secondaryImages || [])].filter(Boolean);
      await supabase.from("products").update({
        name: updated.name,
        category_id: updated.categoryId,
        price: Number(updated.price),
        original_price: updated.originalPrice ? Number(updated.originalPrice) : null,
        points_earned: updated.pointsEarned ? Number(updated.pointsEarned) : Math.floor(Number(updated.price) / 100),
        stock: updated.stock === undefined ? null : Number(updated.stock),
        is_new: !!updated.isNew,
        pre_order: Boolean(updated.isPreOrder),
        images: allImages,
        sizes: updated.sizeOptions || [],
        materials: updated.materialOptions || [],
        description: updated.description || ""
      }).eq("id", productId);
    } catch (e) {
      console.warn("Supabase product update notice:", e);
    }
  }

  broadcastUpdate();
  res.json(mappedUpdated);
});

app.delete("/api/products/:id", requireAdmin, async (req: any, res: any) => {
  const productId = req.params.id;

  memoryProducts = memoryProducts.filter((p) => p.id !== productId);
  saveProductsToDisk(memoryProducts);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("products").delete().eq("id", productId);
    } catch (e) {
      // ignore
    }
  }

  broadcastUpdate();
  res.json({ success: true, deletedId: productId });
});

app.post("/api/products/clear", requireAdmin, async (req: any, res: any) => {
  await dbWriteLogAndExecute("products", "Clear All Products", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("products").delete().neq("id", "placeholder");
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json([]);
});

app.post("/api/products/reset", requireAdmin, async (req: any, res: any) => {
  await dbWriteLogAndExecute("products", "Reset Product Catalog", req, res, async () => {
    const supabase = getSupabase()!;
    await supabase.from("products").delete().neq("id", "placeholder");
    const prodRows = PRODUCTS.map(p => ({
      id: p.id,
      name: p.name,
      category_id: p.categoryId || "rings",
      price: p.price,
      original_price: p.originalPrice || null,
      points_earned: p.pointsEarned || Math.floor(p.price / 100),
      stock: p.stock === undefined ? 10 : p.stock,
      is_new: !!p.isNew,
      pre_order: Boolean(p.isPreOrder),
      images: [p.image, ...(p.secondaryImages || [])].filter(Boolean),
      sizes: p.sizeOptions || ["Standard", "Premium"],
      materials: p.materialOptions || ["#E5D5BC", "#E5E4E2"],
      description: p.description || ""
    }));
    return await supabase.from("products").insert(prodRows).select();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(PRODUCTS);
});

// ORDERS ENDPOINTS
app.get("/api/orders", async (req: any, res: any) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: "Supabase database client is not configured." });

  const { data: dbOrders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[Supabase Fetch Error] /api/orders:", error);
    return res.status(500).json({ error: error.message, details: error.details, code: error.code });
  }

  const { data: dbItems } = await supabase.from("order_items").select("*");
  const itemsMap: Record<string, any[]> = {};
  if (dbItems) {
    dbItems.forEach((item: any) => {
      if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
      itemsMap[item.order_id].push({
        product: {
          id: item.product_id || "custom-prod",
          name: item.name || "Product",
          price: Number(item.price),
          image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
          categoryId: "rings",
          categoryName: "Rings"
        },
        quantity: Number(item.quantity || 1),
        selectedSize: item.size || "Standard",
        selectedMaterial: item.material || "Gold"
      });
    });
  }

  const mapped = (dbOrders || []).map((o: any) => ({
    id: o.id,
    orderNumber: o.order_number || o.id,
    userEmail: o.email || o.user_id || "customer@vero.com",
    date: o.created_at,
    createdAt: o.created_at,
    total: Number(o.total || 0),
    status: o.status || "Processing",
    trackingStatus: o.status || "Order Placed",
    shippingName: o.shipping_name || "Customer",
    shippingEmail: o.email || o.user_id || "customer@vero.com",
    shippingAddress: typeof o.shipping_address === "string" ? o.shipping_address : (o.shipping_address?.address || "Cairo, Egypt"),
    shippingCity: o.shipping_city || "Cairo",
    shippingZip: o.shipping_zip || "11511",
    shippingPhone: o.shipping_phone || "",
    paymentMethod: o.payment_method || "cash",
    earnedPoints: Number(o.earned_points || 0),
    items: itemsMap[o.id] || []
  }));

  return res.json(mapped);
});

app.post("/api/orders", async (req: any, res: any) => {
  const newOrder = req.body;
  const orderId = newOrder.id || `order-${Date.now()}`;
  const userEmail = newOrder.shippingEmail || newOrder.userEmail || req.user?.email || "guest@vero.com";
  const userId = req.user?.userId || userEmail;

  const orderResult = await dbWriteLogAndExecute("orders", "Create Order", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("orders").insert([
      {
        id: orderId,
        order_number: orderId,
        user_id: userId,
        email: userEmail,
        shipping_name: newOrder.shippingName || newOrder.shippingAddress?.fullName || "Valued Customer",
        shipping_address: newOrder.shippingAddress?.address || newOrder.shippingAddress || "Cairo",
        shipping_city: newOrder.shippingCity || newOrder.shippingAddress?.city || "Cairo",
        shipping_zip: newOrder.shippingZip || newOrder.shippingAddress?.postalCode || "11511",
        shipping_phone: newOrder.shippingPhone || newOrder.shippingAddress?.phone || null,
        payment_method: newOrder.paymentMethod || "cash",
        payment_status: "pending",
        status: newOrder.status || "Processing",
        subtotal: Number(newOrder.subtotal || newOrder.total || 0),
        shipping_cost: Number(newOrder.shippingFee || 0),
        discount: Number(newOrder.discount || 0),
        total: Number(newOrder.total || 0),
        earned_points: Number(newOrder.earnedPoints || Math.floor(Number(newOrder.total || 0) / 100)),
        customer_notes: newOrder.shippingAddress?.notes || ""
      }
    ]).select().single();
  });

  if (res.headersSent) return;

  // Insert order items
  if (newOrder.items && newOrder.items.length > 0) {
    const supabase = getSupabase()!;
    const itemRows = newOrder.items.map((item: any) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: item.product?.id || "prod-item",
      name: item.product?.name || "Luxury Item",
      price: Number(item.product?.price || 0),
      quantity: Number(item.quantity || 1),
      size: item.selectedSize || "Standard",
      material: item.selectedMaterial || "Gold"
    }));
    await supabase.from("order_items").insert(itemRows);
  }

  broadcastUpdate();
  res.json({ ...newOrder, id: orderId });
});

app.put("/api/orders/:id", requireAdmin, async (req: any, res: any) => {
  const orderId = req.params.id;
  const updated = req.body;

  const data = await dbWriteLogAndExecute("orders", "Update Order Status", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("orders").update({ status: updated.status }).eq("id", orderId).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
});

app.delete("/api/orders/:id", requireAdmin, async (req: any, res: any) => {
  const orderId = req.params.id;

  await dbWriteLogAndExecute("orders", "Delete Order", req, res, async () => {
    const supabase = getSupabase()!;
    await supabase.from("order_items").delete().eq("order_id", orderId);
    return await supabase.from("orders").delete().eq("id", orderId);
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json({ success: true, deletedId: orderId });
});

// REVIEWS ENDPOINTS
app.get("/api/reviews", async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: "Supabase database client is not configured." });

  const { data: dbReviews, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[Supabase Fetch Error] /api/reviews:", error);
    return res.status(500).json({ error: error.message, details: error.details, code: error.code });
  }

  const { data: replies } = await supabase.from("review_replies").select("*");
  const repliesMap: Record<string, any> = {};
  if (replies) {
    replies.forEach((rep: any) => {
      repliesMap[rep.review_id] = { author: rep.author_name, comment: rep.comment };
    });
  }

  const mapped = (dbReviews || []).map((r: any) => ({
    id: r.id,
    productId: r.product_id,
    userName: r.user_name || "Customer",
    userEmail: r.user_email || "",
    userAvatar: r.user_avatar || "default",
    rating: Number(r.rating),
    title: r.title || "",
    comment: r.comment || r.review || "",
    review: r.review || r.comment || "",
    helpfulCount: Number(r.helpful_count || 0),
    verifiedPurchase: !!r.verified_purchase,
    status: r.status || "approved",
    createdAt: r.created_at,
    author: r.user_name || "Customer",
    reply: repliesMap[r.id] || null
  }));

  return res.json(mapped);
});

app.post("/api/reviews", requireAuth, async (req: any, res: any) => {
  const newReview = req.body;
  const reviewId = newReview.id || `rev-${Date.now()}`;

  const data = await dbWriteLogAndExecute("reviews", "Create Review", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("reviews").upsert([
      {
        id: reviewId,
        product_id: newReview.productId,
        user_name: newReview.userName || req.user?.name || "Customer",
        user_email: newReview.userEmail || req.user?.email || "customer@vero.com",
        user_avatar: newReview.avatar || "default",
        rating: Number(newReview.rating),
        title: newReview.title || "",
        comment: newReview.comment || newReview.review || newReview.content || "",
        helpful_count: 0,
        verified_purchase: !!newReview.verifiedPurchase,
        status: "approved"
      }
    ], { onConflict: "id" }).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
});

app.post("/api/reviews/:id/reply", requireAdmin, async (req: any, res: any) => {
  const reviewId = req.params.id;
  const { authorName, comment, reply } = req.body;

  const data = await dbWriteLogAndExecute("review_replies", "Add Review Reply", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("review_replies").upsert([
      {
        id: crypto.randomUUID(),
        review_id: reviewId,
        author_name: authorName || "VERO Executive",
        comment: comment || reply || ""
      }
    ]).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
});

app.put("/api/reviews/:id", requireAdmin, async (req: any, res: any) => {
  const reviewId = req.params.id;
  const { status, title, comment, review, rating } = req.body;
  const updates: any = {};
  if (status) updates.status = status;
  if (title) updates.title = title;
  if (comment || review) updates.comment = comment || review;
  if (rating !== undefined) updates.rating = Number(rating);

  const data = await dbWriteLogAndExecute("reviews", "Update Review", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("reviews").update(updates).eq("id", reviewId).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
});

app.post("/api/reviews/:id/helpful", async (req: any, res: any) => {
  const reviewId = req.params.id;
  const supabase = getSupabase();
  if (supabase) {
    const { data: rev } = await supabase.from("reviews").select("helpful_count").eq("id", reviewId).single();
    const currentCount = rev?.helpful_count || 0;
    await supabase.from("reviews").update({ helpful_count: currentCount + 1 }).eq("id", reviewId);
  }
  broadcastUpdate();
  res.json({ success: true });
});

app.post("/api/reviews/:id/report", async (req: any, res: any) => {
  const reviewId = req.params.id;
  const { userId, userName, reason } = req.body;
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("review_reports").insert([{
      id: crypto.randomUUID(),
      review_id: reviewId,
      reporter_email: userId || "anon",
      reporter_name: userName || "Customer",
      reason: reason || "Flagged content"
    }]);
  }
  res.json({ success: true });
});

app.delete("/api/reviews/:id", requireAuth, async (req: any, res: any) => {
  const reviewId = req.params.id;

  await dbWriteLogAndExecute("reviews", "Delete Review", req, res, async () => {
    const supabase = getSupabase()!;
    await supabase.from("review_replies").delete().eq("review_id", reviewId);
    return await supabase.from("reviews").delete().eq("id", reviewId);
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json({ success: true, deletedId: reviewId });
});

// REWARDS ENDPOINTS
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
  }
];

app.get("/api/rewards", (req, res) => {
  res.json(memoryRewards);
});

app.post("/api/rewards", requireAdmin, (req, res) => {
  const newReward = {
    id: `rew-${Date.now()}`,
    ...req.body
  };
  memoryRewards.push(newReward);
  broadcastUpdate();
  res.json(memoryRewards);
});

app.delete("/api/rewards/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  memoryRewards = memoryRewards.filter((r) => r.id !== id);
  broadcastUpdate();
  res.json(memoryRewards);
});

// PROMOS & COUPONS ENDPOINTS
app.get("/api/promos", async (req, res) => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: dbCoupons, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (!error && dbCoupons && dbCoupons.length > 0) {
        const mapped = dbCoupons.map((c: any) => ({
          id: c.id || c.code,
          code: c.code,
          discountPercent: Number(c.discount_percent),
          isActive: c.active !== false,
          description: `Save ${c.discount_percent}% on luxury catalog`
        }));
        memoryPromos = mapped;
        return res.json(mapped);
      }
    } catch (e) {
      // ignore
    }
  }

  return res.json(memoryPromos);
});

app.post("/api/promos", requireAdmin, async (req: any, res: any) => {
  const newPromo = req.body;
  const couponId = newPromo.id || `coupon-${Date.now()}`;
  const code = (newPromo.code || "SAVE10").toUpperCase();
  const discountPercent = Number(newPromo.discountPercent || 10);

  const newPromoObj = {
    id: couponId,
    code,
    discountPercent,
    isActive: newPromo.isActive !== false,
    description: `Save ${discountPercent}% on luxury catalog`
  };

  memoryPromos = [newPromoObj, ...memoryPromos.filter((p) => p.id !== couponId && p.code !== code)];

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("coupons").upsert([
        {
          id: couponId,
          code,
          discount_percent: discountPercent,
          active: newPromo.isActive !== false
        }
      ], { onConflict: "id" });
    } catch (e) {
      // ignore
    }
  }

  broadcastUpdate();
  res.json(memoryPromos);
});

app.delete("/api/promos/:id", requireAdmin, async (req: any, res: any) => {
  const promoId = req.params.id;

  memoryPromos = memoryPromos.filter((p) => p.id !== promoId && p.code !== promoId);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("coupons").delete().eq("id", promoId);
    } catch (e) {
      // ignore
    }
  }

  broadcastUpdate();
  res.json(memoryPromos);
});

// USERS MANAGEMENT ENDPOINTS
app.get("/api/users", requireAdmin, async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: "Supabase database client is not configured." });

  const { data: dbUsers, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[Supabase Fetch Error] /api/users:", error);
    return res.status(500).json({ error: error.message, details: error.details, code: error.code });
  }

  const mapped = (dbUsers || []).map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar || "default",
    role: u.role || (isVeroAdminEmail(u.email) ? "admin" : "customer"),
    tier: u.tier || "Bronze",
    loyaltyPoints: u.loyalty_points ?? 0,
    totalSpent: Number(u.total_spent ?? 0),
    joinedDate: u.created_at ? new Date(u.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  }));

  return res.json(mapped);
});

app.post("/api/users", requireAdmin, async (req: any, res: any) => {
  const newUser = req.body;
  const userId = newUser.id || `user-${Date.now()}`;

  const data = await dbWriteLogAndExecute("users", "Create/Update User Account", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("users").upsert([
      {
        id: userId,
        email: newUser.email,
        name: newUser.name || newUser.email.split("@")[0],
        avatar: newUser.avatar || "default",
        role: newUser.role || (isVeroAdminEmail(newUser.email) ? "admin" : "customer"),
        tier: newUser.tier || "Bronze",
        loyalty_points: Number(newUser.loyaltyPoints ?? 0),
        total_spent: Number(newUser.totalSpent ?? 0)
      }
    ], { onConflict: "email" }).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
});

app.put("/api/users/:id", requireAuth, async (req: any, res: any) => {
  const userId = req.params.id;
  const updates = req.body;

  const updatePayload: any = {};
  if (updates.name) updatePayload.name = updates.name;
  if (updates.avatar) updatePayload.avatar = updates.avatar;
  if (updates.tier) updatePayload.tier = updates.tier;
  if (updates.role) updatePayload.role = updates.role;
  if (updates.loyaltyPoints !== undefined) updatePayload.loyalty_points = Number(updates.loyaltyPoints);
  if (updates.totalSpent !== undefined) updatePayload.total_spent = Number(updates.totalSpent);

  const data = await dbWriteLogAndExecute("users", "Update User Account", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("users").update(updatePayload).eq("id", userId).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
});

app.delete("/api/users/clear-all", requireAdmin, async (req: any, res: any) => {
  await dbWriteLogAndExecute("users", "Clear All Customer Accounts", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("users").delete().neq("role", "admin");
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json({ success: true });
});

app.delete("/api/users/:id", requireAdmin, async (req: any, res: any) => {
  const userId = req.params.id;

  await dbWriteLogAndExecute("users", "Delete User Account", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("users").delete().eq("id", userId);
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json({ success: true, deletedId: userId });
});

// CART ENDPOINTS
app.get("/api/cart", async (req: any, res: any) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: "Supabase database client is not configured." });

  const userEmail = req.query.userEmail || req.user?.email || "guest";
  const { data, error } = await supabase.from("cart").select("*").eq("user_id", userEmail);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post("/api/cart", async (req: any, res: any) => {
  const item = req.body;
  const cartId = item.id || crypto.randomUUID();
  const userEmail = item.userId || req.user?.email || "guest";

  const data = await dbWriteLogAndExecute("cart", "Add Cart Item", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("cart").insert([
      {
        id: cartId,
        user_id: userEmail,
        product_id: item.productId,
        quantity: Number(item.quantity || 1),
        selected_size: item.selectedSize || "Standard",
        selected_material: item.selectedMaterial || "Gold"
      }
    ]).select().single();
  });

  if (res.headersSent) return;
  res.json(data);
});

app.delete("/api/cart/:id", async (req: any, res: any) => {
  const cartId = req.params.id;
  await dbWriteLogAndExecute("cart", "Remove Cart Item", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("cart").delete().eq("id", cartId);
  });
  if (res.headersSent) return;
  res.json({ success: true, deletedId: cartId });
});

// WISHLIST ENDPOINTS
app.get("/api/wishlist", async (req: any, res: any) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: "Supabase database client is not configured." });

  const userEmail = req.query.userEmail || req.user?.email || "guest";
  const { data, error } = await supabase.from("wishlist").select("*").eq("user_id", userEmail);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post("/api/wishlist", async (req: any, res: any) => {
  const item = req.body;
  const wishId = item.id || crypto.randomUUID();
  const userEmail = item.userId || req.user?.email || "guest";

  const data = await dbWriteLogAndExecute("wishlist", "Add Wishlist Item", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("wishlist").insert([
      {
        id: wishId,
        user_id: userEmail,
        product_id: item.productId
      }
    ]).select().single();
  });

  if (res.headersSent) return;
  res.json(data);
});

app.delete("/api/wishlist/:id", async (req: any, res: any) => {
  const wishId = req.params.id;
  await dbWriteLogAndExecute("wishlist", "Remove Wishlist Item", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("wishlist").delete().eq("id", wishId);
  });
  if (res.headersSent) return;
  res.json({ success: true, deletedId: wishId });
});

// NOTIFICATIONS ENDPOINTS
app.get("/api/notifications", async (req: any, res: any) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: "Supabase database client is not configured." });

  const userEmail = req.query.userEmail || req.user?.email || "guest";
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userEmail).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.put("/api/notifications/:id/read", async (req: any, res: any) => {
  const notifId = req.params.id;
  const data = await dbWriteLogAndExecute("notifications", "Mark Notification Read", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("notifications").update({ read: true }).eq("id", notifId).select().single();
  });
  if (res.headersSent) return;
  res.json(data);
});

// AUDIT LOGS ENDPOINT (ADMIN ONLY)
app.get("/api/audit-logs", requireAdmin, (req: any, res: any) => {
  const logs = getAuditLogsFromDisk();
  res.json(logs);
});

// VITE SERVER OR STATIC BUILD
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

initServer();
