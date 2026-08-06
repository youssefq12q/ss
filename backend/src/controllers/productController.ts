import { Request, Response } from "express";
import { getSupabase } from "../config/supabase";
import { dbWriteLogAndExecute } from "../database/writeLogger";
import { broadcastUpdate } from "../services/sseService";
import { slugify } from "../utils/securityUtils";
import { PRODUCTS } from "../data";
import { Product } from "../types";

export function mapSupabaseToAppProduct(p: any): Product {
  const images = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []);
  const mainImage = images[0] || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80";
  const secImages = images.slice(1);
  const origPrice = p.original_price ? Number(p.original_price) : undefined;
  const currentPrice = Number(p.price);
  let discountPct: number | undefined = undefined;
  if (origPrice && origPrice > currentPrice) {
    discountPct = Math.round(((origPrice - currentPrice) / origPrice) * 100);
  }

  const rawId = p.id ? String(p.id) : "";
  const cleanId = rawId.startsWith("custom-") ? rawId.replace(/^custom-/, "prod-") : rawId;
  const computedSlug = p.slug || slugify(p.name) || cleanId;

  return {
    id: cleanId,
    slug: computedSlug,
    name: p.name,
    categoryId: p.category_id || "rings",
    categoryName: (p.category_id || "rings").charAt(0).toUpperCase() + (p.category_id || "rings").slice(1),
    price: currentPrice,
    originalPrice: origPrice,
    discountPercent: discountPct,
    pointsEarned: p.points_earned ? Number(p.points_earned) : Math.floor(currentPrice / 100),
    image: mainImage,
    secondaryImages: secImages,
    description: p.description || "",
    tagline: p.tagline || "",
    isNew: p.is_new !== false,
    isPreOrder: !!(p.pre_order ?? p.is_pre_order ?? p.isPreOrder),
    materialOptions: Array.isArray(p.materials) && p.materials.length > 0 ? p.materials : ["#E5D5BC", "#E5E4E2"],
    sizeOptions: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ["Standard", "Premium"],
    details: Array.isArray(p.details) ? p.details : ["18k Gold Finish", "Hand-polished"],
    craftsmanship: p.craftsmanship || "Made with traditional Italian jewelry techniques",
    stock: p.stock === null || p.stock === undefined ? undefined : Number(p.stock)
  };
}

let memoryProducts: Product[] = PRODUCTS.map(mapSupabaseToAppProduct);

export async function getProducts(req: Request, res: Response) {
  const { category, search, sort, page, limit } = req.query;

  try {
    const supabase = getSupabase();
    if (supabase) {
      let query = supabase.from("products").select("*");

      if (category && typeof category === "string" && category !== "all") {
        query = query.eq("category_id", category);
      }
      if (search && typeof search === "string") {
        query = query.ilike("name", `%${search}%`);
      }
      if (sort === "price-asc") {
        query = query.order("price", { ascending: true });
      } else if (sort === "price-desc") {
        query = query.order("price", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      if (page && limit) {
        const p = Math.max(1, Number(page));
        const l = Math.max(1, Number(limit));
        query = query.range((p - 1) * l, p * l - 1);
      }

      const { data: productsData, error } = await query;
      if (!error && productsData && productsData.length > 0) {
        const mapped = productsData.map(mapSupabaseToAppProduct);
        return res.json(mapped);
      }
    }
  } catch (err: any) {
    console.warn("[Supabase Fetch Warning] /api/products:", err?.message || err);
  }

  let filtered = [...memoryProducts];
  if (category && typeof category === "string" && category !== "all") {
    filtered = filtered.filter((p) => p.categoryId === category);
  }
  if (search && typeof search === "string") {
    const term = search.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(term));
  }
  if (sort === "price-asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  }

  if (page && limit) {
    const p = Math.max(1, Number(page));
    const l = Math.max(1, Number(limit));
    filtered = filtered.slice((p - 1) * l, p * l);
  }

  return res.json(filtered);
}

export async function getProductByIdOrSlug(req: Request, res: Response) {
  const { idOrSlug } = req.params;
  if (!idOrSlug) return res.status(404).json({ error: "Product not found" });

  let rawDecoded = idOrSlug.toLowerCase().trim();
  try {
    rawDecoded = decodeURIComponent(idOrSlug).toLowerCase().trim();
  } catch (e) {
    // ignore
  }
  const targetSlug = slugify(rawDecoded);
  const sanitizedInput = rawDecoded.replace(/^custom-/, "prod-");

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: productsData, error } = await supabase.from("products").select("*");
      if (!error && productsData && productsData.length > 0) {
        const mapped = productsData.map(mapSupabaseToAppProduct);
        const found = mapped.find((p) => {
          const pId = String(p.id).toLowerCase().trim();
          const pSlug = String(p.slug || "").toLowerCase().trim();
          const pNameSlug = slugify(p.name || "");
          return (
            pId === rawDecoded ||
            pId === sanitizedInput ||
            pId === targetSlug ||
            pSlug === rawDecoded ||
            pSlug === sanitizedInput ||
            pSlug === targetSlug ||
            pNameSlug === rawDecoded ||
            pNameSlug === targetSlug
          );
        });
        if (found) return res.json(found);
      }
    }
  } catch (err: any) {
    console.warn("[Supabase Fetch Warning] /api/products/:idOrSlug:", err?.message || err);
  }

  const foundInFallback = memoryProducts.find((p) => {
    const pId = String(p.id).toLowerCase().trim();
    const pSlug = String(p.slug || "").toLowerCase().trim();
    const pNameSlug = slugify(p.name || "");
    return (
      pId === rawDecoded ||
      pId === sanitizedInput ||
      pId === targetSlug ||
      pSlug === rawDecoded ||
      pSlug === sanitizedInput ||
      pSlug === targetSlug ||
      pNameSlug === rawDecoded ||
      pNameSlug === targetSlug
    );
  });

  if (foundInFallback) return res.json(foundInFallback);

  return res.status(404).json({ error: "Product not found" });
}

