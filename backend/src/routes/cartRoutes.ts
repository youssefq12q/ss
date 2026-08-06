import { Router } from "express";
import { getCart, addToCart, removeFromCart } from "../controllers/cartController";
import { validate } from "../middleware/validationMiddleware";
import { cartItemSchema } from "../schemas";

const router = Router();

router.get("/", getCart);
router.post("/", validate(cartItemSchema), addToCart);
router.delete("/:id", removeFromCart);

export default router;
