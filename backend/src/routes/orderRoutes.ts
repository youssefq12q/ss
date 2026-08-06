import { Router } from "express";
import { getOrders, createOrder, updateOrder, deleteOrder } from "../controllers/orderController";
import { requireAdmin } from "../middleware/authMiddleware";
import { validate } from "../middleware/validationMiddleware";
import { orderSchema } from "../schemas";

const router = Router();

router.get("/", getOrders);
router.post("/", validate(orderSchema), createOrder);
router.put("/:id", requireAdmin, updateOrder);
router.delete("/:id", requireAdmin, deleteOrder);

export default router;
