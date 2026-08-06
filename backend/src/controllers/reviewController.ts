import crypto from "crypto";
import { Request, Response } from "express";
import { getSupabase } from "../config/supabase";
import { dbWriteLogAndExecute } from "../database/writeLogger";
import { broadcastUpdate } from "../services/sseService";
import { PRODUCTS } from "../data";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function getReviews(req: Request, res: Response) {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: dbReviews, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (!error && dbReviews) {
        let repliesMap: Record<string, any> = {};
        try {
          const { data: replies } = await supabase.from("review_replies").select("*");
          if (replies) {
            replies.forEach((rep: any) => {
              repliesMap[rep.review_id] = { author: rep.author_name, comment: rep.comment };
            });
          }
        } catch {
          // ignore reply fetch error
        }

        const mapped = dbReviews.map((r: any) => ({
          id: r.id,
          productId: r.product_id,
          userName: r.user_name || "Customer",
          userEmail: r.user_email || "",
          userAvatar: r.user_avatar || "default",
          rating: Number(r.rating),
          title: r.title || "",
          comment: r.comment || "",
          helpfulCount: Number(r.helpful_count || 0),
          verifiedPurchase: !!r.verified_purchase,
          status: r.status || "approved",
          createdAt: r.created_at,
          author: r.user_name || "Customer",
          reply: repliesMap[r.id] || null
        }));

        return res.json(mapped);
      }
    }
  } catch (err: any) {
    console.warn("[Supabase Fetch Warning] /api/reviews:", err?.message || err);
  }

  return res.json([
    {
      id: "rev-1",
      productId: PRODUCTS[0]?.id || "prod-royal-emerald-ring",
      userName: "Eleanor Vance",
      userEmail: "eleanor@example.com",
      userAvatar: "default",
      rating: 5,
      title: "Exquisite Craftsmanship",
      comment: "The emerald cut diamond catches the light beautifully. Superb quality!",
      helpfulCount: 12,
      verifiedPurchase: true,
      status: "approved",
      createdAt: new Date().toISOString(),
      author: "Eleanor Vance",
      reply: null
    }
  ]);
}

export async function createReview(req: AuthenticatedRequest, res: Response) {
  const newReview = req.body;
  const reviewId = newReview.id || `rev-${Date.now()}`;

  const data = await dbWriteLogAndExecute("reviews", "Create Review", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("reviews").upsert([
      {
        id: reviewId,
        product_id: newReview.productId,
        user_name: newReview.userName || req.user?.name || "Customer",
        user_email: newReview.userEmail || req.user?.email || "customer@vero.com",
        user_avatar: newReview.avatar || "default",
        rating: Number(newReview.rating),
        title: newReview.title || "",
        comment: newReview.comment || newReview.review || "",
        helpful_count: 0,
        verified_purchase: !!newReview.verifiedPurchase,
        status: "approved"
      }
    ], { onConflict: "id" }).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
}

export async function replyReview(req: Request, res: Response) {
  const reviewId = req.params.id;
  const { authorName, adminName, reply, comment } = req.body;

  const data = await dbWriteLogAndExecute("review_replies", "Add Review Reply", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("review_replies").upsert([
      {
        id: crypto.randomUUID(),
        review_id: reviewId,
        author_name: adminName || authorName || "VERO Executive",
        comment: reply || comment || ""
      }
    ]).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
}

export async function updateReview(req: Request, res: Response) {
  const reviewId = req.params.id;
  const { status, title, comment, rating } = req.body;
  const updates: Record<string, any> = {};
  if (status) updates.status = status;
  if (title) updates.title = title;
  if (comment) updates.comment = comment;
  if (rating !== undefined) updates.rating = Number(rating);

  const data = await dbWriteLogAndExecute("reviews", "Update Review", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("reviews").update(updates).eq("id", reviewId).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
}

export async function markHelpful(req: Request, res: Response) {
  const reviewId = req.params.id;
  const supabase = getSupabase();
  if (supabase) {
    const { data: rev } = await supabase.from("reviews").select("helpful_count").eq("id", reviewId).single();
    const currentCount = rev?.helpful_count || 0;
    await supabase.from("reviews").update({ helpful_count: currentCount + 1 }).eq("id", reviewId);
  }
  broadcastUpdate();
  res.json({ success: true });
}

export async function reportReview(req: Request, res: Response) {
  const reviewId = req.params.id;
  const { userId, userName, reason, details } = req.body;
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("review_reports").insert([{
      id: crypto.randomUUID(),
      review_id: reviewId,
      reporter_email: userId || "anon",
      reporter_name: userName || "Customer",
      reason: reason || "Flagged content",
      details: details || null
    }]);
  }
  res.json({ success: true });
}

export async function deleteReview(req: Request, res: Response) {
  const reviewId = req.params.id;

  await dbWriteLogAndExecute("reviews", "Delete Review", req, res, async () => {
    const supabase = getSupabase()!;
    await supabase.from("review_replies").delete().eq("review_id", reviewId);
    return await supabase.from("reviews").delete().eq("id", reviewId);
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json({ success: true, deletedId: reviewId });
}
