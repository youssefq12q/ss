import { Router } from "express";
import { getCategories, createCategory } from "../controllers/categoryController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getCategories);
router.post("/", requireAdmin, createCategory);

export default router;
