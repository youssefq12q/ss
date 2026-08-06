import { Router } from "express";
import { getRewards, createReward, deleteReward, redeemReward } from "../controllers/rewardController";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware";
import { validate } from "../middleware/validationMiddleware";
import { rewardSchema, redeemRewardSchema } from "../schemas";

const router = Router();

router.get("/", getRewards);
router.post("/", requireAdmin, validate(rewardSchema), createReward);
router.delete("/:id", requireAdmin, deleteReward);
router.post("/redeem", requireAuth, validate(redeemRewardSchema), redeemReward);

export default router;
