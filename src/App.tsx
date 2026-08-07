import React from "react";
import {
  Heart,
  ShoppingBag,
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Minus,
  Sparkles,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Award,
  Gem,
  Check,
  Trash2,
  SlidersHorizontal,
  Info,
  ExternalLink,
  Truck,
  Clock,
  Star,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Product, CartItem, UserProfile, getTierFromSpent, Order, Reward, Promo, Review } from "./types";
import { CATEGORIES, PRODUCTS, STORIES } from "./data";
import { safeFetch } from "./utils/apiUtils";

// Subcomponents
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileNav from "./components/MobileNav";
import ProductCard from "./components/ProductCard";
import QuickViewModal from "./components/QuickViewModal";
import BrandPillars from "./components/BrandPillars";
import CheckoutFlow from "./components/CheckoutFlow";
import AdminPanel from "./components/AdminPanel";
import OrderTrackingView from "./components/OrderTrackingView";
import AuthModal from "./components/AuthModal";
import WelcomeBonusModal from "./components/WelcomeBonusModal";
import SupabasePlayground from "./components/SupabasePlayground";
import ProductReviewsSection from "./components/ProductReviewsSection";
import PriceDisplay from "./components/PriceDisplay";
import PreOrderModal from "./components/PreOrderModal";
import ProductDetailsPage from "./components/ProductDetailsPage";
import { getProductIdentifier } from "./utils/slugUtils";
import { isSupabaseConfigured, supabase, cartService, wishlistService, authService } from "./services/supabaseService";