export async function createProduct(req: Request, res: Response) {
  const newProduct = req.body;
  if (!newProduct.id || newProduct.id.includes("custom-")) {
    const baseSlug = slugify(newProduct.name || "prod");
    newProduct.id = `prod-${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  const cleanSlug = newProduct.slug || slugify(newProduct.name) || newProduct.id;
  newProduct.slug = cleanSlug;

  const allImages = [newProduct.image, ...(newProduct.secondaryImages || [])].filter(Boolean);

  memoryProducts = [newProduct, ...memoryProducts.filter((p) => p.id !== newProduct.id)];

  const data = await dbWriteLogAndExecute("products", "Create Product", req, res, async () => {
    const supabase = getSupabase()!;

    return await supabase.from("products").upsert([
      {
        id: newProduct.id,
        slug: cleanSlug,
        name: newProduct.name,
        category_id: newProduct.categoryId || "rings",
        price: Number(newProduct.price),
        original_price: newProduct.originalPrice ? Number(newProduct.originalPrice) : null,
        points_earned: newProduct.pointsEarned ? Number(newProduct.pointsEarned) : Math.floor(Number(newProduct.price) / 100),
        stock: newProduct.stock === undefined ? 10 : Number(newProduct.stock),
        is_new: !!newProduct.isNew,
        pre_order: Boolean(newProduct.isPreOrder),
        images: allImages,
        sizes: newProduct.sizeOptions || ["Standard", "Premium"],
        materials: newProduct.materialOptions || ["#E5D5BC", "#E5E4E2"],
        description: newProduct.description || ""
      }
    ], { onConflict: "id" }).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data && data.id ? mapSupabaseToAppProduct(data) : newProduct);
}

export async function updateProduct(req: Request, res: Response) {
  const productId = req.params.id;
  const updated = req.body;
  const allImages = [updated.image, ...(updated.secondaryImages || [])].filter(Boolean);

  memoryProducts = memoryProducts.map((p) => (p.id === productId ? { ...p, ...updated } : p));

  const data = await dbWriteLogAndExecute("products", "Update Product", req, res, async () => {
    const supabase = getSupabase()!;

    return await supabase.from("products").update({
      name: updated.name,
      category_id: updated.categoryId,
      price: Number(updated.price),
      original_price: updated.originalPrice ? Number(updated.originalPrice) : null,
      points_earned: updated.pointsEarned ? Number(updated.pointsEarned) : Math.floor(Number(updated.price) / 100),
      stock: updated.stock === undefined ? null : Number(updated.stock),
      is_new: !!updated.isNew,
      pre_order: Boolean(updated.isPreOrder),
      images: allImages,
      sizes: updated.sizeOptions || [],
      materials: updated.materialOptions || [],
      description: updated.description || ""
    }).eq("id", productId).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data && data.id ? mapSupabaseToAppProduct(data) : updated);
}

export async function deleteProduct(req: Request, res: Response) {
  const productId = req.params.id;

  memoryProducts = memoryProducts.filter((p) => p.id !== productId);

  await dbWriteLogAndExecute("products", "Delete Product", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("products").delete().eq("id", productId);
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json({ success: true, deletedId: productId });
}

export async function clearProducts(req: Request, res: Response) {
  memoryProducts = [];
  await dbWriteLogAndExecute("products", "Clear All Products", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("products").delete().neq("id", "placeholder");
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json([]);
}

export async function resetProducts(req: Request, res: Response) {
  memoryProducts = PRODUCTS.map(mapSupabaseToAppProduct);
  await dbWriteLogAndExecute("products", "Reset Product Catalog", req, res, async () => {
    const supabase = getSupabase()!;
    await supabase.from("products").delete().neq("id", "placeholder");
    const prodRows = PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      category_id: p.categoryId || "rings",
      price: p.price,
      original_price: p.originalPrice || null,
      points_earned: p.pointsEarned || Math.floor(p.price / 100),
      stock: p.stock === undefined ? 10 : p.stock,
      is_new: !!p.isNew,
      pre_order: Boolean(p.isPreOrder),
      images: [p.image, ...(p.secondaryImages || [])].filter(Boolean),
      sizes: p.sizeOptions || ["Standard", "Premium"],
      materials: p.materialOptions || ["#E5D5BC", "#E5E4E2"],
      description: p.description || ""
    }));
    return await supabase.from("products").insert(prodRows).select();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(PRODUCTS);
}
