import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Product, Order, Reward, Promo, Review } from "../types";
import { productService, isSupabaseConfigured } from "../services/supabaseService";

interface ProductContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  allReviews: Review[];
  setAllReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  productRatingMap: Record<string, { sum: number; count: number }>;
  orders: Order[];
  rewards: Reward[];
  promos: Promo[];
  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchRewards: () => Promise<void>;
  fetchPromos: () => Promise<void>;
  fetchReviews: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("vero_products");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    products.find((p) => p.id === "sculpted-aurelian-ring") || products[0] || null
  );
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      let data: Product[] = [];
      if (isSupabaseConfigured()) {
        data = await productService.getProducts();
      }
      if (!data || data.length === 0) {
        const res = await fetch("/api/products");
        if (res.ok) {
          data = await res.json();
        }
      }
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
        localStorage.setItem("vero_products", JSON.stringify(data));
      }
    } catch (e) {
      console.warn("Error fetching products:", e);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOrders(data);
      }
    } catch (e) {
      console.warn("Error fetching orders:", e);
    }
  }, []);

  const fetchRewards = useCallback(async () => {
    try {
      const res = await fetch("/api/rewards");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setRewards(data);
      }
    } catch (e) {
      console.warn("Error fetching rewards:", e);
    }
  }, []);

  const fetchPromos = useCallback(async () => {
    try {
      const res = await fetch("/api/promos");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPromos(data);
      }
    } catch (e) {
      console.warn("Error fetching promos:", e);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAllReviews(data);
      }
    } catch (e) {
      console.warn("Error fetching reviews:", e);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchRewards();
    fetchPromos();
    fetchReviews();
  }, [fetchProducts, fetchOrders, fetchRewards, fetchPromos, fetchReviews]);

  useEffect(() => {
    if (!selectedProduct && products.length > 0) {
      setSelectedProduct(products.find((p) => p.id === "sculpted-aurelian-ring") || products[0] || null);
    }
  }, [products, selectedProduct]);

  const productRatingMap = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    allReviews.forEach((r) => {
      if (r.status === "approved" || !r.status) {
        if (!map[r.productId]) {
          map[r.productId] = { sum: 0, count: 0 };
        }
        map[r.productId].sum += r.rating || 5;
        map[r.productId].count += 1;
      }
    });
    return map;
  }, [allReviews]);

  return (
    <ProductContext.Provider
      value={{
        products,
        setProducts,
        selectedProduct,
        setSelectedProduct,
        quickViewProduct,
        setQuickViewProduct,
        selectedCategory,
        setSelectedCategory,
        sortBy,
        setSortBy,
        searchQuery,
        setSearchQuery,
        searchOpen,
        setSearchOpen,
        allReviews,
        setAllReviews,
        productRatingMap,
        orders,
        rewards,
        promos,
        fetchProducts,
        fetchOrders,
        fetchRewards,
        fetchPromos,
        fetchReviews,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProduct must be used within a ProductProvider");
  }
  return context;
};
