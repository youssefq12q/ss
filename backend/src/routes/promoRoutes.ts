import { Router } from "express";
import { getPromos, createPromo, deletePromo } from "../controllers/promoController";
import { requireAdmin } from "../middleware/authMiddleware";
import { validate } from "../middleware/validationMiddleware";
import { promoSchema } from "../schemas";

const router = Router();

router.get("/", getPromos);
router.post("/", requireAdmin, validate(promoSchema), createPromo);
router.delete("/:id", requireAdmin, deletePromo);

export default router;