const LOUNGE_PRODUCTS: Product[] = [];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation & Page state
  const [activeTab, setActiveTab] = React.useState<string>("home"); // 'home', 'shop', 'product-detail', 'favorites', 'bag', 'our-story'

  // Sync location pathname to activeTab state
  React.useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/product/")) {
      setActiveTab("product-detail");
    } else if (path === "/shop") {
      setActiveTab("shop");
    } else if (path === "/our-story") {
      setActiveTab("our-story");
    } else if (path === "/favorites") {
      setActiveTab("favorites");
    } else if (path === "/bag") {
      setActiveTab("bag");
    } else if (path === "/tracking" || path === "/track") {
      setActiveTab("tracking");
    } else if (path === "/admin") {
      setActiveTab("admin");
    } else if (path === "/supabase") {
      setActiveTab("supabase");
    } else if (path === "/platinum-lounge") {
      setActiveTab("platinum-lounge");
    } else {
      setActiveTab("home");
    }
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (tab === "home") navigate("/");
    else if (tab === "shop") navigate("/shop");
    else if (tab === "our-story") navigate("/our-story");
    else if (tab === "favorites") navigate("/favorites");
    else if (tab === "bag") navigate("/bag");
    else if (tab === "tracking" || tab === "track") navigate("/tracking");
    else if (tab === "admin") navigate("/admin");
    else if (tab === "supabase") navigate("/supabase");
    else if (tab === "platinum-lounge") navigate("/platinum-lounge");
    else if (tab !== "product-detail") navigate("/" + tab);
  };

  // Order tracking states
  const [trackInput, setTrackInput] = React.useState<string>("");
  const [trackedOrder, setTrackedOrder] = React.useState<Order | null>(null);
  const [trackError, setTrackError] = React.useState<string | null>(null);
  const [ordersVersion, setOrdersVersion] = React.useState<number>(0);

  // Rating & Support Modals State for Tracked Order
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [isPreOrderModalOpen, setIsPreOrderModalOpen] = React.useState(false);
  const [preOrderProduct, setPreOrderProduct] = React.useState<Product | null>(null);
  const [showSupportModal, setShowSupportModal] = React.useState(false);
  const [ratingStars, setRatingStars] = React.useState(5);
  const [ratingComment, setRatingComment] = React.useState("");
  const [supportMessage, setSupportMessage] = React.useState("");
  const [ratingSubmitted, setRatingSubmitted] = React.useState(false);
  const [supportSubmitted, setSupportSubmitted] = React.useState(false);

  // Private Member Auth states
  const [user, setUser] = React.useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("vero_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [showWelcomeBonusModal, setShowWelcomeBonusModal] = React.useState(false);

  // Elite Club Welcome Screen States
  const [showGoldWelcome, setShowGoldWelcome] = React.useState(false);
  const [welcomeTier, setWelcomeTier] = React.useState<string>("");
  const welcomedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (user && (user.tier === "Gold" || user.tier === "Platinum" || user.tier === "Diamond")) {
      if (welcomedRef.current !== user.email) {
        setShowGoldWelcome(true);
        setWelcomeTier(user.tier);
        welcomedRef.current = user.email;
        const timer = setTimeout(() => {
          setShowGoldWelcome(false);
        }, 4000);
        return () => clearTimeout(timer);
      }
    } else if (!user) {
      welcomedRef.current = null;
    }
  }, [user]);

  React.useEffect(() => {
    if ((activeTab === "admin" || activeTab === "supabase") && user?.role !== "admin" && user?.email?.toLowerCase() !== "vero2026@vero.com") {
      setActiveTab("home");
    }
  }, [activeTab, user]);

  const handleLoginSuccess = async (profile: UserProfile, isFirstLoginWithBonus?: boolean) => {
    setUser(profile);
    localStorage.setItem("vero_user", JSON.stringify(profile));
    if (profile.sessionToken) {
      localStorage.setItem("vero_session_token", profile.sessionToken);
    }

    // Determine if welcome bonus modal should pop up
    const userKey = profile.id || profile.email;
    const bonusShownKey = `vero_welcome_bonus_shown_${userKey}`;
    const alreadyShownInStorage = localStorage.getItem(bonusShownKey);

    if ((isFirstLoginWithBonus || !alreadyShownInStorage) && profile.hasReceivedWelcomeBonus) {
      setShowWelcomeBonusModal(true);
      localStorage.setItem(bonusShownKey, "true");
    }

    if (isSupabaseConfigured() && profile.email) {
      try {
        const { data: { user: authUser } } = await supabase!.auth.getUser();
        if (authUser) {
          const dbCart = await cartService.getCart(authUser.id);
          if (dbCart && dbCart.length > 0) {
            setCart(dbCart);
          }
          const dbWishlist = await wishlistService.getWishlist(authUser.id);
          if (dbWishlist && dbWishlist.length > 0) {
            setFavorites(dbWishlist);
          }
        }
      } catch (e) {
        console.error("Error loading user data from Supabase:", e);
      }
    }
  };

  const handleUpdateUser = async (updatedProfile: UserProfile) => {
    // Dynamically calculate tier based on totalSpent according to user request
    const spent = updatedProfile.totalSpent || 0;
    const finalTier = getTierFromSpent(spent);

    const resolvedProfile: UserProfile = {
      ...updatedProfile,
      tier: finalTier
    };

    setUser(resolvedProfile);
    localStorage.setItem("vero_user", JSON.stringify(resolvedProfile));

    // Synchronize profile changes to backend server
    if (resolvedProfile.email) {
      try {
        fetch("/api/auth/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: resolvedProfile.email,
            loyaltyPoints: resolvedProfile.loyaltyPoints,
            totalSpent: resolvedProfile.totalSpent,
            tier: resolvedProfile.tier,
            name: resolvedProfile.name,
            avatar: resolvedProfile.avatar
          })
        }).catch(err => console.error("Server profile sync error:", err));
      } catch (e) {
        // ignore
      }
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: { user: authUser } } = await supabase!.auth.getUser();
        if (authUser) {
          await authService.updateProfile(authUser.id, resolvedProfile);
        }
      } catch (e) {
        console.error("Error updating profile in Supabase:", e);
      }
    }
    
    // Also update in website accounts if registered
    if (resolvedProfile.provider === "email") {
      const savedAccountsStr = localStorage.getItem("vero_website_accounts");
      if (savedAccountsStr) {
        try {
          const accounts = JSON.parse(savedAccountsStr);
          const emailKey = resolvedProfile.email.toLowerCase();
          if (accounts[emailKey]) {
            accounts[emailKey] = {
              ...accounts[emailKey],
              name: resolvedProfile.name,
              tier: resolvedProfile.tier,
              avatar: resolvedProfile.avatar,
              loyaltyPoints: resolvedProfile.loyaltyPoints,
              totalSpent: resolvedProfile.totalSpent,
              redeemedRewards: resolvedProfile.redeemedRewards
            };
            localStorage.setItem("vero_website_accounts", JSON.stringify(accounts));
          }
        } catch (e) {
          // ignore
        }
      }
    }
  };

  const handleLogout = () => {
    const token = localStorage.getItem("vero_session_token");
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "X-Session-Token": token }
      }).catch(() => {});
    }
    setUser(null);
    localStorage.removeItem("vero_user");
    localStorage.removeItem("vero_session_token");
    setCart([]);
    setFavorites([]);
    if (activeTab === "admin" || activeTab === "supabase") {
      setActiveTab("home");
    }
    if (isSupabaseConfigured()) {
      authService.signOut().catch(console.error);
    }
  };

  // Dynamic products list with server database integration
  const [products, setProductsState] = React.useState<Product[]>(() => {
    const saved = localStorage.getItem("vero_products");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return PRODUCTS;
  });

  const productsRef = React.useRef(products);
  React.useEffect(() => {
    productsRef.current = products;
    try {
      localStorage.setItem("vero_products", JSON.stringify(products));
    } catch (e) {
      // ignore
    }
  }, [products]);

  // Intercept state changes and synchronize with the backend Express server securely
  const setProducts: React.Dispatch<React.SetStateAction<Product[]>> = (value) => {
    const currentProducts = productsRef.current;
    // 1. Calculate the next products array
    let next: Product[];
    if (typeof value === "function") {
      next = (value as Function)(currentProducts);
    } else {
      next = value;
    }

    // 2. Optimistically update client state immediately
    setProductsState(next);
    try {
      localStorage.setItem("vero_products", JSON.stringify(next));
    } catch (e) {
      // ignore
    }

    // 3. Perform background API sync to persist to server disk
    const syncWithServer = async () => {
      try {
        const token = localStorage.getItem("vero_session_token");
        const savedUserStr = localStorage.getItem("vero_user");
        let userEmail = "vero2026@vero.com";
        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr);
            if (parsed.email) userEmail = parsed.email;
          } catch (e) {
            // ignore
          }
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-User-Email": userEmail,
          ...(token ? { "Authorization": `Bearer ${token}`, "X-Session-Token": token } : {})
        };

        if (next.length < currentProducts.length) {
          // Delete product
          const removed = currentProducts.find((p) => !next.some((n) => n.id === p.id));
          if (removed) {
            const res = await fetch(`/api/products/${removed.id}`, {
              method: "DELETE",
              headers,
            });
            if (res.ok) {
              const serverProducts = await res.json();
              if (Array.isArray(serverProducts)) {
                setProductsState(serverProducts);
                localStorage.setItem("vero_products", JSON.stringify(serverProducts));
              }
            }
          }
        } else if (next.length > currentProducts.length) {
          // Add product
          const added = next.find((n) => !currentProducts.some((p) => p.id === n.id));
          if (added) {
            const res = await fetch("/api/products", {
              method: "POST",
              headers,
              body: JSON.stringify(added),
            });
            if (res.ok) {
              const serverRes = await res.json();
              if (Array.isArray(serverRes)) {
                setProductsState(serverRes);
                localStorage.setItem("vero_products", JSON.stringify(serverRes));
              } else if (serverRes && serverRes.id) {
                setProductsState((prev) => {
                  const updated = [serverRes, ...prev.filter((p) => p.id !== serverRes.id)];
                  localStorage.setItem("vero_products", JSON.stringify(updated));
                  return updated;
                });
              }
            } else {
              console.error("Server product addition error:", res.status, await res.text());
            }
          }
        } else {
          // Edit or Badge status toggle
          let modified: Product | null = null;
          for (let i = 0; i < next.length; i++) {
            const prevItem = currentProducts.find((p) => p.id === next[i].id);
            if (prevItem && JSON.stringify(prevItem) !== JSON.stringify(next[i])) {
              modified = next[i];
              break;
            }
          }
          if (modified) {
            const res = await fetch(`/api/products/${modified.id}`, {
              method: "PUT",
              headers,
              body: JSON.stringify(modified),
            });
            if (res.ok) {
              const serverRes = await res.json();
              if (Array.isArray(serverRes)) {
                setProductsState(serverRes);
                localStorage.setItem("vero_products", JSON.stringify(serverRes));
              } else if (serverRes && serverRes.id) {
                setProductsState((prev) => {
                  const updated = prev.map((p) => (p.id === serverRes.id ? serverRes : p));
                  localStorage.setItem("vero_products", JSON.stringify(updated));
                  return updated;
                });
              }
            } else {
              console.error("Server product edit error:", res.status, await res.text());
            }
          }
        }
      } catch (err) {
        console.error("Error syncing product changes to backend:", err);
      }
    };

    syncWithServer();
  };

  // Orders State
  const [orders, setOrders] = React.useState<Order[]>([]);
  // Rewards State
  const [rewards, setRewards] = React.useState<Reward[]>([]);
  // Promos State
  const [promos, setPromos] = React.useState<Promo[]>([]);
  // Reviews State
  const [allReviews, setAllReviews] = React.useState<Review[]>([]);

  const fetchReviews = React.useCallback(async () => {
    try {
      const res = await safeFetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        setAllReviews(data);
      }
    } catch (err) {
      console.error("Error fetching reviews from server:", err);
    }
  }, []);

  const productRatingMap = React.useMemo(() => {
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

  const fetchOrders = React.useCallback(async () => {
    try {
      const res = await safeFetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Error fetching orders from server:", err);
    }
  }, []);

  const fetchRewards = React.useCallback(async () => {
    try {
      const res = await safeFetch("/api/rewards");
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
      }
    } catch (err) {
      console.error("Error fetching rewards from server:", err);
    }
  }, []);

  const fetchPromos = React.useCallback(async () => {
    try {
      const res = await safeFetch("/api/promos");
      if (res.ok) {
        const data = await res.json();
        setPromos(data);
      }
    } catch (err) {
      console.error("Error fetching promos from server:", err);
    }
  }, []);

  const fetchProducts = React.useCallback(async () => {
    try {
      const res = await safeFetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProductsState((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
            return data;
          });
          try {
            localStorage.setItem("vero_products", JSON.stringify(data));
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error("Error fetching products from server:", err);
    }
  }, []);

  // Real-time EventSource listener
  React.useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchRewards();
    fetchPromos();
    fetchReviews();

    // Fallback polling in case of connection drop
    const interval = setInterval(() => {
      fetchProducts();
      fetchOrders();
      fetchRewards();
      fetchPromos();
      fetchReviews();
    }, 10000);

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;
    let retryCount = 0;
    const maxRetries = 2;

    const connectSSE = () => {
      if (retryCount >= maxRetries) {
        return;
      }
      eventSource = new EventSource("/api/updates");

      eventSource.onmessage = (event) => {
        if (event.data === "REFRESH") {
          fetchProducts();
          fetchOrders();
          fetchRewards();
          fetchPromos();
          fetchReviews();
        }
      };

      eventSource.onerror = () => {
        retryCount++;
        if (eventSource) eventSource.close();
        if (retryCount < maxRetries) {
          reconnectTimeout = setTimeout(connectSSE, 5000);
        }
      };
    };

    connectSSE();

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [fetchProducts, fetchOrders, fetchRewards, fetchPromos]);

  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    products.find((p) => p.id === "sculpted-aurelian-ring") || products[0]
  );

  // Keep selectedProduct object in sync with incoming server edits
  React.useEffect(() => {
    if (selectedProduct) {
      const updated = products.find((p) => p.id === selectedProduct.id);
      if (!updated) {
        // The selected product was deleted! Default to the first available product.
        if (products.length > 0) {
          setSelectedProduct(products[0]);
        } else {
          setSelectedProduct(null);
        }
      } else if (JSON.stringify(updated) !== JSON.stringify(selectedProduct)) {
        setSelectedProduct(updated);
      }
    } else if (products.length > 0) {
      setSelectedProduct(products[0]);
    }
  }, [products, selectedProduct]);

  // Cart & Favorites state loaded from localStorage if exists
  const [cart, setCart] = React.useState<CartItem[]>(() => {
    localStorage.removeItem("vero_cart");
    return [];
  });

  const [favorites, setFavorites] = React.useState<string[]>(() => {
    const saved = localStorage.getItem("vero_favorites");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return ["sculpted-aurelian-ring", "baguette-solitaire", "trinity-stack"];
  });

  // Search slider & filter states
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("default"); // 'default', 'price-asc', 'price-desc', 'name-asc'
  
  // Modals & Panels
  const [quickViewProduct, setQuickViewProduct] = React.useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  
  // Promo code & calculation states
  const [promoInput, setPromoInput] = React.useState("");
  const [activePromo, setActivePromo] = React.useState("");
  const [promoError, setPromoError] = React.useState("");
  const [promoSuccess, setPromoSuccess] = React.useState("");

  // App-wide toast notification state
  const [appNotification, setAppNotification] = React.useState<string | null>(null);
  const triggerAppNotification = (msg: string) => {
    setAppNotification(msg);
    setTimeout(() => {
      setAppNotification((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Product detail active secondary photo swap state
  const [activeDetailImage, setActiveDetailImage] = React.useState<string>("");

  // Accordion draws on product detail page
  const [accordionOpen, setAccordionOpen] = React.useState({
    details: true,
    craftsmanship: false,
  });

  // Sync state with localStorage and Supabase
  React.useEffect(() => {
    localStorage.setItem("vero_cart", JSON.stringify(cart));
    if (isSupabaseConfigured() && user) {
      supabase!.auth.getUser().then(({ data: { user: authUser } }) => {
        if (authUser) {
          cartService.syncCart(authUser.id, cart).catch(console.error);
        }
      });
    }
  }, [cart, user]);

  React.useEffect(() => {
    localStorage.setItem("vero_favorites", JSON.stringify(favorites));
    if (isSupabaseConfigured() && user) {
      supabase!.auth.getUser().then(({ data: { user: authUser } }) => {
        if (authUser) {
          supabase!.from("wishlist").delete().eq("user_id", authUser.id).then(() => {
            if (favorites.length > 0) {
              const rows = favorites.map(id => ({ user_id: authUser.id, product_id: id }));
              supabase!.from("wishlist").insert(rows).then(
                () => {},
                (err) => console.error("Error syncing wishlist:", err)
              );
            }
          });
        }
      });
    }
  }, [favorites, user]);

  React.useEffect(() => {
    localStorage.setItem("vero_products", JSON.stringify(products));
  }, [products]);

  React.useEffect(() => {
    if (isSupabaseConfigured()) {
      // 1. Initial active session check against Supabase Auth
      supabase!.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          let profile = await authService.getProfile(session.user.id);
          if (!profile) {
            profile = await authService.ensureProfile({
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name
            });
          }
          if (profile) {
            setUser({ ...profile, sessionToken: session.access_token });
            localStorage.setItem("vero_user", JSON.stringify(profile));
            localStorage.setItem("vero_session_token", session.access_token);
          }
        } else {
          // Clear any unverified cached session
          setUser(null);
          localStorage.removeItem("vero_user");
          localStorage.removeItem("vero_session_token");
        }
      }).catch((err) => {
        console.error("Supabase Auth session verification error:", err);
      });

      // 2. Auth state change subscription
      const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {
        if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
          let profile = await authService.getProfile(session.user.id);
          if (!profile) {
            profile = await authService.ensureProfile({
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name
            });
          }
          if (profile) {
            setUser({ ...profile, sessionToken: session.access_token });
            localStorage.setItem("vero_user", JSON.stringify(profile));
            localStorage.setItem("vero_session_token", session.access_token);
            
            // Sync cart & favorites
            const dbCart = await cartService.getCart(session.user.id);
            if (dbCart && dbCart.length > 0) {
              setCart(dbCart);
            }
            const dbWishlist = await wishlistService.getWishlist(session.user.id);
            if (dbWishlist && dbWishlist.length > 0) {
              setFavorites(dbWishlist);
            }
          }
        } else if (event === "SIGNED_OUT" || !session) {
          setUser(null);
          localStorage.removeItem("vero_user");
          localStorage.removeItem("vero_session_token");
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleResetDatabase = async () => {
    localStorage.removeItem("vero_products");
    try {
      const res = await fetch("/api/products/reset", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setProductsState(data);
      } else {
        setProductsState(PRODUCTS);
      }
    } catch (err) {
      console.error("Error resetting catalog on server:", err);
      setProductsState(PRODUCTS);
    }
  };

  // Sync main image on product details whenever selected product changes
  React.useEffect(() => {
    if (selectedProduct) {
      setActiveDetailImage(selectedProduct.image);
    }
  }, [selectedProduct]);

  // Cart operations
  const handleAddToBag = (product: Product, material: string, size: string, quantity = 1) => {
    if (product.isPreOrder) {
      setPreOrderProduct(product);
      setIsPreOrderModalOpen(true);
      return;
    }

    const latestProduct = products.find((p) => p.id === product.id) || product;
    const stockLimit = latestProduct.stock;

    if (stockLimit !== undefined) {
      if (stockLimit === 0) {
        triggerAppNotification(`عذراً، هذا المنتج غير متوفر حالياً بالمخزن! / Sorry, this item is out of stock!`);
        return;
      }
    }

    const cartItemId = `${product.id}_${material}_${size}`;
    let exceededStock = false;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === cartItemId);
      const otherItemsOfProduct = prevCart.filter((item) => item.product.id === product.id && item.id !== cartItemId);
      const otherQty = otherItemsOfProduct.reduce((sum, item) => sum + item.quantity, 0);

      if (existing) {
        const proposedQty = existing.quantity + quantity;
        if (stockLimit !== undefined && proposedQty + otherQty > stockLimit) {
          exceededStock = true;
          const allowedQty = Math.max(0, stockLimit - otherQty);
          if (allowedQty === existing.quantity) {
            return prevCart;
          }
          return prevCart.map((item) =>
            item.id === cartItemId
              ? { ...item, quantity: allowedQty }
              : item
          );
        }
        return prevCart.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: proposedQty }
            : item
        );
      } else {
        if (stockLimit !== undefined && quantity + otherQty > stockLimit) {
          exceededStock = true;
          const allowedQty = Math.max(0, stockLimit - otherQty);
          if (allowedQty <= 0) {
            return prevCart;
          }
          return [...prevCart, { id: cartItemId, product, quantity: allowedQty, selectedMaterial: material, selectedSize: size }];
        }
        return [...prevCart, { id: cartItemId, product, quantity, selectedMaterial: material, selectedSize: size }];
      }
    });

    if (exceededStock && stockLimit !== undefined) {
      triggerAppNotification(`عذراً، تم تحديد الكمية لتتناسب مع المخزن المتوفر (${stockLimit} قطع)! / Sorry, quantity limited to available stock (${stockLimit} items)!`);
    } else {
      triggerAppNotification(`تمت إضافة "${product.name}" إلى حقيبتك! / "${product.name}" added to your bag!`);
    }
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    let exceededStock = false;
    let limitAmount = 0;

    setCart((prevCart) => {
      const targetItem = prevCart.find((item) => item.id === itemId);
      if (!targetItem) return prevCart;

      const latestProduct = products.find((p) => p.id === targetItem.product.id) || targetItem.product;
      const stockLimit = latestProduct.stock;

      if (stockLimit !== undefined) {
        const otherItems = prevCart.filter((item) => item.product.id === latestProduct.id && item.id !== itemId);
        const otherQty = otherItems.reduce((sum, item) => sum + item.quantity, 0);
        const newQty = targetItem.quantity + delta;

        if (newQty + otherQty > stockLimit) {
          exceededStock = true;
          limitAmount = stockLimit;
          const allowedQty = Math.max(1, stockLimit - otherQty);
          return prevCart.map((item) =>
            item.id === itemId ? { ...item, quantity: allowedQty } : item
          );
        }
      }

      return prevCart.map((item) => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty < 1 ? 1 : newQty };
        }
        return item;
      });
    });

    if (exceededStock) {
      triggerAppNotification(`عذراً، لقد وصلت للحد الأقصى للمخزن المتوفر (${limitAmount} قطع)! / Sorry, you have reached the maximum available stock (${limitAmount} items)!`);
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Live order tracking computation and handlers
  const mergedRecentOrders = React.useMemo(() => {
    try {
      const saved = localStorage.getItem("vero_orders");
      const local: any[] = saved ? JSON.parse(saved) : [];
      
      const userEmail = user?.email?.toLowerCase();
      const serverUserOrders = userEmail 
        ? orders.filter(o => o.shippingEmail?.toLowerCase() === userEmail)
        : [];

      const allOrdersMap = new Map<string, any>();

      // First, add all server orders for this user
      serverUserOrders.forEach(o => {
        const key = o.orderNumber?.toString() || o.id;
        allOrdersMap.set(key, {
          id: o.id,
          orderNumber: o.orderNumber,
          date: o.date,
          total: o.total,
          status: o.status,
          itemsCount: o.items?.length || 0,
          itemName: o.items?.[0]?.product?.name || "Boutique Order",
          email: o.shippingEmail,
          items: o.items
        });
      });

      // Next, merge local orders
      local.forEach(localOrd => {
        const key = localOrd.orderNumber?.toString() || localOrd.id;
        const liveOrd = orders.find(o => o.orderNumber?.toString() === localOrd.orderNumber?.toString() || o.id === localOrd.id);
        
        if (liveOrd) {
          allOrdersMap.set(key, {
            ...localOrd,
            id: liveOrd.id,
            orderNumber: liveOrd.orderNumber,
            date: liveOrd.date || localOrd.date,
            status: liveOrd.status,
            items: liveOrd.items || localOrd.items,
            total: liveOrd.total || localOrd.total,
            email: liveOrd.shippingEmail || localOrd.email
          });
        } else {
          if (!allOrdersMap.has(key)) {
            allOrdersMap.set(key, localOrd);
          }
        }
      });

      return Array.from(allOrdersMap.values());
    } catch (e) {
      return [];
    }
  }, [orders, ordersVersion, user]);

  const handleTrackOrder = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    setTrackError(null);
    setTrackedOrder(null);

    const query = (customQuery || trackInput).trim().toLowerCase();
    if (!query) {
      setTrackError("الرجاء إدخال رقم الطلب أو البريد الإلكتروني / Please enter an order number or email");
      return;
    }

    const cleanQuery = query.replace("#", "");

    const found = orders.find(
      (o) =>
        o.orderNumber?.toString() === cleanQuery ||
        o.id === cleanQuery ||
        o.shippingEmail?.toLowerCase() === query
    );

    if (found) {
      setTrackedOrder(found);
    } else {
      const localFound = mergedRecentOrders.find(
        (o) =>
          o.orderNumber?.toString() === cleanQuery ||
          o.id === cleanQuery ||
          o.shippingEmail?.toLowerCase() === query
      );
      if (localFound) {
        setTrackedOrder(localFound);
      } else {
        setTrackError("لم نتمكن من العثور على هذا الطلب. يرجى التحقق من الرقم والمحاولة مرة أخرى. / Order not found. Please double-check and try again.");
      }
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "تم إلغاء الطلب" }),
      });

      if (res.ok) {
        triggerAppNotification("تم إلغاء الطلب بنجاح");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "تم إلغاء الطلب" } : o))
      );

      if (trackedOrder && (trackedOrder.id === orderId || trackedOrder.orderNumber?.toString() === orderId)) {
        setTrackedOrder((prev) => (prev ? { ...prev, status: "تم إلغاء الطلب" } : null));
      }

      try {
        const savedOrders = localStorage.getItem("vero_orders");
        if (savedOrders) {
          const parsed: Order[] = JSON.parse(savedOrders);
          const updated = parsed.map((o) =>
            o.id === orderId || o.orderNumber?.toString() === orderId
              ? { ...o, status: "تم إلغاء الطلب" }
              : o
          );
          localStorage.setItem("vero_orders", JSON.stringify(updated));
        }
      } catch (e) {
        // ignore
      }

      setOrdersVersion((v) => v + 1);
      fetchOrders();
    } catch (err) {
      console.error("Error cancelling order:", err);
    }
  };

  const handleCheckoutSuccess = (purchasedItems: CartItem[]) => {
    setProducts((prevProducts) => {
      return prevProducts.map((p) => {
        const item = purchasedItems.find((ci) => ci.product.id === p.id);
        if (item) {
          if (p.stock !== undefined) {
            return {
              ...p,
              stock: Math.max(0, p.stock - item.quantity),
            };
          }
        }
        return p;
      });
    });
    // Fetch fresh orders from backend server to display immediately
    fetchOrders();
    setOrdersVersion(v => v + 1);
  };

  // Favorite operations
  const toggleFavorite = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setFavorites((prev) =>
      prev.includes(product.id)
        ? prev.filter((id) => id !== product.id)
        : [...prev, product.id]
    );
  };

  const isFavorited = (productId: string) => favorites.includes(productId);

  // Cart calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = cart.length > 0 ? 50 : 0; // Flat-rate delivery fee
  
  // Promo code discounts
  const matchedPromo = promos.find((p) => p.code.toUpperCase() === activePromo.toUpperCase());
  const matchedReward = rewards.find((r) => r.code.toUpperCase() === activePromo.toUpperCase());
  
  const discountMultiplier = matchedPromo
    ? (matchedPromo.discountPercent / 100)
    : matchedReward
    ? (matchedReward.discountPercent / 100)
    : activePromo === "WELCOME10"
    ? 0.1
    : activePromo === "VERO"
    ? 0.15
    : 0;
  const discountAmount = cartSubtotal * discountMultiplier;
  const cartTotal = cartSubtotal - discountAmount + deliveryFee;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    setPromoSuccess("");
    const code = promoInput.trim().toUpperCase();

    // 1. Check general dynamic promos first
    const generalPromo = promos.find((p) => p.code.toUpperCase() === code);
    if (generalPromo) {
      setActivePromo(code);
      setPromoSuccess(`Promo ${code} applied successfully! Enjoy ${generalPromo.discountPercent}% discount. / تم تطبيق كود الخصم بنجاح! خصم بقيمة ${generalPromo.discountPercent}٪`);
      setPromoInput("");
      return;
    }

    // 2. Check default ones
    if (code === "WELCOME10") {
      setActivePromo("WELCOME10");
      setPromoSuccess("WELCOME10 applied! Enjoy 10% discount.");
    } else if (code === "VERO") {
      setActivePromo("VERO");
      setPromoSuccess("VERO applied! Enjoy 15% VIP discount.");
    } else {
      // 3. Check loyalty rewards
      const reward = rewards.find((r) => r.code.toUpperCase() === code);
      if (reward) {
        // Verify if user is signed in and has redeemed this code
        const hasRedeemed = user?.redeemedRewards?.some((item) => {
          // Strings can be "15% Off Coupon (Code: GOLD15)" or similar, match "Code: GOLD15"
          const codeMatch = item.match(/Code:\s*([A-Z0-9]+)/);
          return codeMatch && codeMatch[1].toUpperCase() === code;
        });

        if (user && !hasRedeemed) {
          setPromoError("This coupon code is valid, but you have not redeemed it yet from your loyalty rewards profile. / كود صحيح ولكن لم تقم باستبداله بعد.");
        } else {
          setActivePromo(code);
          setActivePromo(code);
          setPromoSuccess(`Promo ${code} applied successfully! Enjoy ${reward.discountPercent}% VIP discount.`);
        }
      } else if (code === "") {
        setPromoError("Please enter a valid code.");
      } else {
        setPromoError("Promo code not recognized.");
      }
    }
    setPromoInput("");
  };

  const handleProductDetailNavigate = (product: Product) => {
    setSelectedProduct(product);
    const identifier = getProductIdentifier(product);
    navigate(`/product/${identifier}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter and sort items list
  const filteredProducts = React.useMemo(() => {
    let result = [...products];

    // Filter by Category
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    // Filter by Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q)
      );
    }

    // Sort By
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [selectedCategory, searchQuery, sortBy, products]);

  // Pagination index helper (let's display 8 items per page)
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-brand-linen text-brand-umber selection:bg-brand-gold/20 select-none pb-16 md:pb-0">
      {/* Scroll indicator bar */}
      <div className="fixed top-0 left-0 w-full h-[2px] bg-brand-gold/10 z-[200]">
        <motion.div
          className="h-full bg-brand-gold"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5 }}
        />
      </div>

      {/* Header component */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        cartCount={cartCount}
        openSearch={() => setSearchOpen(true)}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onTrackOrder={(orderNum) => {
          handleTabChange("tracking");
          if (orderNum) {
            handleTrackOrder(undefined, orderNum);
          }
        }}
        onUpdateUser={handleUpdateUser}
      />

      {/* Primary views body */}
      <main className="flex-grow pt-24 md:pt-28">
        <Routes>
          <Route
            path="/product/:idOrSlug"
            element={
              <ProductDetailsPage
                products={products}
                onAddToBag={handleAddToBag}
                onReservePreOrder={(prod) => {
                  setPreOrderProduct(prod);
                  setIsPreOrderModalOpen(true);
                }}
                isFavorited={(id) => isFavorited(id)}
                toggleFavorite={toggleFavorite}
                user={user}
                userOrders={orders.filter((o) => o.shippingEmail?.toLowerCase() === user?.email?.toLowerCase() || o.email?.toLowerCase() === user?.email?.toLowerCase())}
                allReviews={allReviews}
                onRefreshReviews={fetchReviews}
                onOpenAuth={() => setAuthModalOpen(true)}
                triggerNotification={setAppNotification}
                productRatingMap={productRatingMap}
              />
            }
          />
          <Route
            path="*"
            element={
              <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-24"
            >
              {/* Hero Section */}
              <section className="relative h-[78vh] min-h-[550px] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0 scale-105 select-none">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-[15s] ease-out hover:scale-110"
                    style={{
                      backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCHKrz9Y-W_j5e70EQWVUrBfGCKOmcRbm4ljs9QfY8UDTbpWQ6Q8mlmCDAt8UokML1BhB2tvYkXb4opSBauA63Qa0lp6ZoZLcYgITTJxNUH3pyD3vDheBWqCijgu_GIju4oEuZTHRh1Rc46SFSSaNfyCHQ4sAjZAkiTANFNHi5yPigufRgv1vXyLX9_UeM-jH0EWcMeSzMo7BPVw7HZpiBcDaLAPQPsVY_ur16wIF0WKKQ-4oqRZRGiV7Ko7nq0gCdJvn9s7sC65nc')`,
                    }}
                  />
                  <div className="absolute inset-0 bg-[#211b12]/15" />
                </div>

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-6">
                  <p className="font-sans text-xs md:text-sm font-medium tracking-[0.3em] text-brand-surface-low uppercase">
                    Quiet Luxury
                  </p>
                  <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-brand-surface-low leading-tight md:leading-none tracking-tight font-medium">
                    Details Define You
                  </h1>
                  <p className="text-brand-surface-low/80 max-w-md mx-auto text-xs md:text-sm tracking-[0.1em] font-light leading-relaxed uppercase pt-2">
                    Meticulously Crafted Fine Accessories For Discerning Hearts.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center pt-8">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedCategory("all");
                        setActiveTab("shop");
                      }}
                      className="bg-brand-gold text-white px-10 py-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-brand-umber transition-all shadow-md w-full sm:w-auto"
                    >
                      EXPLORE COLLECTION
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab("our-story")}
                      className="border border-brand-surface-low text-brand-surface-low px-10 py-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-brand-surface-low hover:text-brand-umber transition-all w-full sm:w-auto"
                    >
                      OUR STORY
                    </motion.button>
                  </div>
                </div>
              </section>

              {/* Brand Pillars dynamic section */}
              <BrandPillars />

              {/* New Arrivals Horizontal scroll */}
              <section className="max-w-7xl mx-auto px-6 md:px-12 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12 border-b border-brand-outline-variant/10 pb-6">
                  <div>
                    <span className="text-brand-gold font-sans text-xs font-semibold tracking-[0.2em] uppercase block mb-2">
                      Seasonal
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl text-brand-umber">
                      New Arrivals
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setActiveTab("shop");
                    }}
                    className="group flex items-center gap-2 font-sans text-xs font-medium text-brand-gold tracking-[0.15em] uppercase hover:opacity-75 transition-opacity"
                  >
                    View All{" "}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  {products.filter((p) => p.isNew)
                    .slice(0, 4)
                    .map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onProductClick={handleProductDetailNavigate}
                        onQuickViewClick={(prod, e) => {
                          e.stopPropagation();
                          setQuickViewProduct(prod);
                        }}
                        isFavorited={isFavorited(product.id)}
                        toggleFavorite={toggleFavorite}
                        avgRating={
                          productRatingMap[product.id]
                            ? productRatingMap[product.id].sum / productRatingMap[product.id].count
                            : 5
                        }
                        reviewCount={
                          productRatingMap[product.id]
                            ? productRatingMap[product.id].count
                            : 0
                        }
                      />
                    ))}
                </div>
              </section>

              {/* Curated Categories Grid with visual links */}
              <section className="py-16 bg-brand-surface-low">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                  <div className="text-center mb-16">
                    <span className="text-[10px] tracking-[0.2em] font-medium text-brand-gold uppercase block mb-3">
                      Linen &amp; Gold
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl text-brand-umber">
                      Curated Categories
                    </h2>
                    <div className="w-12 h-[1px] bg-brand-gold mx-auto mt-6"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-[650px]">
                    {/* Category: Rings */}
                    <div
                      onClick={() => {
                        setSelectedCategory("rings");
                        setActiveTab("shop");
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      className="md:col-span-8 group relative overflow-hidden h-[300px] md:h-full cursor-pointer shadow-sm border border-brand-outline-variant/10"
                    >
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7ddR-XGRFF7ZwjqRe3Lb-HvaihviUNpTFMTo10PZQ_-iWX3dHYb_j9NphUXFfq1RLIVS5ulRSzV-s712e4G7vtkJcHA0muDtY9DHEbI_zQeXANvKStKeeksritCSGP5ih6oc_mDzIpJo-JK5lgL9ZI9pc4qOe6-fZnEle31gNmW3Ra9tpqcoVs_RDpioKwvUn4j-9P5j6w_lfSUUHJjGBkUWuw94qrQAEzt1RoGMnNYlGOJnyMZ7U2W6oqjGuTXTYxge8Try-zWs"
                        alt="Rings Collection"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-[#211b12]/15 group-hover:bg-[#211b12]/35 transition-colors duration-700" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                        <h3 className="font-serif text-3xl md:text-4xl tracking-[0.1em] mb-4 font-light text-shadow">
                          Rings Collection
                        </h3>
                        <span className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 border border-white px-8 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase">
                          Explore Rings
                        </span>
                      </div>
                    </div>

                    {/* Category: Timepieces */}
                    <div
                      onClick={() => {
                        setSelectedCategory("timepieces");
                        setActiveTab("shop");
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      className="md:col-span-4 group relative overflow-hidden h-[300px] md:h-full cursor-pointer shadow-sm border border-brand-outline-variant/10"
                    >
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHURVDMw0Ut_yNnemHeLgqN9kEmRJy9KfyIJhWGm36fQh-CMtrO0pGYuaCr4MR-OaDy0sUnfzCwvRWYY9815RVkpasZq00PZ0fRbmOmCVpkPwSWKRtiicrCUREgDhVRGMuHYa792wqM27VJFjYjxLBhHEpkVf0Ipvb3HquyCydhbrE5uPWIC5KS6E4w4d31wBTOnNQIu3ooZafSZ0qWewaHaQeiPuHaoRpnPOY5j01Hhjk48HWuTgKuMfPyIs5QbInR7O3tUJq5c8"
                        alt="Luxury Timepieces"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-[#211b12]/15 group-hover:bg-[#211b12]/35 transition-colors duration-700" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                        <h3 className="font-serif text-3xl tracking-[0.1em] mb-4 font-light text-shadow">
                          Timepieces
                        </h3>
                        <span className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 border border-white px-8 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase">
                          Discover Watches
                        </span>
                      </div>
                    </div>

                    {/* Category: Necklaces */}
                    <div
                      onClick={() => {
                        setSelectedCategory("necklaces");
                        setActiveTab("shop");
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      className="md:col-span-4 group relative overflow-hidden h-[300px] md:h-[350px] cursor-pointer shadow-sm border border-brand-outline-variant/10"
                    >
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoQPdv1Jz-RjB7b1hjgtGz63JLAFwfHrviFOr5ny4f6MFDkZxOQHHTjelEbjGpcI5RvtXjohZvo8yjwqrKVDJG_6wpfjn26-AFirT4svWQONukVwV2KLBxWem4yr7Ey28wxvNJXeFlKCpGqoT_PXUZ3yHVpvS7-0ASt7bKmz8N3dAwt6XznGpD02rnAxlpnzC8jT9H_DIEHfTWzCnCRQA2GHwO-xljT6UvWXNkBEMwG2F3fuvp53Fw3u3cXqeNnjEM3uiSoHn5P7k"
                        alt="High Jewelry Necklaces"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-[#211b12]/15 group-hover:bg-[#211b12]/35 transition-colors duration-700" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                        <h3 className="font-serif text-3xl tracking-[0.1em] mb-4 font-light text-shadow">
                          Necklaces
                        </h3>
                        <span className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 border border-white px-8 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase">
                          View Necklaces
                        </span>
                      </div>
                    </div>

                    {/* Category: Fine Jewelry */}
                    <div
                      onClick={() => {
                        setSelectedCategory("fine-jewelry");
                        setActiveTab("shop");
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      className="md:col-span-8 group relative overflow-hidden h-[300px] md:h-[350px] cursor-pointer shadow-sm border border-brand-outline-variant/10"
                    >
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_4xPadl5w6Pl2wmap9TNWjuW3eRqmSaee8UcVUYb5Ob0tjxyVXXgSUz8bd800TgShznRuwLsCSE8fL8g54lW8D6Y2Wqn77Y3VnnDy11ZQQyS78UrFyUgxqRXe83BtXdaR7o05YC071Tjfyge5uII8vI9eb_n0zITggflZzz8_ocIceRDAsQovQqPZTN6SXT9FkEnH750_FvFUxz-___-L_RW-wCIyddPds8SWGNUvJZlb-z3tgbVqUqsnmttQOxLDZXqdfrdHuOs"
                        alt="Fine Jewelry"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-[#211b12]/15 group-hover:bg-[#211b12]/35 transition-colors duration-700" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                        <h3 className="font-serif text-3xl md:text-4xl tracking-[0.1em] mb-4 font-light text-shadow">
                          Fine Jewelry
                        </h3>
                        <span className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 border border-white px-8 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase">
                          Explore Collection
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Journal Quote & Philosophy Section */}
              <section className="py-24 max-w-3xl mx-auto px-6 text-center border-t border-brand-outline-variant/10">
                <span className="text-brand-gold font-sans text-xs font-semibold tracking-[0.3em] uppercase block mb-6">
                  The Vero Journal
                </span>
                <h2 className="font-serif italic text-3xl md:text-4xl text-brand-umber leading-relaxed font-light">
                  "Join our world of understated luxury and receive curated updates on new releases."
                </h2>
                <div className="w-10 h-px bg-brand-gold/40 mx-auto mt-10"></div>
              </section>
            </motion.div>
          )}

          {activeTab === "shop" && (
            <motion.div
              key="shop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-6 md:px-12 py-8"
            >
              {/* Header Info */}
              <section className="mb-12 md:mb-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-outline-variant/20 pb-8">
                  <div className="space-y-3">
                    <span className="text-brand-gold font-sans text-[10px] font-semibold tracking-[0.2em] uppercase block">
                      Curated Boutique
                    </span>
                    <h1 className="font-serif text-4xl text-brand-umber tracking-wide uppercase font-normal">
                      Shop All
                    </h1>
                    <p className="font-sans text-xs font-light text-brand-outline max-w-lg leading-relaxed">
                      Meticulously crafted accessories designed for those who appreciate the poetry of detail. Discover quiet luxury below.
                    </p>
                  </div>

                  {/* Filter action bar */}
                  <div className="flex flex-wrap items-center gap-4 md:gap-6 font-sans text-xs">
                    {/* Category select dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-brand-outline uppercase tracking-wider text-[10px] font-semibold">
                        Category:
                      </span>
                      <select
                        value={selectedCategory}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="bg-transparent border-b border-brand-outline-variant text-xs text-brand-umber outline-none py-1.5 focus:border-brand-gold font-medium tracking-wider"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="h-4 w-px bg-brand-outline-variant/30 hidden md:block" />

                    {/* Sort Select */}
                    <div className="flex items-center gap-2">
                      <span className="text-brand-outline uppercase tracking-wider text-[10px] font-semibold">
                        Sort By:
                      </span>
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="bg-transparent border-b border-brand-outline-variant text-xs text-brand-umber outline-none py-1.5 focus:border-brand-gold font-medium tracking-wider"
                      >
                        <option value="default">Default</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="name-asc">Alphabetical</option>
                      </select>
                    </div>

                    {/* Clear filter button if any is active */}
                    {(selectedCategory !== "all" || searchQuery !== "" || sortBy !== "default") && (
                      <button
                        onClick={() => {
                          setSelectedCategory("all");
                          setSearchQuery("");
                          setSortBy("default");
                          setCurrentPage(1);
                        }}
                        className="text-brand-gold underline underline-offset-4 font-semibold tracking-wider text-[10px] uppercase"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* Grid listing */}
              {paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onProductClick={handleProductDetailNavigate}
                      onQuickViewClick={(prod, e) => {
                        e.stopPropagation();
                        setQuickViewProduct(prod);
                      }}
                      isFavorited={isFavorited(product.id)}
                      toggleFavorite={toggleFavorite}
                      avgRating={
                        productRatingMap[product.id]
                          ? productRatingMap[product.id].sum / productRatingMap[product.id].count
                          : 5
                      }
                      reviewCount={
                        productRatingMap[product.id]
                          ? productRatingMap[product.id].count
                          : 0
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-brand-surface-low border border-brand-outline-variant/10">
                  <p className="font-serif text-lg text-brand-outline italic mb-4">
                    No accessories matching your filters were found.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                      setSortBy("default");
                    }}
                    className="bg-brand-gold text-white px-8 py-3.5 text-xs font-semibold tracking-widest uppercase hover:bg-brand-umber transition-all"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="mt-24 flex items-center justify-center gap-6">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                    className="w-11 h-11 flex items-center justify-center rounded-full border border-brand-outline-variant/40 text-brand-gold hover:bg-brand-gold hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-brand-gold transition-all duration-300"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>

                  <div className="flex items-center gap-2 text-xs font-semibold tracking-widest">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      const isActive = currentPage === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isActive
                              ? "bg-brand-gold text-white font-bold"
                              : "text-brand-outline hover:text-brand-gold hover:bg-brand-surface-low"
                          }`}
                        >
                          {pageNum < 10 ? `0${pageNum}` : pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                    className="w-11 h-11 flex items-center justify-center rounded-full border border-brand-outline-variant/40 text-brand-gold hover:bg-brand-gold hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-brand-gold transition-all duration-300"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "product-detail" && selectedProduct && (
            <motion.div
              key="product-detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-6 md:px-12 py-8"
            >
              {/* Breadcrumbs */}
              <nav className="mb-10 text-[10px] font-sans tracking-[0.15em] uppercase text-brand-outline/60">
                <ul className="flex flex-wrap items-center gap-2">
                  <li>
                    <button onClick={() => setActiveTab("home")} className="hover:text-brand-gold transition-colors">
                      Home
                    </button>
                  </li>
                  <li>/</li>
                  <li>
                    <button
                      onClick={() => {
                        setSelectedCategory(selectedProduct.categoryId);
                        setActiveTab("shop");
                      }}
                      className="hover:text-brand-gold transition-colors"
                    >
                      {selectedProduct.categoryName}
                    </button>
                  </li>
                  <li>/</li>
                  <li className="text-brand-gold font-semibold truncate max-w-[200px]">
                    {selectedProduct.name}
                  </li>
                </ul>
              </nav>

              {/* Main Detail Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                {/* Product Gallery (Left) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Hero Image view */}
                  <div className="relative aspect-[4/5] bg-brand-surface-low overflow-hidden group">
                    <img
                      src={activeDetailImage}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />

                    {/* Toggle Favorite button */}
                    <button
                      onClick={(e) => toggleFavorite(selectedProduct, e)}
                      className={`absolute top-5 right-5 p-3 rounded-full backdrop-blur-md border transition-all duration-300 ${
                        isFavorited(selectedProduct.id)
                          ? "bg-brand-gold text-white border-brand-gold"
                          : "bg-white/70 text-brand-gold border-transparent hover:bg-white hover:border-brand-gold/20"
                      }`}
                      aria-label="Favorite"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFavorited(selectedProduct.id) ? "fill-current" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Thumbnails */}
                  {selectedProduct.secondaryImages && selectedProduct.secondaryImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-4">
                      {selectedProduct.secondaryImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveDetailImage(img)}
                          className={`aspect-square overflow-hidden border transition-all duration-300 rounded-sm relative ${
                            activeDetailImage === img
                              ? "border-brand-gold ring-2 ring-brand-gold/10 scale-[0.98]"
                              : "border-brand-outline-variant/30 hover:border-brand-gold/40"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Detail view ${i + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Information panel (Right) */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div className="space-y-8">
                    <div>
                      {selectedProduct.isPreOrder && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-umber text-brand-gold border border-brand-gold/40 text-[10px] font-bold uppercase tracking-[0.15em] rounded-sm mb-3 shadow-sm">
                          <Sparkles className="w-3 h-3 text-brand-gold" />
                          PRE-ORDER ITEM
                        </div>
                      )}
                      <span className="text-[10px] font-sans tracking-[0.25em] font-medium text-brand-gold uppercase block mb-3">
                        HANDCRAFTED SERIES
                      </span>
                      <h1 className="font-serif text-3xl md:text-4xl text-brand-umber tracking-wide leading-tight mb-2 font-normal">
                        {selectedProduct.name}
                      </h1>
                      {(() => {
                        const stats = productRatingMap[selectedProduct.id] || { sum: 0, count: 0 };
                        const avg = stats.count > 0 ? stats.sum / stats.count : 5.0;
                        return (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-4 h-4 ${
                                    s <= Math.round(avg)
                                      ? "fill-[#c5a880] text-[#c5a880]"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <a
                              href="#product-reviews-section"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById("product-reviews-section")?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="text-xs font-mono text-brand-outline hover:text-brand-gold underline underline-offset-4 cursor-pointer transition-colors"
                            >
                              {stats.count > 0
                                ? `${avg.toFixed(1)} (${stats.count} ${stats.count === 1 ? "review" : "reviews"} / تقييم)`
                                : "5.0 (جديد - أضف أول تقييم)"}
                            </a>
                          </div>
                        );
                      })()}
                      <PriceDisplay
                        price={selectedProduct.price}
                        originalPrice={selectedProduct.originalPrice}
                        discountPercent={selectedProduct.discountPercent}
                        size="lg"
                        className="my-2"
                      />

                      {/* VERO Points Earned Callout */}
                      {(() => {
                        const pts = selectedProduct.pointsEarned ?? Math.round(selectedProduct.price * 0.1);
                        if (pts <= 0) return null;
                        return (
                          <div className="mt-3 p-3 rounded-md bg-amber-50 border border-amber-300/80 flex items-center gap-2.5 text-amber-900 shadow-sm">
                            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                            <div className="text-right">
                              <p className="text-xs font-bold text-amber-950">
                                تكسب +{pts} نقطة VERO عند شراء هذا المنتج
                              </p>
                              <p className="text-[11px] text-amber-800 font-medium">
                                نقاط مكافآت تُضاف مباشرة إلى رصيدك
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {selectedProduct.stock !== undefined && (
                        <div className="mt-4">
                          {selectedProduct.stock === 0 ? (
                            <span className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 px-3 py-1.5 rounded uppercase tracking-wider inline-block">
                              غير متوفر حالياً / Out of Stock
                            </span>
                          ) : selectedProduct.stock === 1 ? (
                            <span className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-300 px-3 py-1.5 rounded uppercase tracking-wider inline-block animate-bounce">
                              القطعة الأخيرة! / THE LAST ONE!
                            </span>
                          ) : (
                            <span className="text-xs text-brand-umber font-semibold bg-brand-gold/10 border border-brand-gold/20 px-3 py-1.5 rounded inline-block font-sans animate-pulse">
                              الكمية المتبقية بالمخزن: {selectedProduct.stock} قطع / Only {selectedProduct.stock} left in stock
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-brand-outline-variant/20 w-full" />



                    {/* Choices (Material selection) */}
                    {selectedProduct.materialOptions && selectedProduct.materialOptions.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-semibold text-brand-umber uppercase tracking-[0.15em] block">
                          Material
                        </span>
                        <div className="flex gap-4">
                          {selectedProduct.materialOptions.map((hex, i) => {
                            // Map materials
                            const isSelected = selectedProduct.materialOptions?.[i] === hex;
                            return (
                              <button
                                key={i}
                                className="w-10 h-10 rounded-full border-2 transition-all relative flex items-center justify-center shadow-sm"
                                style={{
                                  backgroundColor: hex,
                                  borderColor: isSelected ? "var(--color-brand-gold)" : "transparent",
                                  boxShadow: isSelected ? "0 0 0 4px rgba(106, 92, 71, 0.15)" : "none",
                                }}
                                title={hex}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sizes Selection */}
                    {selectedProduct.sizeOptions && selectedProduct.sizeOptions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-semibold text-brand-umber uppercase tracking-[0.15em] block">
                            Select Size
                          </span>
                          <button 
                            onClick={() => alert("Size Guide:\nRing measurements based on standard US sizing (06, 07, 08, 09).\nBangle measurements (S, M, L) based on wrist circumferences: S (6.0 in), M (6.5 in), L (7.0 in).")}
                            className="text-[10px] text-brand-gold underline underline-offset-4 font-semibold tracking-wider uppercase"
                          >
                            Size Guide
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {selectedProduct.sizeOptions.map((size) => (
                            <button
                              key={size}
                              className="px-5 py-3.5 border border-brand-gold bg-brand-gold text-white text-xs tracking-wider uppercase font-medium rounded-sm"
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="space-y-6 pt-10">
                    {selectedProduct.isPreOrder ? (
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setPreOrderProduct(selectedProduct);
                          setIsPreOrderModalOpen(true);
                        }}
                        className="w-full py-5 bg-brand-gold hover:bg-brand-umber text-white font-sans text-xs font-semibold uppercase tracking-[0.2em] transition-all shadow-md rounded-sm flex items-center justify-center gap-3 cursor-pointer"
                      >
                        <Clock className="w-4 h-4 stroke-[1.5]" />
                        Reserve Now
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={selectedProduct.stock === 0 ? {} : { y: -2 }}
                        whileTap={selectedProduct.stock === 0 ? {} : { scale: 0.98 }}
                        disabled={selectedProduct.stock === 0}
                        onClick={() => {
                          const material = selectedProduct.materialOptions?.[0] || "#E5D5BC";
                          const size = selectedProduct.sizeOptions?.[0] || "One Size";
                          handleAddToBag(selectedProduct, material, size);
                          setActiveTab("bag");
                        }}
                        className={`w-full py-5 text-white font-sans text-xs font-semibold uppercase tracking-[0.2em] transition-all shadow-md rounded-sm flex items-center justify-center gap-3 ${
                          selectedProduct.stock === 0
                            ? "bg-rose-700/85 cursor-not-allowed"
                            : "bg-brand-gold hover:bg-brand-umber"
                        }`}
                      >
                        {selectedProduct.stock === 0 ? (
                          <>OUT OF STOCK</>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
                            Add to Bag
                          </>
                        )}
                      </motion.button>
                    )}
                    <p className="text-center text-[10px] font-light text-brand-outline tracking-wider uppercase flex items-center justify-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-brand-gold" />
                      Complimentary bespoke shipping &amp; authentic wrapping
                    </p>

                    {/* Specifications Accordion draws */}
                    <div className="mt-8 border-t border-brand-outline-variant/30 pt-4">
                      {/* Accordion 1: Details */}
                      <div className="border-b border-brand-outline-variant/20 py-4">
                        <button
                          onClick={() =>
                            setAccordionOpen((prev) => ({ ...prev, details: !prev.details }))
                          }
                          className="w-full flex justify-between items-center text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-umber outline-none"
                        >
                          Product Details
                          <ChevronRight
                            className={`w-4 h-4 text-brand-gold transition-transform duration-300 ${
                              accordionOpen.details ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {accordionOpen.details && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden text-[11px] font-light text-brand-outline leading-relaxed pt-3 space-y-1.5"
                            >
                              {selectedProduct.details?.map((detail, index) => (
                                <p key={index}>• {detail}</p>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Accordion 2: Craftsmanship */}
                      <div className="border-b border-brand-outline-variant/20 py-4">
                        <button
                          onClick={() =>
                            setAccordionOpen((prev) => ({
                              ...prev,
                              craftsmanship: !prev.craftsmanship,
                            }))
                          }
                          className="w-full flex justify-between items-center text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-umber outline-none"
                        >
                          The Craftsmanship
                          <ChevronRight
                            className={`w-4 h-4 text-brand-gold transition-transform duration-300 ${
                              accordionOpen.craftsmanship ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {accordionOpen.craftsmanship && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden text-[11px] font-light text-brand-outline leading-relaxed pt-3"
                            >
                              <p>
                                {selectedProduct.craftsmanship ||
                                  "Each VERO creation is hand-forged by master jewellers utilizing ancient Roman lost-wax casting techniques combined with cutting-edge micro-precision tooling. We dedicate a minimum of 40 focused workshop hours to forge, hand-polish, and authenticate every custom article."}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Product Reviews & Ratings Section on Product Page */}
              <div id="product-reviews-section" className="mt-20 p-6 md:p-12 border border-brand-outline-variant/20 bg-white rounded-sm shadow-sm">
                <ProductReviewsSection
                  productId={selectedProduct.id}
                  productName={selectedProduct.name}
                  productImage={selectedProduct.image}
                  user={user}
                  userOrders={orders.filter((o) => o.shippingEmail?.toLowerCase() === user?.email?.toLowerCase() || o.email?.toLowerCase() === user?.email?.toLowerCase())}
                  allReviews={allReviews}
                  onRefreshReviews={fetchReviews}
                  onOpenAuth={() => setAuthModalOpen(true)}
                />
              </div>

              {/* Essence of VERO values block */}
              <section className="mt-32 py-16 bg-brand-surface-low border-y border-brand-outline-variant/10 text-center">
                <div className="max-w-2xl mx-auto space-y-6 px-6">
                  <span className="text-[10px] tracking-[0.25em] font-medium text-brand-gold uppercase block">
                    The Essence of Vero
                  </span>
                  <h3 className="font-serif text-3xl text-brand-umber font-light">
                    Restraint Over Ostentation
                  </h3>
                  <p className="font-sans text-xs font-light text-brand-outline leading-relaxed">
                    Luxury is not loud; it is the quiet confidence in every meticulously finished edge and thoughtfully selected recycled precious material.
                  </p>
                </div>
              </section>

              {/* Complete the Set / Suggested Carousel */}
              <section className="mt-32">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
                  <div>
                    <span className="text-brand-gold font-sans text-xs font-semibold tracking-[0.2em] uppercase block mb-2">
                      Complete the set
                    </span>
                    <h2 className="font-serif text-3xl text-brand-umber">
                      You May Also Love
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  {products.filter((p) => p.id !== selectedProduct.id)
                    .slice(0, 4)
                    .map((rec) => (
                      <ProductCard
                        key={rec.id}
                        product={rec}
                        onProductClick={handleProductDetailNavigate}
                        onQuickViewClick={(p, e) => {
                          e.stopPropagation();
                          setQuickViewProduct(p);
                        }}
                        isFavorited={isFavorited(rec.id)}
                        toggleFavorite={toggleFavorite}
                        avgRating={
                          productRatingMap[rec.id]
                            ? productRatingMap[rec.id].sum / productRatingMap[rec.id].count
                            : 5
                        }
                        reviewCount={
                          productRatingMap[rec.id]
                            ? productRatingMap[rec.id].count
                            : 0
                        }
                      />
                    ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "favorites" && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-6 md:px-12 py-8"
            >
              <section className="mb-12 border-b border-brand-outline-variant/20 pb-8">
                <span className="text-brand-gold font-sans text-[10px] font-semibold tracking-[0.2em] uppercase block mb-3">
                  Your Custom Vault
                </span>
                <h1 className="font-serif text-4xl text-brand-umber tracking-wide uppercase font-normal">
                  Saved Favorites
                </h1>
                <p className="font-sans text-xs font-light text-brand-outline max-w-lg mt-2 leading-relaxed">
                  Your personally curated list of timeless jewelry, timepieces, and accessories. Add them to bag instantly.
                </p>
              </section>

              {favorites.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
                  {products.filter((p) => favorites.includes(p.id)).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onProductClick={handleProductDetailNavigate}
                      onQuickViewClick={(prod, e) => {
                        e.stopPropagation();
                        setQuickViewProduct(prod);
                      }}
                      isFavorited={true}
                      toggleFavorite={toggleFavorite}
                      avgRating={
                        productRatingMap[product.id]
                          ? productRatingMap[product.id].sum / productRatingMap[product.id].count
                          : 5
                      }
                      reviewCount={
                        productRatingMap[product.id]
                          ? productRatingMap[product.id].count
                          : 0
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-brand-surface-low border border-brand-outline-variant/10">
                  <p className="font-serif text-lg text-brand-outline italic mb-6">
                    Your luxury vault is currently empty.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setActiveTab("shop");
                    }}
                    className="bg-brand-gold text-white px-8 py-3.5 text-xs font-semibold tracking-widest uppercase hover:bg-brand-umber transition-all"
                  >
                    Browse Collections
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "bag" && (
            <motion.div
              key="bag"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-6 md:px-12 py-8"
            >
              <section className="mb-12">
                <h1 className="font-serif text-4xl text-brand-umber tracking-wide uppercase font-normal mb-2">
                  Shopping Bag
                </h1>
                <p className="font-sans text-xs font-medium uppercase tracking-widest text-brand-outline">
                  {cart.length === 0
                    ? "Your bag is empty"
                    : `${cartCount} Item${cartCount > 1 ? "s" : ""} Selected`}
                </p>
              </section>

              {cart.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Items List (Left) */}
                  <div className="lg:col-span-8 space-y-8">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row gap-6 border-b border-brand-outline-variant/20 pb-8 group"
                      >
                        {/* Image */}
                        <div className="w-full sm:w-32 aspect-square bg-brand-surface-low overflow-hidden rounded-sm cursor-pointer shadow-sm">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            onClick={() => handleProductDetailNavigate(item.product)}
                            className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-grow flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3
                                onClick={() => handleProductDetailNavigate(item.product)}
                                className="font-serif text-lg text-brand-umber hover:text-brand-gold cursor-pointer transition-colors mb-1 font-normal"
                              >
                                {item.product.name}
                              </h3>
                              <p className="font-sans text-[10px] text-brand-outline uppercase tracking-wider">
                                {item.product.categoryName} •{" "}
                                <span
                                  className="inline-block w-2.5 h-2.5 rounded-full border align-middle mr-1"
                                  style={{ backgroundColor: item.selectedMaterial }}
                                />
                                Size {item.selectedSize}
                              </p>
                            </div>

                            <button
                              onClick={() => handleRemoveFromCart(item.id)}
                              className="text-brand-outline/60 hover:text-red-500 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4.5 h-4.5 stroke-[1.5]" />
                            </button>
                          </div>

                          {/* Qty edit & price tag */}
                          <div className="flex justify-between items-end mt-6">
                            <div className="flex items-center border border-brand-outline-variant/40 rounded-sm bg-white">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                className="px-3 py-1.5 text-brand-outline hover:text-brand-gold hover:bg-brand-surface-low transition-colors active:scale-90"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-4 py-1 text-xs font-semibold text-brand-umber border-x border-brand-outline-variant/20">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="px-3 py-1.5 text-brand-outline hover:text-brand-gold hover:bg-brand-surface-low transition-colors active:scale-90"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="font-sans text-sm font-semibold text-brand-gold">
                              EGP {(item.product.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 text-center sm:text-left">
                      <button
                        onClick={() => {
                          setSelectedCategory("all");
                          setActiveTab("shop");
                        }}
                        className="text-brand-gold font-sans text-xs font-semibold border-b border-brand-gold/30 pb-1 hover:border-brand-gold transition-all duration-300 uppercase tracking-widest"
                      >
                        CONTINUE SHOPPING
                      </button>
                    </div>
                  </div>

                  {/* Summary recap block (Right) */}
                  <aside className="lg:col-span-4">
                    <div className="bg-brand-surface-low p-6 md:p-8 rounded-sm shadow-sm border border-brand-outline-variant/20 sticky top-24 space-y-6">
                      <h2 className="font-serif text-lg text-brand-umber font-semibold uppercase tracking-wider mb-2">
                        Summary
                      </h2>

                      <div className="space-y-3 font-sans text-xs text-brand-outline font-light border-b border-brand-outline-variant/10 pb-5">
                        <div className="flex justify-between">
                          <span>SUBTOTAL</span>
                          <span className="font-semibold text-brand-umber">
                            EGP {cartSubtotal.toLocaleString()}
                          </span>
                        </div>
                        {activePromo && (
                          <div className="flex justify-between text-brand-gold font-semibold">
                            <span>PROMO ({activePromo})</span>
                            <span>-EGP {discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>DELIVERY / التوصيل</span>
                          <span className="font-semibold text-brand-umber">
                            EGP {deliveryFee.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Promocode entry */}
                      <form onSubmit={handleApplyPromo} className="space-y-2">
                        <label className="block text-[9px] font-bold text-brand-umber uppercase tracking-widest">
                          Gift Card / Promo Code
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value)}
                            placeholder="Try VERO or WELCOME10"
                            className="flex-grow bg-transparent border-b border-brand-outline-variant focus:border-brand-gold outline-none py-2 text-xs font-light uppercase px-1 focus:ring-0"
                          />
                          <button
                            type="submit"
                            className="text-brand-gold font-sans text-xs font-semibold hover:opacity-75 transition-opacity"
                          >
                            APPLY
                          </button>
                        </div>
                        {promoError && <p className="text-[10px] text-red-500 font-light">{promoError}</p>}
                        {promoSuccess && (
                          <p className="text-[10px] text-brand-gold font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            {promoSuccess}
                          </p>
                        )}
                      </form>

                      {/* Total */}
                      <div className="pt-2">
                        <div className="flex justify-between items-end font-serif font-semibold text-brand-umber">
                          <span className="text-sm">Total</span>
                          <span className="text-2xl text-brand-gold">
                            EGP {cartTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCheckoutOpen(true)}
                        className="w-full bg-brand-gold hover:bg-brand-umber text-white font-sans text-xs font-semibold py-5 tracking-[0.15em] uppercase transition-all shadow-md rounded-sm flex items-center justify-center gap-2"
                      >
                        <Lock className="w-4 h-4 stroke-[1.5]" />
                        Proceed to Checkout
                      </motion.button>

                      <div className="flex items-center justify-center gap-2 text-brand-outline/40">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-[9px] uppercase tracking-widest">
                          Secure Encrypted Connection
                        </span>
                      </div>
                    </div>
                  </aside>
                </div>
              ) : (
                <div className="text-center py-20 bg-brand-surface-low border border-brand-outline-variant/10">
                  <p className="font-serif text-lg text-brand-outline italic mb-6">
                    Your luxury shopping bag is currently empty.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setActiveTab("shop");
                    }}
                    className="bg-brand-gold text-white px-8 py-3.5 text-xs font-semibold tracking-widest uppercase hover:bg-brand-umber transition-all"
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </motion.div>
          )}



          {activeTab === "supabase" && user?.email?.toLowerCase() === "vero2026@vero.com" && (
            <motion.div
              key="supabase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="max-w-7xl mx-auto px-6 py-12 space-y-12 mt-16 md:mt-24"
            >
              <SupabasePlayground />
            </motion.div>
          )}

          {activeTab === "platinum-lounge" && (user?.tier === "Platinum" || user?.tier === "Diamond") && (
            <motion.div
              key="platinum-lounge"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-7xl mx-auto px-6 py-12 space-y-12 mt-16 md:mt-24"
            >
              {/* Premium Header */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950 via-[#131124] to-slate-950 border border-teal-500/30 p-8 md:p-16 text-center space-y-4 shadow-2xl">
                {/* Metallic sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-400/10 to-transparent -translate-x-full animate-shimmer pointer-events-none" />

                <div className="relative z-10 space-y-3 max-w-3xl mx-auto">
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
                    <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-teal-400 uppercase">
                      VERO SANCTUARY
                    </span>
                    <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
                  </div>
                  <h1 className="font-serif text-3xl md:text-5xl text-white font-bold tracking-wide">
                    The Platinum Lounge
                  </h1>
                  <p className="font-serif text-sm md:text-base text-teal-100/70 italic leading-relaxed">
                    "صالة النخبة الخاصة بأعضاء البلاتينيوم والدايموند - عروض حصرية وقطع نادرة صممت خصيصاً لكم ولا يراها غيركم."
                  </p>
                  <p className="font-sans text-xs font-light text-slate-400 tracking-wider max-w-xl mx-auto leading-relaxed">
                    An exclusive private showcase of bespoke masterpieces crafted by our head artisans in Florence. These works of art are strictly reserved for our top tier collectors.
                  </p>
                </div>
              </div>

              {/* Secret Offers Grid */}
              <div className="space-y-6">
                <div className="border-b border-brand-outline-variant/30 pb-3 flex justify-between items-end">
                  <div>
                    <h4 className="font-serif text-xl text-brand-umber font-semibold">Secret Collections</h4>
                    <p className="text-[10px] text-brand-outline font-sans tracking-wide uppercase mt-1">Certified Bespoke Creations</p>
                  </div>
                  <span className="text-[10px] font-mono font-semibold bg-teal-50 text-teal-700 px-3 py-1 border border-teal-100 rounded-full">
                    3 Masterpieces Available
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {LOUNGE_PRODUCTS.map((prod) => (
                    <motion.div
                      key={prod.id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="bg-white border border-[#c5a880]/15 rounded-2xl overflow-hidden shadow-md flex flex-col group hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative aspect-[4/3] bg-brand-surface-low overflow-hidden">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-teal-500 text-white text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow">
                          Bespoke Only
                        </div>
                      </div>

                      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <h5 className="font-serif text-sm font-bold text-brand-umber tracking-wide">
                            {prod.name}
                          </h5>
                          <p className="text-[11px] text-brand-outline font-light leading-relaxed">
                            {prod.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#c5a880]/10 flex justify-between items-center">
                          <div>
                            <p className="text-[8px] uppercase tracking-widest text-brand-outline">Collector Price</p>
                            <p className="font-mono text-xs font-bold text-teal-700">EGP {prod.price.toLocaleString()}</p>
                          </div>

                          <button
                            onClick={() => {
                              handleAddToBag(prod, "Platinum", "One Size", 1);
                              setAppNotification(`Added ${prod.name} to your Private Bag`);
                            }}
                            className="bg-slate-900 hover:bg-teal-700 text-white text-[9px] uppercase tracking-widest font-bold px-4 py-2 rounded-lg transition-all active:scale-95"
                          >
                            Acquire Piece
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Private Concierge Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                <div className="bg-[#f0f9ff]/40 border border-blue-200/50 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-serif text-sm font-bold text-slate-800">Private Design Concierge</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      "تواصل مباشرة مع كبير المصممين لدينا في فلورنسا لصياغة قطعة فريدة مصنوعة خصيصاً من أجلك."
                    </p>
                    <p className="text-[10px] text-slate-500 font-light leading-relaxed">
                      As a Platinum / Diamond member, you have a direct priority communication channel for absolute custom jewelry creations.
                    </p>
                    <button
                      onClick={() => setAppNotification("Your personal design concierge has been notified. They will contact you shortly.")}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all"
                    >
                      Request Private Call
                    </button>
                  </div>
                </div>

                <div className="bg-[#fdf8f6]/50 border border-orange-200/50 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-serif text-sm font-bold text-slate-800">Exclusive Florence Luxury Invite</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      "دعوة خاصة لحضور معرض فيرو الفاخر القادم بفلورنسا الإيطالية - شامل الشحن الجوي السريع وتذكرة الطيران."
                    </p>
                    <p className="text-[10px] text-slate-500 font-light leading-relaxed">
                      Complimentary business-class flight and premium boutique tour in Florence, fully taken care of by the VERO luxury program.
                    </p>
                    <button
                      onClick={() => setAppNotification("Your invitation coordinates are being assembled. Our travel advisor will reach out today.")}
                      className="mt-2 bg-slate-900 hover:bg-slate-800 text-white text-[8px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all"
                    >
                      Acquire Lounge Invite
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "admin" && user?.email?.toLowerCase() === "vero2026@vero.com" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="max-w-7xl mx-auto px-6 py-6 md:py-12"
            >
              <AdminPanel
                products={products}
                setProducts={setProducts}
                onResetDatabase={handleResetDatabase}
                onClose={() => setActiveTab("home")}
                onOpenSupabase={() => setActiveTab("supabase")}
                orders={orders}
                setOrders={setOrders}
                promos={promos}
                setPromos={setPromos}
                reviews={allReviews}
                onRefreshReviews={fetchReviews}
              />
            </motion.div>
          )}
        </AnimatePresence>
            }
          />
        </Routes>
      </main>

      {/* Footer component */}
      <Footer setActiveTab={handleTabChange} />

      {/* Mobile view Bottom Navbar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        cartCount={cartCount}
        user={user}
      />

      {/* Quick View Modal drawer */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToBag={handleAddToBag}
        onReservePreOrder={(prod) => {
          setPreOrderProduct(prod);
          setIsPreOrderModalOpen(true);
        }}
        isFavorited={quickViewProduct ? isFavorited(quickViewProduct.id) : false}
        toggleFavorite={toggleFavorite}
        user={user}
        userOrders={orders.filter((o) => o.shippingEmail?.toLowerCase() === user?.email?.toLowerCase() || o.email?.toLowerCase() === user?.email?.toLowerCase())}
        allReviews={allReviews}
        onRefreshReviews={fetchReviews}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Pre-Order Reservation Modal */}
      <PreOrderModal
        product={preOrderProduct}
        isOpen={isPreOrderModalOpen}
        onClose={() => setIsPreOrderModalOpen(false)}
      />

      {/* Private Member Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* VERO Welcome Bonus Modal */}
      <WelcomeBonusModal
        isOpen={showWelcomeBonusModal}
        onClose={() => setShowWelcomeBonusModal(false)}
        userName={user?.name}
        pointsAwarded={250}
      />

      {/* Search slider Panel overlay */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-[160] flex justify-end">
            {/* Overlay background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="absolute inset-0 bg-brand-umber/45 backdrop-blur-sm"
            />

            {/* Slider Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="relative w-full max-w-md h-full bg-brand-linen shadow-2xl border-l border-brand-outline-variant/30 flex flex-col z-10"
            >
              <div className="p-6 border-b border-brand-outline-variant/20 flex justify-between items-center bg-[#fff8f3]">
                <h3 className="font-serif text-lg text-brand-umber font-semibold uppercase tracking-wider">
                  Search Boutique
                </h3>
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-2 text-brand-outline hover:text-brand-gold transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-grow overflow-y-auto">
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter keywords (e.g. Ring, Watch)"
                    className="w-full bg-transparent border-b border-brand-outline-variant focus:border-brand-gold outline-none py-3 text-sm font-light tracking-wide focus:ring-0 pl-1"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-3 text-brand-outline/60 hover:text-brand-gold"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Popular categories shortcut suggestions */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-brand-umber uppercase tracking-widest block mb-1">
                    Suggested Categories
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.slice(1).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setSearchQuery("");
                          setSearchOpen(false);
                          setActiveTab("shop");
                        }}
                        className="px-3.5 py-2 bg-brand-surface-low border border-brand-outline-variant/20 hover:border-brand-gold rounded-full text-[10px] font-sans font-medium text-brand-outline hover:text-brand-gold uppercase tracking-wider transition-all"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-time searched results */}
                {searchQuery.trim() && (
                  <div className="space-y-4 pt-4 border-t border-brand-outline-variant/10">
                    <span className="text-[10px] font-bold text-brand-umber uppercase tracking-widest block mb-2">
                      Results Found ({filteredProducts.length})
                    </span>
                    <div className="space-y-4">
                      {filteredProducts.slice(0, 5).map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setSearchOpen(false);
                            handleProductDetailNavigate(prod);
                          }}
                          className="flex items-center gap-4 cursor-pointer group"
                        >
                          <div className="w-12 h-15 bg-brand-surface-low overflow-hidden rounded-sm shadow-sm">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-grow">
                            <h4 className="text-xs font-serif font-medium text-brand-umber group-hover:text-brand-gold transition-colors">
                              {prod.name}
                            </h4>
                            <p className="text-[10px] text-brand-outline font-light uppercase tracking-wider">
                              {prod.categoryName} • EGP {prod.price.toLocaleString()}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-brand-outline/30 group-hover:text-brand-gold transition-colors" />
                        </div>
                      ))}
                      {filteredProducts.length > 5 && (
                        <button
                          onClick={() => {
                            setSearchOpen(false);
                            setActiveTab("shop");
                          }}
                          className="w-full text-center text-xs text-brand-gold font-semibold underline underline-offset-4 uppercase tracking-widest pt-2 block"
                        >
                          View all results
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout secure Slide-over Panel overlay */}
      <CheckoutFlow
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartItems={cart}
        subtotal={cartSubtotal}
        deliveryFee={deliveryFee}
        discount={discountAmount}
        total={cartTotal}
        promoCode={activePromo}
        onClearCart={handleClearCart}
        onCheckoutSuccess={handleCheckoutSuccess}
        user={user}
        onUpdateUser={handleUpdateUser}
      />

      {/* App-wide Toast Notification banner */}
      <AnimatePresence>
        {appNotification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[250] bg-brand-umber text-white border border-brand-gold/30 px-6 py-4 shadow-2xl rounded-sm flex items-center gap-3.5 max-w-md w-[calc(100%-2rem)]"
          >
            <Info className="w-5 h-5 text-brand-gold shrink-0" />
            <p className="text-xs font-semibold tracking-wide text-brand-linen leading-relaxed flex-grow">
              {appNotification}
            </p>
            <button
              onClick={() => setAppNotification(null)}
              className="text-brand-outline/60 hover:text-white transition-colors shrink-0 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gold/Platinum/Diamond Member Welcome Overlay Screen */}
      <AnimatePresence>
        {showGoldWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 24, stiffness: 190 }}
              className="bg-gradient-to-br from-amber-950 via-[#1c1610] to-[#0c0a08] border-2 border-amber-400/40 p-8 md:p-12 rounded-3xl text-center max-w-md mx-4 shadow-[0_20px_60px_rgba(251,191,36,0.18)] relative overflow-hidden"
            >
              {/* Shimmer sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/15 to-transparent -translate-x-full animate-shimmer pointer-events-none" />

              <div className="relative z-10 space-y-6">
                {/* Large sparkling crown/badge */}
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                  <Sparkles className="w-8 h-8 text-amber-400 animate-spin" style={{ animationDuration: "8s" }} />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/80 font-bold">
                    VERO Elite Club
                  </p>
                  <h3 className="font-serif text-2xl text-amber-200 font-bold tracking-wide">
                    Welcome Back, {welcomeTier} Member ✨
                  </h3>
                  <p className="text-[11px] text-amber-100/60 font-serif italic max-w-xs mx-auto leading-relaxed">
                    "Every purchase unlocks a higher status. Welcome to our most exclusive luxury circle."
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowGoldWelcome(false)}
                    className="text-[9px] uppercase tracking-widest font-semibold border border-amber-400/35 hover:border-amber-400/60 text-amber-400 bg-amber-400/5 hover:bg-amber-400/10 px-5 py-2 rounded-full transition-all"
                  >
                    Enter Private Collection
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ⭐ Product Rating Overlay Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 bg-brand-umber/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 select-text">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#fffdfb] border border-brand-gold/30 p-6 md:p-8 max-w-md w-full shadow-2xl rounded-sm space-y-6 text-brand-umber text-right"
              dir="rtl"
            >
              <div className="flex justify-between items-center border-b border-brand-gold/10 pb-3" dir="ltr">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="text-brand-outline hover:text-brand-umber p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="font-serif text-base font-semibold text-brand-umber">
                  تقييم القطعة الفنية / Rate Jewel
                </h3>
              </div>

              {!ratingSubmitted ? (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <p className="text-xs text-brand-outline leading-relaxed">
                      يسعدنا سماع رأيك الثمين حول الجودة، ومواصفات الصياغة اليدوية بعد الاستلام.
                    </p>
                    {/* Stars row */}
                    <div className="flex justify-center gap-1.5 py-3" dir="ltr">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingStars(star)}
                          className="hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= ratingStars
                                ? "text-brand-gold fill-brand-gold"
                                : "text-brand-outline-variant/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] text-brand-outline uppercase tracking-wider block font-semibold">
                      ملاحظاتك وتقييمك الفني / Artistry Review
                    </label>
                    <textarea
                      rows={3}
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="شاركنا شعورك عند ارتداء القطعة..."
                      className="w-full bg-[#fdfaf5] border border-brand-gold/20 p-3 text-xs rounded-sm focus:outline-none focus:border-brand-gold text-right"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRatingSubmitted(true);
                      triggerAppNotification("تم استلام تقييمك بنجاح! شكراً لمشاركتنا تجربتك الفاخرة.");
                    }}
                    className="w-full bg-brand-gold hover:bg-brand-umber text-white text-xs font-semibold py-3.5 rounded-sm transition-all shadow-sm tracking-widest uppercase cursor-pointer text-center"
                  >
                    إرسال التقييم / Submit Review
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mb-2 mx-auto">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <h4 className="font-serif text-lg font-bold text-brand-umber text-center">
                    تم استلام التقييم بنجاح!
                  </h4>
                  <p className="text-xs text-brand-outline leading-relaxed max-w-xs mx-auto text-center">
                    نشكرك جزيل الشكر على تقييمك الفاخر لمنتجات VERO. لقد تم تسجيل رأيك في أرشيف صالون النخبة وسيظهر للعملاء قريباً.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="border border-brand-gold/30 hover:bg-brand-linen/40 text-brand-umber text-xs font-semibold px-6 py-2.5 rounded-sm transition-all cursor-pointer block mx-auto"
                  >
                    إغلاق / Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 💬 Contact Support Overlay Modal */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 bg-brand-umber/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 select-text">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#fffdfb] border border-brand-gold/30 p-6 md:p-8 max-w-md w-full shadow-2xl rounded-sm space-y-6 text-brand-umber text-right"
              dir="rtl"
            >
              <div className="flex justify-between items-center border-b border-brand-gold/10 pb-3" dir="ltr">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="text-brand-outline hover:text-brand-umber p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="font-serif text-base font-semibold text-brand-umber">
                  خدمة عملاء النخبة / Elite Concierge Support
                </h3>
              </div>

              {!supportSubmitted ? (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <p className="text-xs text-brand-outline leading-relaxed text-center">
                      مدراء العلاقات الفاخرة متواجدون لمساعدتك فوراً بخصوص شحنتك، تعديل المقاسات، أو طلب قطعة مخصصة.
                    </p>
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] text-brand-outline uppercase tracking-wider block font-semibold">
                      كيف يمكننا خدمتك اليوم؟ / Support Request
                    </label>
                    <textarea
                      rows={4}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="أدخل رسالتك أو استفسارك هنا..."
                      className="w-full bg-[#fdfaf5] border border-brand-gold/20 p-3 text-xs rounded-sm focus:outline-none focus:border-brand-gold text-right"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSupportSubmitted(true);
                        triggerAppNotification("تم إرسال طلب الدعم بنجاح! سيتواصل معك أحد المستشارين.");
                      }}
                      className="w-full bg-brand-gold hover:bg-brand-umber text-white text-xs font-semibold py-3.5 rounded-sm transition-all shadow-sm tracking-widest uppercase cursor-pointer text-center"
                    >
                      إرسال الطلب / Send Message
                    </button>
                    
                    <a
                      href={`https://wa.me/201559907692?text=${encodeURIComponent("مرحباً VERO Boutique، أود الاستفسار عن منتج أو المساعدة في طلب.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-3.5 rounded-sm transition-all shadow-sm tracking-widest uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>💬 تواصل سريع عبر WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mb-2 mx-auto">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <h4 className="font-serif text-lg font-bold text-brand-umber text-center">
                    تم إرسال استفسارك بنجاح
                  </h4>
                  <p className="text-xs text-brand-outline leading-relaxed max-w-xs mx-auto text-center">
                    لقد تم إرسال رسالتك مباشرة لمدير العلاقات العامة لخدمة النخبة، وسنتواصل معك خلال دقائق مباشرة عبر الواتساب أو الهاتف المسجل بالطلب للرد على استفسارك بأسرع وقت.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSupportModal(false)}
                    className="border border-brand-gold/30 hover:bg-brand-linen/40 text-brand-umber text-xs font-semibold px-6 py-2.5 rounded-sm transition-all cursor-pointer block mx-auto"
                  >
                    إغلاق / Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
