import express from "express";
import rateLimit from "express-rate-limit";
import { isSupabaseConfigured, resolveSupabaseEnv, loadedEnvFiles } from "./config/env";
import { handleSseConnection } from "./services/sseService";
import { seedSupabaseDatabase } from "./database/seeder";
import { errorHandler } from "./middleware/errorMiddleware";

import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import orderRoutes from "./routes/orderRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import rewardRoutes from "./routes/rewardRoutes";
import promoRoutes from "./routes/promoRoutes";
import userRoutes from "./routes/userRoutes";
import cartRoutes from "./routes/cartRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import auditLogRoutes from "./routes/auditLogRoutes";

export function createApp() {
  const app = express();

  // Trust reverse proxy for client IP detection in rate limiting
  app.set("trust proxy", 1);

  // Reduced default body limit to 1MB for security & performance
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Global Rate Limiter
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again later." }
  });
  app.use("/api", globalLimiter);

  // Log startup diagnostics internally
  const initialEnv = resolveSupabaseEnv();
  const initialConfigured = isSupabaseConfigured();
  console.log(`=======================================================`);
  console.log(`[Express Backend Startup Diagnostic]`);
  console.log(`Loaded Env Files: ${loadedEnvFiles.join(", ") || "None"}`);
  console.log(`Resolved Supabase URL: ${initialEnv.url || "MISSING"}`);
  console.log(`Resolved Supabase Key: ${initialEnv.key ? "PRESENT (" + initialEnv.key.length + " chars)" : "MISSING"}`);
  if (initialConfigured) {
    console.log(`Status: ✅ Supabase Live Database Connection ACTIVE`);
  } else {
    console.warn(`Status: ⚠️ Demo Mode Active`);
  }
  console.log(`=======================================================`);

  // Auto seed database if configured
  seedSupabaseDatabase();

  // Health endpoint (safe, non-sensitive)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", supabaseConfigured: isSupabaseConfigured() });
  });

  // Real-Time SSE
  app.get("/api/updates", handleSseConnection);

  // Mount API modules
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/rewards", rewardRoutes);
  app.use("/api/promos", promoRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/audit-logs", auditLogRoutes);

  // Centralized Error Middleware
  app.use(errorHandler);

  return app;
}
