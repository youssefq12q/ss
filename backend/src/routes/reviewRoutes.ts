import { Router } from "express";
import {
  getReviews,
  createReview,
  replyReview,
  updateReview,
  markHelpful,
  reportReview,
  deleteReview
} from "../controllers/reviewController";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware";
import { validate } from "../middleware/validationMiddleware";
import { reviewSchema, replyReviewSchema, reportReviewSchema } from "../schemas";

const router = Router();

router.get("/", getReviews);
router.post("/", requireAuth, validate(reviewSchema), createReview);
router.post("/:id/reply", requireAdmin, validate(replyReviewSchema), replyReview);
router.put("/:id", requireAdmin, updateReview);
router.post("/:id/helpful", markHelpful);
router.post("/:id/report", validate(reportReviewSchema), reportReview);
router.delete("/:id", requireAdmin, deleteReview);

export default router;
