import { Product } from "../types";

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getProductIdentifier(product: Product): string {
  if (!product) return "product";
  
  // 1. Prefer explicit stored slug if valid and not a temporary custom- ID
  if (product.slug && typeof product.slug === "string" && !product.slug.includes("custom-")) {
    return product.slug;
  }

  // 2. Use real database ID if it exists and is not a temporary custom- ID
  if (product.id && typeof product.id === "string" && !product.id.includes("custom-") && !product.id.includes(" ")) {
    return product.id;
  }

  // 3. Fallback to slugified product name if available
  const nameSlug = slugify(product.name);
  if (nameSlug) {
    return nameSlug;
  }

  // 4. Sanitize legacy custom- IDs if present
  if (product.id && typeof product.id === "string") {
    const sanitized = product.id.replace(/^custom-/, "prod-");
    if (sanitized && !sanitized.includes("custom-")) {
      return sanitized;
    }
  }

  return "product";
}

export function findProductByIdOrSlug(products: Product[], idOrSlug: string): Product | undefined {
  if (!idOrSlug || !products || products.length === 0) return undefined;

  let rawDecoded = idOrSlug.toLowerCase().trim();
  try {
    rawDecoded = decodeURIComponent(idOrSlug).toLowerCase().trim();
  } catch (e) {
    // ignore malformed URI
  }

  const targetSlug = slugify(rawDecoded);
  const sanitizedInput = rawDecoded.replace(/^custom-/, "prod-");

  return products.find((p) => {
    if (!p) return false;
    const pId = p.id ? String(p.id).toLowerCase().trim() : "";
    const pSlug = p.slug ? String(p.slug).toLowerCase().trim() : "";
    const pNameSlug = slugify(p.name || "");
    const sanitizedPId = pId.replace(/^custom-/, "prod-");

    return (
      pId === rawDecoded ||
      pId === sanitizedInput ||
      pId === targetSlug ||
      pSlug === rawDecoded ||
      pSlug === sanitizedInput ||
      pSlug === targetSlug ||
      pNameSlug === rawDecoded ||
      pNameSlug === targetSlug ||
      sanitizedPId === rawDecoded ||
      sanitizedPId === sanitizedInput
    );
  });
}
