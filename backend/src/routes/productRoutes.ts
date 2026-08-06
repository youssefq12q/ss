import { Router } from "express";
import {
  getProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
  clearProducts,
  resetProducts
} from "../controllers/productController";
import { requireAdmin } from "../middleware/authMiddleware";
import { validate } from "../middleware/validationMiddleware";
import { productSchema } from "../schemas";

const router = Router();

router.get("/", getProducts);
router.get("/:idOrSlug", getProductByIdOrSlug);
router.post("/", requireAdmin, validate(productSchema), createProduct);
router.put("/:id", requireAdmin, validate(productSchema), updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);
router.post("/clear", requireAdmin, clearProducts);
router.post("/reset", requireAdmin, resetProducts);

export default router;
