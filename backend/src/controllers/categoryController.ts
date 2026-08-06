import { Request, Response } from "express";
import { getSupabase } from "../config/supabase";
import { dbWriteLogAndExecute } from "../database/writeLogger";
import { broadcastUpdate } from "../services/sseService";

export async function getCategories(req: Request, res: Response) {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true });
    if (!error && data && data.length > 0) {
      return res.json(data);
    }
  }
  res.json([
    { id: "rings", name: "Rings", slug: "rings" },
    { id: "bracelets", name: "Bracelets", slug: "bracelets" },
    { id: "necklaces", name: "Necklaces", slug: "necklaces" },
    { id: "earrings", name: "Earrings", slug: "earrings" }
  ]);
}

export async function createCategory(req: Request, res: Response) {
  const newCat = req.body;
  if (!newCat.id) newCat.id = newCat.slug || `cat-${Date.now()}`;

  const data = await dbWriteLogAndExecute("categories", "Create Category", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("categories").upsert([
      {
        id: newCat.id,
        name: newCat.name,
        slug: newCat.slug || newCat.id,
        image: newCat.image || null
      }
    ], { onConflict: "id" }).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
}
