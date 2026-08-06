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
  if (!product) return "";
  if (product.id && !product.id.includes(" ")) {
    return product.id;
  }
  return slugify(product.name) || product.id || "product";
}

export function findProductByIdOrSlug(products: Product[], idOrSlug: string): Product | undefined {
  if (!idOrSlug || !products || products.length === 0) return undefined;

  const decoded = decodeURIComponent(idOrSlug).toLowerCase().trim();
  const targetSlug = slugify(decoded);

  return products.find((p) => {
    if (!p) return false;
    const pId = p.id ? String(p.id).toLowerCase().trim() : "";
    const pNameSlug = slugify(p.name || "");

    return (
      pId === decoded ||
      pId === targetSlug ||
      pNameSlug === decoded ||
      pNameSlug === targetSlug
    );
  });
}
