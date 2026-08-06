import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, register, logout, updateProfile } from "../controllers/authController";
import { validate } from "../middleware/validationMiddleware";
import { requireAuth } from "../middleware/authMiddleware";
import { loginSchema, registerSchema, updateProfileSchema } from "../schemas";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication requests, please try again later." }
});

router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/logout", logout);
router.put("/profile", requireAuth, validate(updateProfileSchema), updateProfile);

export default router;
