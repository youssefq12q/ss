import { Router } from "express";
import { getWishlist, addToWishlist, removeFromWishlist } from "../controllers/wishlistController";
import { validate } from "../middleware/validationMiddleware";
import { wishlistItemSchema } from "../schemas";

const router = Router();

router.get("/", getWishlist);
router.post("/", validate(wishlistItemSchema), addToWishlist);
router.delete("/:id", removeFromWishlist);

export default router;
