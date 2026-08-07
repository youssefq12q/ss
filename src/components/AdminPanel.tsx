import React from "react";
import {
  Trash2,
  Plus,
  Edit2,
  Check,
  RotateCcw,
  PlusCircle,
  FileImage,
  Info,
  Layers,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Tag,
  AlignLeft,
  X,
  RefreshCw,
  Search,
  ShieldCheck,
  Lock,
  Unlock,
  Upload,
  Package,
  Gift,
  Award,
  Database,
  Users,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, Order, Reward, Promo, Review } from "../types";
import { CATEGORIES } from "../data";
import AdminReviewsManager from "./AdminReviewsManager";
import PriceDisplay from "./PriceDisplay";

interface AdminPanelProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onResetDatabase: () => void;
  onClose?: () => void;
  onOpenSupabase?: () => void;
  orders?: Order[];
  setOrders?: React.Dispatch<React.SetStateAction<Order[]>>;
  promos?: Promo[];
  setPromos?: React.Dispatch<React.SetStateAction<Promo[]>>;
  reviews?: Review[];
  onRefreshReviews?: () => void;
}

// Preset luxury images for easy selection by the user
const PRESET_IMAGES = [
  {
    name: "Golden Classic Ring",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAddIhaoIoctIr0SZvOxl2amgoVXs5GW4AyMZuYqzRetb-PH8shfjL6df3_PiwyH1Hq439E0Lx2BbcFBHSvkTXKFeVAyN92YRXuBaqw5zNRh1EeGjfO57TlVuURTAiBXcnB5JXznCQbwsDIBHNH4A67hRHjmOnUwZMTbvAfO3y2yBNdTetjXHWJtoZ6VB_1S7MgOifVHC4W8P2FoG_bM4ak1sMXvZPk3gc-CSGh5MJoRqjQIgpDVA9Ml4wexbNyxsv5WZItb_S1I58",
  },
  {
    name: "Classic Leather Bangle",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDX1p-uK0uxGwe-xPf4LECbNQnDpQJcqW5Jr2YX6Ra0MHk6ZdV47DDhFwL2t4uk-F03vVzVfNk88v-IYE043x2tQvF3X8Jj6qW9lkgQvcnmHfJpK5ybrDHJL6NZmzRIGQefgGFfHvSfLAXegiA3a5_s2x0bRJhjphz6rD0CEiJ7v01SWmhWJYNfQVRZCaL7fg7vqhNGHpiUImW4-5hst9s_FR3V1427zyirlzzqITw6CrhY-VSbVCahDYIUC6HF26HivG4KPS-2JWI",
  },
  {
    name: "Artisanal Timepiece",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2qzZ9-Ci55ZiMwGB8fudI_RR0HAUdvF20VU9LvhnWB024nsQ1AiUAuX5WPjX-QrxTLAXU9OHrxl-kyueIXrDx08qM_QgUhpXpgrFszL91bL1NaOaWoujJ0wlGu3E11Uvh2Zs6JGdMSasFktuL0bw2xagiuh8cTUdU9FgQ4a5Q4zezxTbNBtsJUqL-Xv3z9sszCiy18RBVOwkl2IoQ7XDbX4OMpHBNHfmlAizhiMESPgV1-jC25UnNXyIFVXZV19id6y1u95ZZlGo",
  },
  {
    name: "Hammered Gold Plaque",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAsi9aeHhpg3RMBi01qh4k0jUy0jgoWSIttLzScTn8AvhKokeNaS1rWYj0ZdWgXiJYjomuT_PotZNM1fjCLkI_6wrpLziLe0B8OjjTE-KjfP4jtq13i35rUAqk762UXJCWnaHa26yvrpvtee77qbqz16wxmXSJvIk-lkEe9A2roHZxwd6PZkBGH6wYYgfv5b0RSV5FNmxblesK8DFdiSH6gPFZyJ3R4918rMtNpbrQ_bCod0_jTJPCpYN4HTDG-eYfSGEBLzXYo-aY",
  },
  {
    name: "Luxury Calfskin Cardholder",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA55XK6inPikYx_KnduhFvjR4J4r-Fz_0_MZeirVYlQnJcPeo3B3yJbFLZxM2oUqj2K4hOYY0VewYoDXWp5MzATq0mNes3bavvaIuwaKC-v7bFmUPeG5D1UbHy40cYoAniwy7x5OMf602l7xaIr3pzsyO28iOD8e4hdSxVOIQPeN0U8dossai-1QVPhtz7XRb9b0NxL8vjc5GglkDdH37aQtDOcZHbyQ7h9Ad-kMAtUcJAOHqIhAi6YLgg8Dcgt8eQGSeia3zX9Wl0",
  },
];

export default function AdminPanel({
  products,
  setProducts,
  onResetDatabase,
  onClose,
  onOpenSupabase,
  orders = [],
  setOrders,
  promos = [],
  setPromos,
  reviews = [],
  onRefreshReviews,
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = React.useState<
    "catalog" | "add" | "analytics" | "orders" | "rewards" | "promos" | "users" | "reviews" | "auditLogs"
  >("orders");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);

  // Helper for Session Auth Headers
  const getAuthHeaders = React.useCallback(() => {
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
    return {
      "Content-Type": "application/json",
      "X-User-Email": userEmail,
      ...(token ? { "Authorization": `Bearer ${token}`, "X-Session-Token": token } : {})
    };
  }, []);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);

  const fetchAuditLogs = React.useCallback(async () => {
    try {
      const res = await fetch("/api/audit-logs", {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  }, [getAuthHeaders]);

  React.useEffect(() => {
    if (activeSubTab === "auditLogs") {
      fetchAuditLogs();
    }
  }, [activeSubTab, fetchAuditLogs]);

  // Users Sub-tab States
  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [userSearch, setUserSearch] = React.useState("");

  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await fetch("/api/users", {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, [getAuthHeaders]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUserPoints = async (userId: string, pointsToAdd: number) => {
    const userToUpdate = usersList.find((u) => u.id === userId || u.email === userId);
    if (!userToUpdate) return;
    const newPoints = (userToUpdate.loyaltyPoints || 0) + pointsToAdd;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ loyaltyPoints: newPoints }),
      });
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId || u.email === userId ? { ...u, loyaltyPoints: newPoints } : u))
        );
        setNotification({ text: `Added +${pointsToAdd} PTS to ${userToUpdate.name || userToUpdate.email}!`, type: "success" });
      }
    } catch (err) {
      console.error("Error updating user points:", err);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, { 
        method: "DELETE",
        headers: getAuthHeaders() 
      });
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId && u.email !== userEmail));
        setNotification({ text: `تم مسح حساب المستخدم (${userEmail}) بنجاح.`, type: "success" });
      } else {
        const errData = await res.json().catch(() => ({}));
        setNotification({ text: errData.error || "تعذر مسح حساب المستخدم.", type: "error" });
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      setNotification({ text: "حدث خطأ أثناء الاتصال بالخادم.", type: "error" });
    }
  };

  const handleClearAllUsers = async () => {
    try {
      const res = await fetch("/api/users/clear-all", { 
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await fetchUsers();
        setNotification({ text: "تم مسح جميع الحسابات المسجلة للعملاء بنجاح.", type: "success" });
      } else {
        const errData = await res.json().catch(() => ({}));
        setNotification({ text: errData.error || "تعذر مسح الحسابات.", type: "error" });
      }
    } catch (err) {
      console.error("Error clearing users:", err);
      setNotification({ text: "حدث خطأ أثناء الاتصال بالخادم.", type: "error" });
    }
  };

  // Orders Sub-tab States
  const [orderSearch, setOrderSearch] = React.useState("");
  const [orderStatusFilter, setOrderStatusFilter] = React.useState("all");
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = React.useState<string | null>(null);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        if (setOrders) {
          setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
        }
        setSelectedOrder(updatedOrder);
        setNotification({
          text: `Order status successfully updated to "${newStatus}"! Broadcasted in real-time.`,
          type: "success",
        });
      } else {
        setNotification({ text: "Failed to update order status.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setNotification({ text: "Network error updating order.", type: "error" });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        if (setOrders) {
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
        }
        setSelectedOrder(null);
        setNotification({
          text: "Order successfully deleted! Archive updated in real-time.",
          type: "success",
        });
      } else {
        setNotification({ text: "Failed to delete order.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setNotification({ text: "Error connecting to server.", type: "error" });
    }
  };

  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      // 1. Search filter
      const searchLower = orderSearch.toLowerCase();
      const formatAddrStr = (addr: any) => {
        if (!addr) return "";
        if (typeof addr === "string") return addr;
        if (typeof addr === "object") return addr.address || addr.fullName || addr.city || JSON.stringify(addr);
        return String(addr);
      };
      const matchesSearch =
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.shippingName?.toLowerCase().includes(searchLower) ||
        order.shippingEmail?.toLowerCase().includes(searchLower) ||
        formatAddrStr(order.shippingAddress).toLowerCase().includes(searchLower) ||
        order.shippingCity?.toLowerCase().includes(searchLower) ||
        order.shippingPhone?.toLowerCase().includes(searchLower) ||
        order.status?.toLowerCase().includes(searchLower);

      // 2. Status filter
      if (!matchesSearch) return false;
      if (orderStatusFilter === "all") return true;
      
      const statusLower = order.status?.toLowerCase() || "";
      if (orderStatusFilter === "pending") return statusLower.includes("pending") || statusLower.includes("انتظار");
      if (orderStatusFilter === "processing") return statusLower.includes("processing") || statusLower.includes("تحضير");
      if (orderStatusFilter === "transit") return statusLower.includes("transit") || statusLower.includes("شحن");
      if (orderStatusFilter === "delivered") return statusLower.includes("delivered") || statusLower.includes("توصيل") || statusLower.includes("complete");
      if (orderStatusFilter === "cancelled") return statusLower.includes("cancelled") || statusLower.includes("إلغاء") || statusLower.includes("cancel");

      return true;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Security Lock State
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    return localStorage.getItem("vero_admin_authenticated") === "true";
  });
  const [passwordAttempt, setPasswordAttempt] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  
  // Ref to hold the callback prevents any React function state update quirks or closure issues
  const pendingCallbackRef = React.useRef<(() => void) | null>(null);
  const [showLockModal, setShowLockModal] = React.useState(false);

  // Custom Confirmation Dialogs State
  const [productToDelete, setProductToDelete] = React.useState<{ id: string; name: string } | null>(null);
  const [orderToDelete, setOrderToDelete] = React.useState<{ id: string; orderNumber: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = React.useState(false);

  const handleClearAllProducts = () => {
    verifyAction(() => {
      setProducts([]);
      try {
        localStorage.setItem("vero_products", JSON.stringify([]));
      } catch (e) {
        // ignore
      }
      fetch("/api/products/clear", { 
        method: "POST",
        headers: getAuthHeaders()
      }).catch(console.error);
      triggerNotification("تم حذف جميع المنتجات بنجاح / All products have been cleared.", "success");
      setShowClearAllConfirm(false);
    });
  };

  const verifyAction = (callback: () => void) => {
    if (isAuthenticated) {
      callback();
    } else {
      pendingCallbackRef.current = callback;
      setShowLockModal(true);
    }
  };

  const handleLogoutAdmin = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("vero_admin_authenticated");
    triggerNotification("Logged out from Curator mode.", "success");
  };

  // Form Fields
  const [name, setName] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("rings");
  const [price, setPrice] = React.useState<number | "">("");
  const [originalPrice, setOriginalPrice] = React.useState<number | "">("");
  const [discountPercent, setDiscountPercent] = React.useState<number | "">("");
  const [pointsEarned, setPointsEarned] = React.useState<number | "">("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [additionalImages, setAdditionalImages] = React.useState<string[]>([]);
  const [tagline, setTagline] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isNew, setIsNew] = React.useState(false);
  const [productType, setProductType] = React.useState<"regular" | "preorder">("regular");
  const [materialOptions, setMaterialOptions] = React.useState<string>("#E5D5BC, #E5E4E2");
  const [sizeOptions, setSizeOptions] = React.useState<string>("Standard, Premium");
  const [details, setDetails] = React.useState<string>("W3C-Validated clean markup structures, Fully accessible (WCAG 2.1 AA compliant)");
  const [craftsmanship, setCraftsmanship] = React.useState("");
  const [stock, setStock] = React.useState<number | "">("");

  // Price & Discount auto-calculator handlers
  const handlePriceChange = (newPriceVal: number | "") => {
    setPrice(newPriceVal);
    if (typeof newPriceVal === "number" && typeof originalPrice === "number" && originalPrice > newPriceVal) {
      setDiscountPercent(Math.round(((originalPrice - newPriceVal) / originalPrice) * 100));
    }
    // Auto calculate points (e.g. 1 point for every 10 EGP or ~10% of price) if points not manually set
    if (typeof newPriceVal === "number" && newPriceVal > 0 && pointsEarned === "") {
      setPointsEarned(Math.round(newPriceVal * 0.1));
    }
  };

  const handleOriginalPriceChange = (newOrigVal: number | "") => {
    setOriginalPrice(newOrigVal);
    if (typeof price === "number" && typeof newOrigVal === "number" && newOrigVal > price) {
      setDiscountPercent(Math.round(((newOrigVal - price) / newOrigVal) * 100));
    } else if (newOrigVal === "" || (typeof price === "number" && typeof newOrigVal === "number" && newOrigVal <= price)) {
      setDiscountPercent("");
    }
  };

  const handleDiscountPercentChange = (newPctVal: number | "") => {
    setDiscountPercent(newPctVal);
    if (typeof price === "number" && typeof newPctVal === "number" && newPctVal > 0 && newPctVal < 100) {
      const calculatedOriginal = Math.round(price / (1 - newPctVal / 100));
      setOriginalPrice(calculatedOriginal);
    }
  };

  // Feedback notifications
  const [notification, setNotification] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const triggerNotification = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Pre-fill form when editing
  React.useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setCategoryId(editingProduct.categoryId);
      setPrice(editingProduct.price);
      setOriginalPrice(editingProduct.originalPrice !== undefined ? editingProduct.originalPrice : "");
      setDiscountPercent(editingProduct.discountPercent !== undefined ? editingProduct.discountPercent : "");
      setPointsEarned(editingProduct.pointsEarned !== undefined ? editingProduct.pointsEarned : "");
      setImageUrl(editingProduct.image);
      
      // Parse secondary/additional images (exclude primary image if duplicate)
      if (editingProduct.secondaryImages && editingProduct.secondaryImages.length > 0) {
        const primary = editingProduct.image;
        const others = editingProduct.secondaryImages.filter((img) => img !== primary);
        setAdditionalImages(others);
      } else {
        setAdditionalImages([]);
      }

      setTagline(editingProduct.tagline);
      setDescription(editingProduct.description);
      setIsNew(!!editingProduct.isNew);
      setProductType(editingProduct.isPreOrder ? "preorder" : "regular");
      setMaterialOptions(editingProduct.materialOptions?.join(", ") || "");
      setSizeOptions(editingProduct.sizeOptions?.join(", ") || "");
      setDetails(editingProduct.details?.join(", ") || "");
      setCraftsmanship(editingProduct.craftsmanship || "");
      setStock(editingProduct.stock !== undefined ? editingProduct.stock : "");
    } else {
      resetForm();
    }
  }, [editingProduct]);

  const resetForm = () => {
    setName("");
    setCategoryId("rings");
    setPrice("");
    setOriginalPrice("");
    setDiscountPercent("");
    setPointsEarned("");
    setImageUrl("");
    setAdditionalImages([]);
    setTagline("");
    setDescription("");
    setIsNew(false);
    setProductType("regular");
    setMaterialOptions("#E5D5BC, #E5E4E2");
    setSizeOptions("Standard, Premium");
    setDetails("W3C-Validated clean markup structures, Fully accessible (WCAG 2.1 AA compliant)");
    setCraftsmanship("");
    setStock("");
  };

  // --- REWARDS MANAGEMENT STATE & LOGIC ---
  const [rewards, setRewards] = React.useState<Reward[]>([]);
  const [rewardTitle, setRewardTitle] = React.useState("");
  const [rewardTitleEn, setRewardTitleEn] = React.useState("");
  const [rewardCost, setRewardCost] = React.useState<number | "">("");
  const [rewardPercent, setRewardPercent] = React.useState<number | "">("");
  const [rewardCode, setRewardCode] = React.useState("");
  const [rewardDescription, setRewardDescription] = React.useState("");
  const [rewardDescriptionEn, setRewardDescriptionEn] = React.useState("");

  const fetchRewards = () => {
    fetch("/api/rewards", {
      headers: getAuthHeaders()
    })
      .then((res) => res.json())
      .then((data) => setRewards(data))
      .catch((err) => console.error("Error loading rewards:", err));
  };

  React.useEffect(() => {
    if (activeSubTab === "rewards") {
      fetchRewards();
    }
  }, [activeSubTab]);

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTitle || !rewardTitleEn || !rewardCost || !rewardCode || !rewardPercent) {
      triggerNotification("Please fill in all required fields.", "error");
      return;
    }

    const payload = {
      title: rewardTitle,
      titleEn: rewardTitleEn,
      cost: Number(rewardCost),
      code: rewardCode,
      description: rewardDescription,
      descriptionEn: rewardDescriptionEn,
      discountPercent: Number(rewardPercent),
    };

    fetch("/api/rewards", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        setRewards(data);
        triggerNotification("Reward created successfully!", "success");
        // Reset rewards form
        setRewardTitle("");
        setRewardTitleEn("");
        setRewardCost("");
        setRewardPercent("");
        setRewardCode("");
        setRewardDescription("");
        setRewardDescriptionEn("");
      })
      .catch((err) => {
        console.error("Error adding reward:", err);
        triggerNotification("Failed to add reward.", "error");
      });
  };

  const handleDeleteReward = (id: string) => {
    fetch(`/api/rewards/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRewards(data);
        } else {
          setRewards((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== id) : []));
        }
        triggerNotification("Reward deleted successfully!", "success");
      })
      .catch((err) => {
        console.error("Error deleting reward:", err);
        setRewards((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== id) : []));
        triggerNotification("Reward deleted successfully!", "success");
      });
  };

  // --- GENERAL PROMO CODES MANAGEMENT STATE & LOGIC ---
  const [promoCodeInput, setPromoCodeInput] = React.useState("");
  const [promoDiscountInput, setPromoDiscountInput] = React.useState(10);

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) {
      triggerNotification("Please enter a valid coupon code / الرجاء إدخال كود الخصم.", "error");
      return;
    }

    const payload = {
      code: promoCodeInput.trim().toUpperCase(),
      discountPercent: Number(promoDiscountInput)
    };

    fetch("/api/promos", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (setPromos) {
          if (Array.isArray(data)) {
            setPromos(data);
          } else if (data && (data.code || data.id)) {
            const newPromoItem: Promo = {
              id: data.id || data.code,
              code: data.code || payload.code,
              discountPercent: Number(data.discountPercent || data.discount_percent || payload.discountPercent),
              isActive: true,
              description: `Save ${data.discountPercent || payload.discountPercent}% on luxury catalog`
            };
            setPromos((prev) => (Array.isArray(prev) ? [newPromoItem, ...prev] : [newPromoItem]));
          }
        }
        triggerNotification("Promo code created successfully! / تم إنشاء كود الخصم بنجاح!", "success");
        setPromoCodeInput("");
        setPromoDiscountInput(10);
      })
      .catch((err) => {
        console.error("Error adding promo code:", err);
        triggerNotification("Failed to add promo code.", "error");
      });
  };

  const handleDeletePromo = (id: string) => {
    fetch(`/api/promos/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (setPromos) {
          if (Array.isArray(data)) {
            setPromos(data);
          } else {
            setPromos((prev) => (Array.isArray(prev) ? prev.filter((p) => p.id !== id && p.code !== id) : []));
          }
        }
        triggerNotification("Promo code deleted successfully! / تم حذف كود الخصم بنجاح!", "success");
      })
      .catch((err) => {
        console.error("Error deleting promo code:", err);
        if (setPromos) {
          setPromos((prev) => (Array.isArray(prev) ? prev.filter((p) => p.id !== id && p.code !== id) : []));
        }
        triggerNotification("Promo code deleted successfully! / تم حذف كود الخصم بنجاح!", "success");
      });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      triggerNotification("Product name is required.", "error");
      return;
    }
    if (!price || Number(price) <= 0) {
      triggerNotification("Please enter a valid price.", "error");
      return;
    }
    if (!imageUrl.trim()) {
      triggerNotification("Please enter or select an image URL.", "error");
      return;
    }

    const selectedCategoryObj = CATEGORIES.find((cat) => cat.id === categoryId);
    const categoryName = selectedCategoryObj ? selectedCategoryObj.name : "Fine Jewelry";

    const productData: Product = {
      id: editingProduct ? editingProduct.id : `custom-${Date.now()}`,
      name: name.trim(),
      categoryId,
      categoryName,
      price: Number(price),
      originalPrice: originalPrice === "" ? undefined : Number(originalPrice),
      discountPercent: discountPercent === "" ? undefined : Number(discountPercent),
      pointsEarned: pointsEarned === "" ? undefined : Number(pointsEarned),
      image: imageUrl.trim(),
      secondaryImages: [imageUrl.trim(), ...additionalImages.map((img) => img.trim()).filter(Boolean)],
      tagline: tagline.trim() || `"${name.trim()} by VERO Boutique"`,
      description: description.trim() || "An authentic quiet luxury piece hand-finished with exceptional Italian craftsmanship.",
      isNew,
      isPreOrder: productType === "preorder",
      materialOptions: materialOptions.split(",").map((s) => s.trim()).filter(Boolean),
      sizeOptions: sizeOptions.split(",").map((s) => s.trim()).filter(Boolean),
      details: details.split(",").map((s) => s.trim()).filter(Boolean),
      craftsmanship: craftsmanship.trim() || undefined,
      stock: stock === "" ? undefined : Number(stock),
    };

    const proceed = () => {
      if (editingProduct) {
        // Edit mode
        setProducts((prev) =>
          prev.map((prod) => (prod.id === editingProduct.id ? productData : prod))
        );
        triggerNotification(`"${name}" updated successfully.`);
        setEditingProduct(null);
      } else {
        // Create mode
        setProducts((prev) => [productData, ...prev]);
        triggerNotification(`"${name}" created successfully.`);
      }

      resetForm();
      setActiveSubTab("catalog");
    };

    verifyAction(proceed);
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
  };

  const confirmDeleteProduct = () => {
    if (!productToDelete) return;
    const { id, name } = productToDelete;
    verifyAction(() => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      triggerNotification(`"${name}" has been removed from the boutique.`);
      setProductToDelete(null);
    });
  };

  const handleToggleNewArrival = (productId: string) => {
    verifyAction(() => {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isNew: !p.isNew } : p))
      );
      triggerNotification("Updated product badge.");
    });
  };

  const filteredCatalog = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q) ||
      p.price.toString().includes(q)
    );
  });

  // Simple diagnostics stats
  const totalItems = products.length;
  const avgPrice = Math.round(products.reduce((sum, p) => sum + p.price, 0) / (totalItems || 1));
  const newArrivalsCount = products.filter((p) => p.isNew).length;

  return (
    <div className="bg-white border border-brand-outline-variant/30 rounded-sm overflow-hidden shadow-sm select-text font-sans">
      {/* Admin Panel Header */}
      <div className="bg-brand-umber text-brand-linen p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-brand-gold/20 text-brand-gold text-[10px] uppercase tracking-[0.2em] font-semibold px-2 py-0.5 rounded border border-brand-gold/30">
              Admin Control Center
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-light tracking-wide">
            Boutique Catalog Manager
          </h2>
          <p className="text-xs text-brand-linen/60 font-light">
            Live local database overrides. Add, remove, or modify VERO's catalog instantly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-sm text-xs font-mono">
              <Unlock className="w-3.5 h-3.5" />
              <span>المشرف نشط / Curator Mode Active</span>
              <button
                onClick={handleLogoutAdmin}
                className="hover:text-white underline text-[10px] ml-1.5 font-sans animate-pulse"
                title="Lock Curator Mode"
              >
                (قفل / Lock)
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                verifyAction(() => {
                  triggerNotification("Curator mode authorized.", "success");
                });
              }}
              className="flex items-center gap-1.5 bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25 border border-brand-gold/30 px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>فتح وضع المشرف / Unlock Admin</span>
            </button>
          )}

          <button
            onClick={() => {
              setShowResetConfirm(true);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-gold hover:text-white border border-brand-gold/30 hover:border-white/50 px-4 py-2.5 rounded-sm transition-all bg-brand-gold/5 cursor-pointer"
            title="Reset Catalog to Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Curator Reset</span>
          </button>

          <button
            onClick={() => {
              setShowClearAllConfirm(true);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-white border border-rose-500/30 hover:border-rose-400/50 px-4 py-2.5 rounded-sm transition-all bg-rose-500/10 cursor-pointer"
            title="Delete all products from catalog"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف جميع المنتجات / Clear All</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 bg-brand-linen/10 hover:bg-brand-linen/20 rounded text-brand-linen transition-colors"
              aria-label="Close Admin Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Internal Tabs Navigation */}
      <div className="border-b border-brand-outline-variant/20 bg-brand-linen/20 px-6 md:px-8 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 py-3">
        <div className="flex items-center gap-1 border border-brand-outline-variant/20 rounded p-0.5 bg-white w-fit">
          <button
            onClick={() => {
              setActiveSubTab("orders");
              setEditingProduct(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all rounded-[2px] flex items-center gap-1.5 ${
              activeSubTab === "orders"
                ? "bg-brand-gold text-white"
                : "text-brand-outline hover:text-brand-umber"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders ({orders.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab("catalog");
              setEditingProduct(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all rounded-[2px] ${
              activeSubTab === "catalog" && !editingProduct
                ? "bg-brand-umber text-white"
                : "text-brand-outline hover:text-brand-umber"
            }`}
          >
            Product Catalog ({totalItems})
          </button>
          <button
            onClick={() => {
              setActiveSubTab("add");
              setEditingProduct(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all rounded-[2px] flex items-center gap-1 ${
              activeSubTab === "add" || editingProduct
                ? "bg-brand-umber text-white"
                : "text-brand-outline hover:text-brand-umber"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingProduct ? "Edit Product" : "Add Product"}</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab("analytics");
              setEditingProduct(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all rounded-[2px] ${
              activeSubTab === "analytics"
                ? "bg-brand-umber text-white"
                : "text-brand-outline hover:text-brand-umber"
            }`}
          >
            System Status
          </button>
          <button
            onClick={() => {
              setActiveSubTab("rewards");
              setEditingProduct(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all rounded-[2px] flex items-center gap-1.5 ${
              activeSubTab === "rewards"
                ? "bg-brand-umber text-white"
                : "text-brand-outline hover:text-brand-umber"
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Rewards Management</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab("promos");
              setEditingProduct(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all rounded-[2px] flex items-center gap-1.5 ${
              activeSubTab === "promos"
                ? "bg-brand-umber text-white"
                : "text-brand-outline hover:text-brand-umber"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Promo Codes Manager</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab("users");
              setEditingProduct(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all rounded-[2px] flex items-center gap-1.5 ${
              activeSubTab === "users"
                ? "bg-brand-umber text-white"
                : "text-brand-outline hover:text-brand-umber"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>المستخدمين / Users ({usersList.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab("reviews");
              setEditingProduct(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all rounded-[2px] flex items-center gap-1.5 ${
              activeSubTab === "reviews"
                ? "bg-brand-gold text-white"
                : "text-brand-outline hover:text-brand-umber"
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>التقييمات / Reviews ({reviews.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab("auditLogs");
              setEditingProduct(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all rounded-[2px] flex items-center gap-1.5 ${
              activeSubTab === "auditLogs"
                ? "bg-emerald-700 text-white"
                : "text-brand-outline hover:text-brand-umber"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>سجل الأمان / Audit Logs</span>
          </button>
          {onOpenSupabase && (
            <button
              onClick={onOpenSupabase}
              className="px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all rounded-[2px] bg-emerald-700/10 hover:bg-emerald-700/20 text-emerald-800 border border-emerald-600/30 flex items-center gap-1.5"
              title="Open Supabase Studio (Admin Only)"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase Studio</span>
            </button>
          )}
        </div>

        {activeSubTab === "catalog" && !editingProduct && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-outline/60" />
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-brand-outline-variant/40 text-xs px-10 py-2 rounded-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/20 w-full sm:w-60 text-brand-umber"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-outline hover:text-brand-umber text-[10px]"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Panel Content Body */}
      <div className="p-6 md:p-8">
        {/* Dynamic feedback notification block */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded border text-xs font-medium flex items-center gap-2.5 shadow-sm ${
                notification.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{notification.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {activeSubTab === "orders" && (
          <div className="space-y-6 animate-fadeIn text-left">
            {/* Stats Header Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-brand-linen/10 border border-brand-outline-variant/20 p-4 rounded-sm">
                <span className="text-[10px] text-brand-outline font-bold uppercase tracking-widest block">Total Orders</span>
                <span className="text-2xl font-serif text-brand-umber mt-1 block">{orders.length}</span>
              </div>
              <div className="bg-brand-linen/10 border border-brand-outline-variant/20 p-4 rounded-sm">
                <span className="text-[10px] text-brand-outline font-bold uppercase tracking-widest block">Total Revenue</span>
                <span className="text-2xl font-serif text-brand-gold mt-1 block">EGP {orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()}</span>
              </div>
              <div className="bg-brand-linen/10 border border-brand-outline-variant/20 p-4 rounded-sm">
                <span className="text-[10px] text-brand-outline font-bold uppercase tracking-widest block">Pending / قيد الانتظار</span>
                <span className="text-2xl font-serif text-amber-600 mt-1 block">
                  {orders.filter(o => o.status?.toLowerCase().includes("pending") || o.status?.includes("انتظار")).length}
                </span>
              </div>
              <div className="bg-brand-linen/10 border border-brand-outline-variant/20 p-4 rounded-sm">
                <span className="text-[10px] text-brand-outline font-bold uppercase tracking-widest block">Delivered / تم التوصيل</span>
                <span className="text-2xl font-serif text-emerald-600 mt-1 block">
                  {orders.filter(o => o.status?.toLowerCase().includes("delivered") || o.status?.includes("توصيل") || o.status?.toLowerCase().includes("complete")).length}
                </span>
              </div>
            </div>

            {/* Filtering Controls */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-outline/60" />
                <input
                  type="text"
                  placeholder="البحث بالاسم، الرقم، الإيميل أو العنوان..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="bg-white border border-brand-outline-variant/40 text-xs px-10 py-2.5 rounded-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/20 w-full text-brand-umber"
                />
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-outline hover:text-brand-umber text-[10px]"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-brand-outline uppercase tracking-wider font-semibold shrink-0">Filter:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-white border border-brand-outline-variant/40 text-xs px-3 py-2.5 rounded-sm text-brand-umber outline-none focus:border-brand-gold"
                >
                  <option value="all">All Statuses / كل الحالات</option>
                  <option value="pending">Pending / قيد الانتظار</option>
                  <option value="processing">Processing / قيد التحضير</option>
                  <option value="transit">In Transit / قيد الشحن</option>
                  <option value="delivered">Delivered / تم التوصيل</option>
                  <option value="cancelled">Cancelled / تم الإلغاء</option>
                </select>
              </div>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Side: Order List */}
              <div className="lg:col-span-2 space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-brand-outline-variant/30 rounded bg-brand-linen/10 space-y-3">
                    <ShoppingBag className="w-10 h-10 text-brand-outline/40 mx-auto animate-pulse" />
                    <p className="text-xs text-brand-outline font-light">No orders match the criteria / لا توجد طلبات تطابق الفلتر</p>
                  </div>
                ) : (
                  <div className="bg-white border border-brand-outline-variant/25 rounded overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-brand-linen/10 border-b border-brand-outline-variant/20 text-brand-outline uppercase tracking-wider text-[10px] font-bold">
                            <th className="p-4">Order Num / الرقم</th>
                            <th className="p-4">Customer / العميل</th>
                            <th className="p-4">Date / التاريخ</th>
                            <th className="p-4">Total / الإجمالي</th>
                            <th className="p-4">Status / الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-outline-variant/10">
                          {filteredOrders.map((order) => {
                            const isSelected = selectedOrder?.id === order.id;
                            let badgeClass = "bg-amber-50 text-amber-700 border-amber-200/50";
                            const statusLower = order.status?.toLowerCase() || "";
                            if (statusLower.includes("delivered") || statusLower.includes("توصيل") || statusLower.includes("completed")) {
                              badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200/50";
                            } else if (statusLower.includes("cancelled") || statusLower.includes("إلغاء") || statusLower.includes("cancel")) {
                              badgeClass = "bg-rose-50 text-rose-700 border-rose-200/50";
                            } else if (statusLower.includes("transit") || statusLower.includes("شحن")) {
                              badgeClass = "bg-cyan-50 text-cyan-700 border-cyan-200/50";
                            } else if (statusLower.includes("processing") || statusLower.includes("تحضير")) {
                              badgeClass = "bg-blue-50 text-blue-700 border-blue-200/50";
                            }

                            return (
                              <tr
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className={`cursor-pointer transition-colors hover:bg-brand-linen/5 ${
                                  isSelected ? "bg-brand-linen/15 font-semibold" : ""
                                }`}
                              >
                                <td className="p-4 font-mono font-bold text-brand-gold">
                                  #{order.orderNumber}
                                </td>
                                <td className="p-4">
                                  <div className="font-medium text-brand-umber">{order.shippingName}</div>
                                  <div className="text-[10px] text-brand-outline/80 font-light">{order.shippingCity}</div>
                                </td>
                                <td className="p-4 text-brand-outline/90 font-light">{order.date}</td>
                                <td className="p-4 font-semibold text-brand-umber">EGP {order.total?.toLocaleString()}</td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium border ${badgeClass}`}>
                                    {order.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Order Detail Drawer Panel */}
              <div className="lg:col-span-1">
                <AnimatePresence mode="wait">
                  {selectedOrder ? (
                    <motion.div
                      key={selectedOrder.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="bg-brand-linen/5 border border-brand-gold/25 rounded p-5 space-y-6 text-left"
                    >
                      <div className="flex justify-between items-center border-b border-brand-outline-variant/20 pb-3">
                        <div>
                          <h3 className="font-serif text-base text-brand-umber font-bold">
                            Order #{selectedOrder.orderNumber}
                          </h3>
                          <p className="text-[10px] text-brand-outline font-light mt-0.5">
                            Placed on {selectedOrder.date}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="text-brand-outline hover:text-brand-umber text-xs uppercase font-bold tracking-widest"
                        >
                          Deselect
                        </button>
                      </div>

                      {/* Customer Summary details */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] uppercase font-bold tracking-wider text-brand-outline">Customer Details / العميل</h4>
                        <div className="text-xs space-y-1.5 text-brand-umber font-light">
                          <p><strong className="font-medium">Name:</strong> {selectedOrder.shippingName}</p>
                          <p><strong className="font-medium">Email:</strong> {selectedOrder.shippingEmail}</p>
                          <p><strong className="font-medium">Phone / الهاتف:</strong> {selectedOrder.shippingPhone || "Not Provided / غير متوفر"}</p>
                          <p><strong className="font-medium">Address:</strong> {typeof selectedOrder.shippingAddress === 'object' && selectedOrder.shippingAddress !== null ? ((selectedOrder.shippingAddress as any).address || JSON.stringify(selectedOrder.shippingAddress)) : String(selectedOrder.shippingAddress || "")}</p>
                          <p><strong className="font-medium">City:</strong> {selectedOrder.shippingCity}</p>
                        </div>
                      </div>

                      {/* Status Control Switcher */}
                      <div className="space-y-3 bg-white p-3 border border-brand-outline-variant/15 rounded-sm">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-brand-outline">Update Status / تحديث حالة الطلب</label>
                          {updatingOrderId === selectedOrder.id && (
                            <span className="text-[9px] text-brand-gold animate-pulse font-medium">Saving...</span>
                          )}
                        </div>
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                          className="w-full bg-brand-linen/5 border border-brand-outline-variant/40 rounded-sm text-xs p-2 text-brand-umber font-semibold outline-none focus:border-brand-gold"
                        >
                          <option value="تم تقديم الطلب">1. تم تقديم الطلب (Order Placed)</option>
                          <option value="تم تأكيد الطلب">2. تم تأكيد الطلب (Order Confirmed)</option>
                          <option value="جاري تحضير الطلب">3. جاري تحضير الطلب (Preparing Order)</option>
                          <option value="فحص الجودة">4. فحص الجودة (Quality Check)</option>
                          <option value="تم التغليف">5. تم التغليف (Packed)</option>
                          <option value="جاهز للشحن">6. جاهز للشحن (Ready for Shipment)</option>
                          <option value="جاري التوصيل">7. جاري التوصيل (Out for Delivery)</option>
                          <option value="تم التسليم">8. تم التسليم (Delivered)</option>
                          <option value="تم إلغاء الطلب">تم إلغاء الطلب (Cancelled)</option>
                        </select>

                        {/* WhatsApp Communication Prompt */}
                        <a
                          href={`https://wa.me/${selectedOrder.shippingPhone ? selectedOrder.shippingPhone.replace(/[^0-9]/g, "") : "201102136064"}?text=${encodeURIComponent(
                            `مرحباً ${selectedOrder.shippingName}،\nيسعدنا إخطاركم بأن حالة طلبكم رقم #${selectedOrder.orderNumber} لدى Vero Boutique هي الآن: *${selectedOrder.status}*.\n\nتفاصيل الطلب:\nالقيمة الإجمالية: EGP ${selectedOrder.total?.toLocaleString()}\nالعنوان: ${typeof selectedOrder.shippingAddress === 'object' && selectedOrder.shippingAddress !== null ? ((selectedOrder.shippingAddress as any).address || JSON.stringify(selectedOrder.shippingAddress)) : String(selectedOrder.shippingAddress || "")}، ${selectedOrder.shippingCity}\n\nشكراً لتسوقكم معنا!`
                          )}`}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="mt-2.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-[11px] font-semibold py-2 px-3 text-center transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                          </svg>
                          <span>Send WhatsApp Update</span>
                        </a>
                      </div>

                      {/* Items Ordered */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] uppercase font-bold tracking-wider text-brand-outline">Items Ordered / المنتجات المطلوبة</h4>
                        <div className="divide-y divide-brand-outline-variant/10">
                          {selectedOrder.items?.map((item, idx) => (
                            <div key={idx} className="py-2 flex gap-3 items-center text-xs">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="w-10 h-10 object-cover rounded bg-brand-linen/10 shrink-0 border border-brand-outline-variant/10"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-brand-umber truncate">{item.product.name}</p>
                                <p className="text-[10px] text-brand-outline font-light">
                                  Size: {item.selectedSize} | Mat: {item.selectedMaterial}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-semibold text-brand-umber">{item.quantity}x</p>
                                <p className="text-[10px] text-brand-outline">EGP {item.product.price?.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Danger Zone: Delete Order */}
                      <div className="border-t border-brand-outline-variant/20 pt-4 flex justify-between items-center">
                        <span className="text-[10px] text-brand-outline/80 font-light">Clear order archive:</span>
                        <button
                          onClick={() => {
                            setOrderToDelete({ id: selectedOrder.id, orderNumber: selectedOrder.orderNumber });
                          }}
                          className="text-[10px] text-red-600 hover:text-red-700 hover:underline font-semibold uppercase tracking-wider cursor-pointer"
                        >
                          Delete Order
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="border border-dashed border-brand-outline-variant/20 rounded p-12 text-center text-brand-outline font-light text-xs bg-brand-linen/5 space-y-2">
                      <p>Select an order from the list to view complete shipping info, items breakdown, and issue real-time status updates.</p>
                      <p className="text-[10px] text-brand-gold font-medium">انقر على أي طلب لعرض التفاصيل وتحديث حالته فوراً.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "catalog" && !editingProduct && (
          <div className="space-y-6 animate-fadeIn">
            {filteredCatalog.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-brand-outline-variant/30 rounded bg-brand-linen/10 space-y-3">
                <ShoppingBag className="w-10 h-10 text-brand-outline/40 mx-auto" />
                <h3 className="font-serif text-lg text-brand-umber font-light">No items found</h3>
                <p className="text-xs text-brand-outline/80 font-light max-w-sm mx-auto">
                  Try clearing your search keyword or add a beautiful brand-new luxury accessory to get started.
                </p>
                <button
                  onClick={() => setActiveSubTab("add")}
                  className="bg-brand-gold text-white text-xs font-semibold py-2.5 px-6 uppercase tracking-wider rounded-sm hover:bg-brand-umber transition-colors"
                >
                  Create New Item
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-brand-outline-variant/20 rounded">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-brand-linen/40 text-brand-outline uppercase tracking-wider text-[10px] border-b border-brand-outline-variant/20">
                      <th className="py-4 px-6 font-semibold">Product Detail</th>
                      <th className="py-4 px-4 font-semibold">Category</th>
                      <th className="py-4 px-4 font-semibold">Price</th>
                      <th className="py-4 px-4 font-semibold text-center">الكمية / Stock</th>
                      <th className="py-4 px-4 font-semibold text-center">Arrival Status</th>
                      <th className="py-4 px-6 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-outline-variant/10">
                    {filteredCatalog.map((product) => (
                      <tr key={product.id} className="hover:bg-brand-linen/10 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded border border-brand-outline-variant/20 overflow-hidden bg-brand-linen/20 shrink-0">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-semibold text-brand-umber text-sm block">
                                {product.name}
                              </span>
                              <span className="text-[10px] text-brand-outline font-mono block">
                                ID: {product.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-brand-outline font-medium">
                          {product.categoryName}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-brand-umber text-sm">
                          <PriceDisplay
                            price={product.price}
                            originalPrice={product.originalPrice}
                            discountPercent={product.discountPercent}
                            size="xs"
                          />
                          {(product.pointsEarned || Math.round(product.price * 0.1)) > 0 && (
                            <span className="block mt-1 text-[10px] text-amber-700 font-sans font-semibold">
                              +{(product.pointsEarned || Math.round(product.price * 0.1))} نقطة VERO
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {product.stock !== undefined ? (
                            product.stock === 0 ? (
                              <span className="inline-block text-rose-600 bg-rose-50 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-rose-200">
                                Out of Stock
                              </span>
                            ) : (
                              <span className="inline-block text-brand-umber bg-brand-gold/10 px-2.5 py-1 rounded text-[10px] font-bold border border-brand-gold/20 font-mono">
                                {product.stock} pcs
                              </span>
                            )
                          ) : (
                            <span className="inline-block text-brand-outline bg-brand-linen/50 px-2.5 py-1 rounded text-[10px] font-medium italic">
                              Unlimited
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleToggleNewArrival(product.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-semibold tracking-wider uppercase transition-all border ${
                              product.isNew
                                ? "bg-brand-gold/10 text-brand-gold border-brand-gold/30 shadow-sm"
                                : "bg-brand-linen/35 text-brand-outline/60 border-brand-outline-variant/20 hover:border-brand-outline-variant/50"
                            }`}
                            title="Toggle New Arrival tag"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{product.isNew ? "New Arrival" : "Standard"}</span>
                          </button>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {product.isPreOrder ? (
                            <span className="inline-block text-amber-900 bg-amber-100 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-amber-300">
                              Pre-Order
                            </span>
                          ) : (
                            <span className="inline-block text-gray-600 bg-gray-100 px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-wider">
                              Regular
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="p-2 text-brand-outline hover:text-brand-umber hover:bg-brand-linen/30 rounded transition-colors border border-transparent hover:border-brand-outline-variant/20"
                              title="Edit product specs"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="p-2 text-rose-500 hover:text-white hover:bg-rose-500 rounded transition-all border border-transparent hover:border-rose-600"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {(activeSubTab === "add" || editingProduct) && (
          <form onSubmit={handleSaveProduct} className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            <div className="bg-brand-linen/15 border border-brand-outline-variant/10 p-5 rounded-sm space-y-1 mb-6 flex items-start gap-3">
              <Info className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-brand-gold uppercase tracking-wider block">
                  Quick Suggestion
                </span>
                <p className="text-xs text-brand-outline font-light leading-relaxed">
                  Avoid searching external sites for photo links. You can click on any of the VERO premium preset high-fidelity lifestyle photo URLs below to populate the image form field immediately!
                </p>
              </div>
            </div>

            {/* Premium Images preset selection drawer */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-brand-outline uppercase tracking-widest block">
                VERO High-End Asset presets (Click to select)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {PRESET_IMAGES.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setImageUrl(preset.url);
                      triggerNotification(`Loaded preset: "${preset.name}"`);
                    }}
                    className={`p-2 rounded border text-left text-[10px] font-medium transition-all flex flex-col gap-1.5 ${
                      imageUrl === preset.url
                        ? "border-brand-gold bg-brand-gold/5 ring-1 ring-brand-gold/30"
                        : "border-brand-outline-variant/20 bg-white hover:border-brand-gold/50"
                    }`}
                  >
                    <div className="aspect-square rounded overflow-hidden bg-brand-linen/10">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-brand-umber truncate block w-full">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-brand-outline-variant/10 my-8" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-outline" />
                  <span>Product Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Florentine Aurelia Earrings"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-xs px-4 py-3 outline-none focus:border-brand-gold text-brand-umber font-medium"
                />
              </div>

              {/* Product Price (EGP) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-brand-gold" />
                  <span>السعر الجديد (EGP) / Active Price *</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="مثال: 441"
                  value={price}
                  onChange={(e) => handlePriceChange(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-xs px-4 py-3 outline-none focus:border-brand-gold text-brand-umber font-medium font-mono"
                />
              </div>

              {/* Old Price (EGP) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span>السعر القديم (EGP) / Old Price</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="مثال: 688 (اختياري)"
                  value={originalPrice}
                  onChange={(e) => handleOriginalPriceChange(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-xs px-4 py-3 outline-none focus:border-brand-gold text-brand-umber font-medium font-mono"
                />
              </div>

              {/* Discount Percentage (%) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>نسبة الخصم (%) / Discount Percent</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    placeholder="مثال: 35 (تلقائي عند إدخال السعر القديم)"
                    value={discountPercent}
                    onChange={(e) => handleDiscountPercentChange(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-xs px-4 py-3 outline-none focus:border-brand-gold text-brand-umber font-medium font-mono pr-8"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-emerald-600">%</span>
                </div>
              </div>

              {/* VERO Points Earned Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>نقاط VERO المكتسبة عند الشراء / Points Earned</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="مثال: 50 (تلقائي بناءً على السعر أو ادخل تخصيصك)"
                    value={pointsEarned}
                    onChange={(e) => setPointsEarned(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-white border border-amber-200/80 rounded-sm text-xs px-4 py-3 outline-none focus:border-amber-500 text-brand-umber font-medium font-mono pr-12"
                  />
                  <span className="absolute right-3 top-3 text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    نقطة
                  </span>
                </div>
              </div>

              {/* Price & Points Preview Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-brand-gold" />
                  <span>معاينة العرض للعميل / Preview</span>
                </label>
                <div className="bg-brand-surface-low/60 border border-brand-gold/20 p-2.5 rounded-sm flex flex-wrap items-center justify-between gap-2 min-h-[42px]">
                  <PriceDisplay
                    price={Number(price) || 0}
                    originalPrice={originalPrice !== "" ? Number(originalPrice) : undefined}
                    discountPercent={discountPercent !== "" ? Number(discountPercent) : undefined}
                    size="sm"
                  />
                  {pointsEarned !== "" && Number(pointsEarned) > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100/80 text-amber-900 border border-amber-300 text-[11px] font-bold">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>تكسب +{pointsEarned} نقطة</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Category selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-outline" />
                  <span>Boutique Collection *</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-xs px-4 py-3 outline-none focus:border-brand-gold text-brand-umber font-medium"
                >
                  {CATEGORIES.filter((cat) => cat.id !== "all").map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Quantity */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-brand-outline" />
                  <span>كمية المخزون / Stock Quantity</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 10 (أتركه فارغاً ليكون غير محدود)"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-xs px-4 py-3 outline-none focus:border-brand-gold text-brand-umber font-medium font-mono"
                />
              </div>

              {/* Product Image Selection & Upload */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5 text-brand-outline" />
                  <span>صورة المنتج / Product Image *</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-brand-linen/5 p-4 border border-brand-outline-variant/20 rounded-sm">
                  {/* Left part: preview + File Selector */}
                  <div className="md:col-span-5 flex items-center gap-3 bg-white p-3 border border-dashed border-brand-outline-variant/30 rounded-sm">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded border border-brand-outline-variant/30 shrink-0 bg-white"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded border border-dashed border-brand-outline-variant/30 flex items-center justify-center bg-brand-linen/10 text-brand-outline/40 shrink-0">
                        <FileImage className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-brand-outline block mb-1">
                        رفع صورة من جهازك / Upload Local Image
                      </span>
                      <label className="inline-flex items-center gap-1.5 bg-brand-umber hover:bg-brand-gold text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-2 rounded cursor-pointer transition-colors">
                        <Upload className="w-3 h-3 text-brand-gold" />
                        <span>اختر ملف / Choose File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === "string") {
                                  setImageUrl(reader.result);
                                  triggerNotification("تم تحميل الصورة بنجاح! / Image loaded successfully!");
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Middle separator */}
                  <div className="md:col-span-1 text-center font-serif text-[10px] uppercase tracking-widest text-brand-outline/50 my-1 md:my-0">
                    أو / OR
                  </div>

                  {/* Right part: URL input */}
                  <div className="md:col-span-6 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand-outline block">
                      رابط صورة مباشر / Direct Image URL
                    </span>
                    <input
                      type="url"
                      placeholder="Paste direct HTTPS photo URL or select preset above"
                      value={imageUrl.startsWith("data:") ? "" : imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-xs px-4 py-3 outline-none focus:border-brand-gold text-brand-umber"
                    />
                    {imageUrl.startsWith("data:") && (
                      <span className="text-[9px] text-emerald-600 block font-medium">
                        ✓ تم رفع صورة من جهازك بنجاح ونشطة حالياً / Local uploaded image is currently active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Product Images */}
              <div className="space-y-4 md:col-span-2 bg-brand-linen/5 p-4 border border-brand-outline-variant/20 rounded-sm">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-brand-umber uppercase tracking-wider flex items-center gap-1.5">
                    <FileImage className="w-3.5 h-3.5 text-brand-gold" />
                    <span>صور إضافية للمنتج / Additional Product Images</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAdditionalImages([...additionalImages, ""])}
                    className="inline-flex items-center gap-1 bg-brand-gold hover:bg-brand-umber text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة صورة / Add Image</span>
                  </button>
                </div>

                {additionalImages.length === 0 ? (
                  <p className="text-[11px] text-brand-outline italic leading-relaxed">
                    لا توجد صور إضافية حالياً. سيتم عرض الصورة الأساسية فقط. / No additional images added yet. Only the main image will be displayed.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {additionalImages.map((imgUrl, idx) => (
                      <div key={idx} className="flex gap-3 items-center bg-white p-3 border border-brand-outline-variant/20 rounded-sm">
                        {/* Preview thumbnail */}
                        <div className="w-10 h-10 rounded border border-brand-outline-variant/30 flex items-center justify-center overflow-hidden shrink-0 bg-brand-linen/10">
                          {imgUrl ? (
                            <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <FileImage className="w-4 h-4 text-brand-outline/40" />
                          )}
                        </div>

                        {/* Input URL */}
                        <div className="flex-1">
                          <input
                            type="url"
                            placeholder="Paste additional image URL or upload below..."
                            value={imgUrl.startsWith("data:") ? "" : imgUrl}
                            onChange={(e) => {
                              const updated = [...additionalImages];
                              updated[idx] = e.target.value;
                              setAdditionalImages(updated);
                            }}
                            className="w-full bg-brand-linen/5 border border-brand-outline-variant/40 rounded-sm text-xs px-3 py-2 outline-none focus:border-brand-gold text-brand-umber"
                          />
                          {imgUrl.startsWith("data:") && (
                            <span className="text-[8px] text-emerald-600 block font-medium mt-0.5">
                              ✓ تم رفع الصورة بنجاح / Uploaded successfully
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* File Upload Button */}
                          <label className="p-2 bg-brand-linen hover:bg-brand-gold hover:text-white text-brand-umber rounded cursor-pointer transition-colors border border-brand-outline-variant/30">
                            <Upload className="w-3.5 h-3.5" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === "string") {
                                      const updated = [...additionalImages];
                                      updated[idx] = reader.result;
                                      setAdditionalImages(updated);
                                      triggerNotification("تم تحميل الصورة بنجاح! / Image loaded successfully!");
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>

                          {/* Delete Row button */}
                          <button
                            type="button"
                            onClick={() => {
                              setAdditionalImages(additionalImages.filter((_, i) => i !== idx));
                            }}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded border border-rose-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tagline */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-outline" />
                  <span>Sensory Tagline (Aesthetic quotation)</span>
                </label>
                <input
                  type="text"
                  placeholder='e.g. "Hammered golden loops framing your collar with delicate, sustainable grace."'
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-xs px-4 py-3 outline-none focus:border-brand-gold text-brand-umber font-light italic"
                />
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-brand-outline" />
                  <span>Brand Description</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Detail the materials, design philosophy, and fine elements of this accessory..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-xs p-4 outline-none focus:border-brand-gold text-brand-umber font-light leading-relaxed"
                />
              </div>

              {/* Material Custom selection tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider block">
                  Material Swatches (Comma separated colors/codes)
                </label>
                <input
                  type="text"
                  placeholder="e.g. #E5D5BC, #E5E4E2, #B76E79"
                  value={materialOptions}
                  onChange={(e) => setMaterialOptions(e.target.value)}
                  className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-xs px-4 py-3 outline-none focus:border-brand-gold text-brand-umber font-mono"
                />
                <span className="text-[10px] text-brand-outline font-light block">
                  Provide hex codes or text names representing luxury swatches.
                </span>
              </div>

              {/* Sizes available */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider block">
                  Size Options (Comma separated tags)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Small, Medium, Large, One Size"
                  value={sizeOptions}
                  onChange={(e) => setSizeOptions(e.target.value)}
                  className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-xs px-4 py-3 outline-none focus:border-brand-gold text-brand-umber font-mono"
                />
                <span className="text-[10px] text-brand-outline font-light block">
                  Tags displayed on checkout selection drawers.
                </span>
              </div>

              {/* Detailed specs */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider block">
                  Fine Specifications list (Comma separated details)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 18k solid gold plated, Freshwater pearls, Florentine casting"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-xs px-4 py-3 outline-none focus:border-brand-gold text-brand-umber"
                />
              </div>

              {/* Craftsmanship */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider block">
                  Artisanal Craftsmanship note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Hand-carved inside historic ateliers of Milan by fourth-generation casting master technicians."
                  value={craftsmanship}
                  onChange={(e) => setCraftsmanship(e.target.value)}
                  className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-xs p-4 outline-none focus:border-brand-gold text-brand-umber font-light"
                />
              </div>

              {/* Is New Arrival checkbox */}
              <div className="md:col-span-2 py-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                    className="w-4 h-4 text-brand-gold focus:ring-brand-gold border-brand-outline-variant rounded"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-brand-umber uppercase tracking-wider block">
                      Tag as New Arrival
                    </span>
                    <span className="text-[10px] text-brand-outline font-light block">
                      Enables a "Seasonal / New Arrival" badge and lists item in the landing page carousel.
                    </span>
                  </div>
                </label>
              </div>

              {/* Product Type (Regular vs Pre-Order) */}
              <div className="md:col-span-2 space-y-2 py-2 border-t border-brand-outline-variant/20 pt-4">
                <label className="text-xs font-bold text-brand-umber uppercase tracking-wider block">
                  Product Type / نوع المنتج
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 p-3.5 border rounded-sm cursor-pointer transition-all ${
                      productType === "regular"
                        ? "border-brand-gold bg-brand-gold/10 text-brand-umber shadow-sm"
                        : "border-brand-outline-variant/30 bg-white text-brand-outline hover:border-brand-gold/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="productType"
                      value="regular"
                      checked={productType === "regular"}
                      onChange={() => setProductType("regular")}
                      className="text-brand-gold focus:ring-brand-gold"
                    />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider block">
                        Regular Product
                      </span>
                      <span className="text-[10px] text-brand-outline font-light block">
                        Standard catalog item available for immediate purchase & cart addition.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3.5 border rounded-sm cursor-pointer transition-all ${
                      productType === "preorder"
                        ? "border-brand-gold bg-brand-gold/10 text-brand-umber shadow-sm"
                        : "border-brand-outline-variant/30 bg-white text-brand-outline hover:border-brand-gold/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="productType"
                      value="preorder"
                      checked={productType === "preorder"}
                      onChange={() => setProductType("preorder")}
                      className="text-brand-gold focus:ring-brand-gold"
                    />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider block text-brand-gold">
                        Pre-Order Product
                      </span>
                      <span className="text-[10px] text-brand-outline font-light block">
                        Reserved via WhatsApp only. Standard "Add to Cart" is disabled.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Form Action Buttons */}
            <div className="pt-6 border-t border-brand-outline-variant/20 flex flex-col sm:flex-row justify-end items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setActiveSubTab("catalog");
                }}
                className="text-xs font-semibold uppercase tracking-wider text-brand-outline hover:text-brand-umber py-2.5 px-6"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-brand-gold text-white text-xs font-semibold py-3.5 px-10 uppercase tracking-[0.2em] hover:bg-brand-umber transition-all shadow-md w-full sm:w-auto"
              >
                {editingProduct ? "Save Changes" : "Forge Product Access"}
              </button>
            </div>
          </form>
        )}

        {activeSubTab === "analytics" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Bento Grid Diagnostic Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-brand-linen/10 border border-brand-outline-variant/20 p-6 rounded-sm text-left space-y-1">
                <span className="text-brand-outline uppercase tracking-widest text-[9.5px] font-bold block">
                  Total Managed Catalog
                </span>
                <span className="font-serif text-3xl text-brand-umber font-normal block">
                  {totalItems} Accessories
                </span>
                <span className="text-[10px] text-brand-outline/80 block">
                  Active in current browsing local state.
                </span>
              </div>

              <div className="bg-brand-linen/10 border border-brand-outline-variant/20 p-6 rounded-sm text-left space-y-1">
                <span className="text-brand-outline uppercase tracking-widest text-[9.5px] font-bold block">
                  Average Luxury Price
                </span>
                <span className="font-serif text-3xl text-brand-umber font-normal block">
                  EGP {avgPrice.toLocaleString()}
                </span>
                <span className="text-[10px] text-brand-outline/80 block">
                  Calculated dynamically across active items.
                </span>
              </div>

              <div className="bg-brand-linen/10 border border-brand-outline-variant/20 p-6 rounded-sm text-left space-y-1">
                <span className="text-brand-outline uppercase tracking-widest text-[9.5px] font-bold block">
                  New Arrival Spotlights
                </span>
                <span className="font-serif text-3xl text-brand-umber font-normal block">
                  {newArrivalsCount} spotmarked
                </span>
                <span className="text-[10px] text-brand-outline/80 block">
                  Aesthetic badges active on product listings.
                </span>
              </div>
            </div>

            {/* General Database specs block */}
            <div className="bg-brand-linen/15 border border-brand-outline-variant/20 rounded-sm p-6 md:p-8 text-left space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-gold" />
                <h3 className="font-serif text-lg text-brand-umber font-normal">
                  How persistence operates
                </h3>
              </div>
              <p className="text-xs text-brand-outline font-light leading-relaxed max-w-2xl">
                Any luxury accessories added or removed through this manager are automatically synchronized to your local container sandbox's client state storage. That means they will persist securely across browser refreshes so you can test complete end-to-end purchasing, detail checks, and filters!
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowResetConfirm(true);
                  }}
                  className="bg-brand-umber text-white text-[11px] font-semibold tracking-wider uppercase py-3 px-6 rounded-sm hover:bg-brand-gold transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore Original Curated Lines</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "rewards" && (
          <div className="space-y-8 animate-fadeIn text-left">
            {/* Header section matching the image styling */}
            <div className="bg-white border border-[#c5a880]/15 rounded-xl p-6 flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-[#c5a880]/10 rounded-xl text-brand-gold shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                  <h2 className="font-serif text-lg md:text-xl font-bold text-brand-dark tracking-wide">
                    Loyalty Rewards Vault
                  </h2>
                  <span className="text-brand-outline font-serif text-sm hidden sm:inline">/</span>
                  <h2 className="font-serif text-base md:text-lg font-bold text-brand-dark tracking-wide" dir="rtl">
                    إدارة مكافآت الولاء
                  </h2>
                </div>
                <p className="text-[11px] text-brand-outline leading-relaxed max-w-3xl" dir="rtl">
                  أضف مكافآت حصرية لعملائك الأوفياء ليتمكنوا من استبدالها باستخدام نقاط الولاء الخاصة بهم من حساباتهم الشخصية.
                </p>
                <p className="text-[10px] text-brand-outline/80 leading-relaxed font-light">
                  Forge exclusive luxury reward coupons redeemable with loyalty points. The dynamic point engine automatically validates balances during redemptions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Create Reward Form */}
              <div className="lg:col-span-1 bg-white border border-[#c5a880]/15 rounded-xl p-6 space-y-5 shadow-sm">
                <div className="flex justify-between items-center border-b border-brand-linen pb-3">
                  <h3 className="font-serif text-sm font-bold text-brand-dark flex items-center gap-1.5">
                    <span>Forge Reward</span>
                    <span className="text-brand-outline/50 font-serif text-xs">/</span>
                    <span className="font-serif" dir="rtl">إنشاء مكافأة</span>
                  </h3>
                </div>

                <form onSubmit={handleAddReward} className="space-y-4">
                  {/* Title Arabic */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block">
                      Reward Title (Arabic) / عنوان المكافأة بالعربية *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: كوبون خصم بنسبة ١٥٪"
                      value={rewardTitle}
                      onChange={(e) => setRewardTitle(e.target.value)}
                      className="w-full bg-white border border-[#c5a880]/20 rounded-lg text-xs px-4 py-2.5 outline-none focus:border-brand-gold text-brand-dark font-medium text-right"
                      dir="rtl"
                    />
                  </div>

                  {/* Title English */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block">
                      Reward Title (English) / عنوان المكافأة بالإنجليزية *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 15% Off Coupon"
                      value={rewardTitleEn}
                      onChange={(e) => setRewardTitleEn(e.target.value)}
                      className="w-full bg-white border border-[#c5a880]/20 rounded-lg text-xs px-4 py-2.5 outline-none focus:border-brand-gold text-brand-dark font-light"
                    />
                  </div>

                  {/* Points Cost */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block">
                      Points Cost / تكلفة النقاط *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 1000"
                      value={rewardCost}
                      onChange={(e) => setRewardCost(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-white border border-[#c5a880]/20 rounded-lg text-xs px-4 py-2.5 outline-none focus:border-brand-gold text-brand-dark font-mono"
                    />
                  </div>

                  {/* Discount Percentage Slider with Boxed Bubble */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block">
                      Discount Percentage / نسبة الخصم (%) *
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={rewardPercent || 15}
                        onChange={(e) => setRewardPercent(Number(e.target.value))}
                        className="flex-grow accent-[#5c4d3c] h-1.5 bg-brand-linen rounded-lg cursor-pointer"
                      />
                      <span className="text-xs font-bold text-brand-dark bg-[#c5a880]/10 px-2.5 py-1.5 rounded-lg border border-[#c5a880]/20 font-mono w-12 text-center select-none shrink-0">
                        {rewardPercent || 15}%
                      </span>
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block">
                      Coupon Code / كود الكوبون المولد *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GOLD15"
                      value={rewardCode}
                      onChange={(e) => setRewardCode(e.target.value)}
                      className="w-full bg-white border border-[#c5a880]/20 rounded-lg text-xs px-4 py-2.5 outline-none focus:border-brand-gold text-brand-dark font-mono uppercase tracking-widest"
                    />
                  </div>

                  {/* Description Arabic */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block">
                      Description (Arabic) / الوصف بالعربية
                    </label>
                    <textarea
                      rows={2}
                      placeholder="مثال: خصم ١٥٪ على طلبك القادم."
                      value={rewardDescription}
                      onChange={(e) => setRewardDescription(e.target.value)}
                      className="w-full bg-white border border-[#c5a880]/20 rounded-lg text-xs px-4 py-2 outline-none focus:border-brand-gold text-brand-dark font-medium text-right"
                      dir="rtl"
                    />
                  </div>

                  {/* Description English */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block">
                      Description (English) / الوصف بالإنجليزية
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Get 15% off your next purchase."
                      value={rewardDescriptionEn}
                      onChange={(e) => setRewardDescriptionEn(e.target.value)}
                      className="w-full bg-white border border-[#c5a880]/20 rounded-lg text-xs px-4 py-2 outline-none focus:border-brand-gold text-brand-dark font-light"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#5c4d3c] hover:bg-[#483d30] text-white text-[11px] font-semibold tracking-wider uppercase py-3.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm font-serif"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>FORGE REWARD</span>
                    <span>/</span>
                    <span>إضافة المكافأة</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Rewards List */}
              <div className="lg:col-span-2 bg-white border border-[#c5a880]/15 rounded-xl p-6 space-y-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-brand-linen pb-3">
                  <h3 className="font-serif text-sm font-bold text-brand-dark flex items-center gap-1.5">
                    <span>Active Rewards Vault</span>
                    <span className="text-brand-outline/50 font-serif text-xs">/</span>
                    <span className="font-serif" dir="rtl">خزينة المكافآت النشطة</span>
                  </h3>
                  <span className="text-[9px] font-bold text-brand-outline bg-[#c5a880]/5 border border-[#c5a880]/15 px-2 py-0.5 rounded-full font-mono">
                    {rewards.length} rewards active
                  </span>
                </div>

                {rewards.length === 0 ? (
                  /* Empty state matching the image precisely */
                  <div className="border-2 border-dashed border-brand-linen rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 bg-[#fffdfb]">
                    <div className="p-4 bg-[#c5a880]/5 rounded-full border border-[#c5a880]/10 text-brand-outline/40">
                      <Gift className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-serif text-sm font-semibold text-brand-dark" dir="rtl">
                        لا توجد مكافآت نشطة حالياً
                      </h4>
                      <p className="text-[10px] text-brand-outline max-w-sm leading-relaxed">
                        No registered rewards found in the database. Use the creator form to forge one.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* List of rewards in a clean, modern grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    {rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="p-4 bg-[#fffdfb] border border-[#c5a880]/15 rounded-xl flex flex-col justify-between gap-3 shadow-xs relative"
                        dir="rtl"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="text-right flex-grow">
                            <h4 className="font-serif text-xs font-bold text-brand-dark leading-tight">
                              {reward.title}
                            </h4>
                            <span className="text-[9px] text-brand-outline font-light block mt-0.5" dir="ltr">
                              {reward.titleEn}
                            </span>
                          </div>

                          <button
                            onClick={() => verifyAction(() => handleDeleteReward(reward.id))}
                            className="p-2 text-brand-outline/50 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                            title="Delete reward"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-brand-linen/40">
                          <div className="flex justify-between items-center bg-brand-linen/15 p-2 rounded" dir="ltr">
                            <span className="text-brand-outline text-[9px]">Cost / النقاط</span>
                            <span className="font-mono text-brand-gold font-bold">{reward.cost} PTS</span>
                          </div>

                          <div className="flex justify-between items-center bg-rose-50/40 p-2 rounded" dir="ltr">
                            <span className="text-brand-outline text-[9px]">Discount / خصم</span>
                            <span className="font-mono text-rose-600 font-bold">{reward.discountPercent}% OFF</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-brand-linen/10 p-2 rounded text-xs font-mono" dir="ltr">
                          <span className="text-brand-outline text-[9px]">Code / رمز الكوبون</span>
                          <span className="font-bold text-brand-umber select-all uppercase tracking-wider">{reward.code}</span>
                        </div>

                        {(reward.description || reward.descriptionEn) && (
                          <div className="text-[10px] text-brand-outline space-y-0.5 border-t border-[#c5a880]/10 pt-2 text-right">
                            {reward.description && <p className="font-medium text-brand-dark">{reward.description}</p>}
                            {reward.descriptionEn && (
                              <p className="font-light italic text-left text-[9.5px]" dir="ltr">
                                {reward.descriptionEn}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "promos" && (
          <div className="space-y-8 animate-fadeIn text-left">
            {/* Header section matching the image styling */}
            <div className="bg-white border border-[#c5a880]/15 rounded-xl p-6 flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-[#c5a880]/10 rounded-xl text-brand-gold shrink-0">
                <Tag className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                  <h2 className="font-serif text-lg md:text-xl font-bold text-brand-dark tracking-wide">
                    Promo Codes Manager
                  </h2>
                  <span className="text-brand-outline font-serif text-sm hidden sm:inline">/</span>
                  <h2 className="font-serif text-base md:text-lg font-bold text-brand-dark tracking-wide" dir="rtl">
                    إدارة كوبونات الخصم
                  </h2>
                </div>
                <p className="text-[11px] text-brand-outline leading-relaxed max-w-3xl" dir="rtl">
                  أضف أو عطل أو احذف كوبونات الخصم لعملائك ديناميكياً. سيقوم نظام السلة بالتحقق من هذه الأكواد وتطبيقها تلقائياً.
                </p>
                <p className="text-[10px] text-brand-outline/80 leading-relaxed font-light">
                  Dynamically manage active coupons. The cart system automatically validates codes from your live repository.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Create Coupon Form */}
              <div className="lg:col-span-1 bg-white border border-[#c5a880]/15 rounded-xl p-6 space-y-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-brand-linen pb-3">
                  <h3 className="font-serif text-sm font-bold text-brand-dark flex items-center gap-1.5">
                    <span>Create Coupon</span>
                    <span className="text-brand-outline/50 font-serif text-xs">/</span>
                    <span className="font-serif" dir="rtl">إنشاء كوبون جديد</span>
                  </h3>
                </div>

                <form onSubmit={handleAddPromo} className="space-y-5">
                  {/* Coupon Code Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block">
                      COUPON CODE / كود الخصم
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="E.G. SUMMER20"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      className="w-full bg-white border border-[#c5a880]/20 rounded-lg text-xs px-4 py-3 outline-none focus:border-brand-gold text-brand-dark font-medium placeholder-brand-outline/40 uppercase tracking-widest"
                    />
                  </div>

                  {/* Discount Percentage Slider with Boxed Bubble */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block">
                        DISCOUNT PERCENTAGE / % نسبة الخصم
                      </label>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={promoDiscountInput}
                        onChange={(e) => setPromoDiscountInput(Number(e.target.value))}
                        className="flex-grow accent-[#5c4d3c] h-1.5 bg-brand-linen rounded-lg cursor-pointer"
                      />
                      <span className="text-xs font-bold text-brand-dark bg-[#c5a880]/10 px-2.5 py-1.5 rounded-lg border border-[#c5a880]/20 font-mono w-12 text-center select-none shrink-0">
                        {promoDiscountInput}%
                      </span>
                    </div>
                  </div>

                  {/* Forge Coupon Button */}
                  <button
                    type="submit"
                    className="w-full bg-[#5c4d3c] hover:bg-[#483d30] text-white text-[11px] font-semibold tracking-wider uppercase py-3.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm font-serif"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>FORGE COUPON</span>
                    <span>/</span>
                    <span>إضافة الكوبون</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Live Coupon Directory */}
              <div className="lg:col-span-2 bg-white border border-[#c5a880]/15 rounded-xl p-6 space-y-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-brand-linen pb-3">
                  <h3 className="font-serif text-sm font-bold text-brand-dark flex items-center gap-1.5">
                    <span>Live Coupon Directory</span>
                    <span className="text-brand-outline/50 font-serif text-xs">/</span>
                    <span className="font-serif" dir="rtl">الكوبونات النشطة</span>
                  </h3>
                  <span className="text-[9px] font-bold text-brand-outline bg-[#c5a880]/5 border border-[#c5a880]/15 px-2 py-0.5 rounded-full font-mono">
                    {promos.length} codes listed
                  </span>
                </div>

                {promos.length === 0 ? (
                  /* Empty state matching the image precisely */
                  <div className="border-2 border-dashed border-brand-linen rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 bg-[#fffdfb]">
                    <div className="p-4 bg-[#c5a880]/5 rounded-full border border-[#c5a880]/10 text-brand-outline/40">
                      <Tag className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-serif text-sm font-semibold text-brand-dark" dir="rtl">
                        لا توجد كوبونات خصم حالياً
                      </h4>
                      <p className="text-[10px] text-brand-outline max-w-sm leading-relaxed">
                        No registered promo codes found in the database. Use the form to forge one.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* List of coupons in a clean, modern grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    {promos.map((promo) => (
                      <div
                        key={promo.id}
                        className="p-4 bg-[#fffdfb] border border-[#c5a880]/15 rounded-xl flex items-center justify-between gap-4 shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-[#c5a880]/10 rounded-lg text-brand-gold shrink-0">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5 text-left">
                            <h4 className="font-mono text-xs font-bold text-brand-dark select-all tracking-wider uppercase">
                              {promo.code}
                            </h4>
                            <p className="text-[10px] text-brand-outline">
                              Dynamic Shop Discount / خصم ديناميكي
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 font-mono">
                            {promo.discountPercent}% OFF
                          </span>
                          <button
                            onClick={() => handleDeletePromo(promo.id)}
                            className="p-2 text-brand-outline/50 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete promo code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* activeSubTab === "users" */}
        {activeSubTab === "users" && (
          <div className="space-y-6">
            {/* Top Stats Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#c5a880]/15 rounded-xl p-4 flex items-center gap-3 shadow-xs">
                <div className="p-3 bg-[#c5a880]/10 rounded-lg text-brand-gold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-outline uppercase tracking-wider font-semibold">إجمالي المستخدمين / Total Users</p>
                  <p className="text-lg font-bold text-brand-dark font-mono">{usersList.length}</p>
                </div>
              </div>

              <div className="bg-white border border-[#c5a880]/15 rounded-xl p-4 flex items-center gap-3 shadow-xs">
                <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-outline uppercase tracking-wider font-semibold">أعضاء الماس والنخبة / Diamond & Gold</p>
                  <p className="text-lg font-bold text-amber-600 font-mono">
                    {usersList.filter((u) => u.tier === "Diamond" || u.tier === "Gold" || u.tier === "Platinum").length}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#c5a880]/15 rounded-xl p-4 flex items-center gap-3 shadow-xs">
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-outline uppercase tracking-wider font-semibold">نقاط الولاء الصادرة / Total Points</p>
                  <p className="text-lg font-bold text-emerald-600 font-mono">
                    {usersList.reduce((acc, u) => acc + (u.loyaltyPoints || 0), 0).toLocaleString()} PTS
                  </p>
                </div>
              </div>
            </div>

            {/* Main Users Table Card */}
            <div className="bg-[#fcf8f3] border border-[#c5a880]/20 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#c5a880]/15">
                <div className="space-y-1 text-right" dir="rtl">
                  <h3 className="font-serif text-lg font-bold text-brand-dark flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-gold" />
                    <span>سجل حسابات المستخدمين والعملاء</span>
                  </h3>
                  <p className="text-xs text-brand-outline">
                    إدارة بيانات الأعضاء، فئات العضوية، ورصيد النقاط التفاعلي.
                  </p>
                </div>

                {/* Search Bar & Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-outline/60" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="بحث بالمستخدم..."
                      className="w-full bg-white border border-[#c5a880]/20 rounded-lg pl-9 pr-3 py-2 text-xs text-brand-dark outline-none focus:border-brand-gold"
                    />
                  </div>
                  {usersList.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllUsers}
                      className="w-full sm:w-auto px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                      title="مسح جميع حسابات العملاء المسجلين"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>مسح جميع الحسابات</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Users List */}
              {usersList.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Users className="w-8 h-8 text-brand-outline/40 mx-auto" />
                  <p className="text-xs text-brand-outline">لا يوجد مستخدمون مسجلون بعد في النظام.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs" dir="rtl">
                    <thead>
                      <tr className="border-b border-[#c5a880]/15 text-[10px] text-brand-outline uppercase tracking-wider">
                        <th className="py-3 px-3 text-right">المستخدم / User</th>
                        <th className="py-3 px-3 text-right">البريد الإلكتروني</th>
                        <th className="py-3 px-3 text-center">الفئة / Tier</th>
                        <th className="py-3 px-3 text-center">نقاط الولاء</th>
                        <th className="py-3 px-3 text-center">إجمالي المشتريات</th>
                        <th className="py-3 px-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c5a880]/10">
                      {usersList
                        .filter((u) => 
                          !userSearch || 
                          u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email?.toLowerCase().includes(userSearch.toLowerCase())
                        )
                        .map((u) => {
                          const tierColor = 
                            u.tier === "Diamond" ? "bg-cyan-50 text-cyan-700 border-cyan-200" :
                            u.tier === "Platinum" ? "bg-slate-100 text-slate-800 border-slate-300" :
                            u.tier === "Gold" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            u.tier === "Silver" ? "bg-gray-50 text-gray-700 border-gray-200" :
                            "bg-[#f5f0eb] text-brand-umber border-[#e5d8c5]";

                          return (
                            <tr key={u.id || u.email} className="hover:bg-white/60 transition-colors">
                              <td className="py-3 px-3 font-semibold text-brand-dark">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-[#a68253] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                                    {(u.name || u.email || "U")[0]}
                                  </div>
                                  <div>
                                    <p className="font-bold">{u.name || "مستخدم مسجل"}</p>
                                    <p className="text-[9px] text-brand-outline/60 font-mono" dir="ltr">{u.joinedDate ? `Joined: ${u.joinedDate}` : "Registered Member"}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3 font-mono text-brand-dark" dir="ltr">
                                {u.email}
                              </td>

                              <td className="py-3 px-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${tierColor}`}>
                                  {u.tier || "Bronze"}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-center font-mono font-bold text-brand-gold">
                                {u.loyaltyPoints || 0} PTS
                              </td>

                              <td className="py-3 px-3 text-center font-mono font-semibold text-brand-dark">
                                {u.totalSpent ? `${u.totalSpent} EGP` : "0 EGP"}
                              </td>

                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleAddUserPoints(u.id || u.email, 500)}
                                    className="px-2.5 py-1 bg-[#a68253] hover:bg-brand-dark text-white rounded text-[10px] font-bold transition-all shadow-xs"
                                    title="إضافة 500 نقطة ولاء لهذا المستخدم"
                                  >
                                    +500 PTS 🎁
                                  </button>
                                  {u.role !== "admin" && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(u.id || u.email, u.email)}
                                      className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-all"
                                      title="حذف هذا الحساب"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Sub-tab Component */}
        {activeSubTab === "reviews" && (
          <AdminReviewsManager
            products={products}
            reviews={reviews}
            onRefreshReviews={onRefreshReviews || (() => {})}
            triggerNotification={triggerNotification}
          />
        )}

        {/* Security Audit Logs Sub-tab */}
        {activeSubTab === "auditLogs" && (
          <div className="bg-white p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-brand-outline-variant/20">
              <div>
                <h3 className="font-serif text-xl md:text-2xl font-light text-brand-umber flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <span>سجل الأمان والرقابة الفورية / Security Audit Logs</span>
                </h3>
                <p className="text-xs text-brand-outline mt-1 font-light">
                  سجل الأمان الفوري لجميع الحركات والعمليات الإدارية في نظام VERO (Enterprise Monitoring)
                </p>
              </div>
              <button
                onClick={fetchAuditLogs}
                className="px-3.5 py-1.5 bg-brand-linen/40 hover:bg-brand-linen text-brand-umber text-xs font-semibold rounded border border-brand-outline-variant/30 flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث السجل / Refresh Logs</span>
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="text-center py-12 bg-brand-linen/10 rounded border border-dashed border-brand-outline-variant/30 text-brand-outline text-xs font-mono">
                لا توجد سجلات أمان مسجلة حالياً / No security audit logs recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto border border-brand-outline-variant/20 rounded-sm">
                <table className="w-full text-right text-xs">
                  <thead className="bg-brand-umber text-brand-linen text-[10px] uppercase font-mono tracking-wider">
                    <tr>
                      <th className="py-3 px-3 text-right">الوقت / Timestamp</th>
                      <th className="py-3 px-3 text-right">الإجراء / Action</th>
                      <th className="py-3 px-3 text-right">المستخدم / Admin</th>
                      <th className="py-3 px-3 text-right">الهدف / Target</th>
                      <th className="py-3 px-3 text-right">التفاصيل / Details</th>
                      <th className="py-3 px-3 text-right">عنوان IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-outline-variant/15 text-brand-umber font-sans">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-brand-linen/20 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[10px] text-brand-outline" dir="ltr">
                          {new Date(log.timestamp).toLocaleString("ar-EG")}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-brand-gold">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-brand-umber">
                          {log.userEmail || log.userId}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-brand-dark">
                          {log.target}
                        </td>
                        <td className="py-2.5 px-3 text-brand-outline text-[11px]">
                          {log.details}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-emerald-600" dir="ltr">
                          {log.ip}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Password Verification Overlay Modal */}
      <AnimatePresence>
        {showLockModal && (
          <div className="fixed inset-0 bg-brand-umber/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-text">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#fff8f3] border border-brand-outline-variant/35 p-6 md:p-8 max-w-md w-full shadow-2xl rounded-sm space-y-6 text-brand-umber font-sans text-right"
              dir="rtl"
            >
              <div className="text-center space-y-2">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20 mb-2 mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </span>
                <h3 className="font-serif text-xl tracking-wide font-normal text-center">
                  تفويض المشرف مطلوب
                </h3>
                <p className="text-xs text-brand-outline font-light leading-relaxed text-center">
                  تعديل الكتالوج محمي بكلمة سر. الرجاء إدخال الرمز لتأكيد الإجراء.
                  <br />
                  <span className="text-[10px] text-brand-gold font-mono block mt-1">
                    Enter password to authorize modification
                  </span>
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (passwordAttempt === "vero2026") {
                    setIsAuthenticated(true);
                    localStorage.setItem("vero_admin_authenticated", "true");
                    setPasswordError("");
                    const callback = pendingCallbackRef.current;
                    pendingCallbackRef.current = null;
                    setShowLockModal(false);
                    setPasswordAttempt("");
                    if (callback) {
                      callback();
                    }
                  } else {
                    setPasswordError("كلمة السر غير صحيحة. حاول مرة أخرى.");
                  }
                }}
                className="space-y-4 text-center"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-outline block text-center">
                    كلمة المرور / Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordAttempt}
                    onChange={(e) => {
                      setPasswordAttempt(e.target.value);
                      setPasswordError("");
                    }}
                    className="w-full bg-white border border-brand-outline-variant/40 rounded-sm text-center font-mono py-3 outline-none focus:border-brand-gold text-brand-umber text-sm"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-[10px] font-semibold text-rose-500 text-center animate-pulse">
                      {passwordError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      pendingCallbackRef.current = null;
                      setShowLockModal(false);
                      setPasswordAttempt("");
                      setPasswordError("");
                    }}
                    className="flex-1 border border-brand-outline-variant/30 text-brand-outline hover:text-brand-umber text-xs font-semibold py-3 uppercase tracking-wider rounded-sm transition-colors bg-white text-center"
                  >
                    إلغاء / Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-brand-gold hover:bg-brand-umber text-white text-xs font-semibold py-3 uppercase tracking-wider rounded-sm transition-all shadow-sm text-center"
                  >
                    تأكيد / Confirm
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Overlay Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 bg-brand-umber/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-text">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#fff8f3] border border-brand-outline-variant/35 p-6 md:p-8 max-w-md w-full shadow-2xl rounded-sm space-y-6 text-brand-umber font-sans text-right"
              dir="rtl"
            >
              <div className="text-center space-y-2">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-2 mx-auto">
                  <Trash2 className="w-6 h-6" />
                </span>
                <h3 className="font-serif text-xl tracking-wide font-normal text-center">
                  تأكيد حذف المنتج
                </h3>
                <p className="text-xs text-brand-outline font-light leading-relaxed text-center">
                  هل أنت متأكد أنك تريد حذف منتج <strong className="font-semibold text-brand-umber">"{productToDelete.name}"</strong> من الكتالوج نهائياً؟
                  <br />
                  <span className="text-[10px] text-brand-gold font-mono block mt-1">
                    Are you sure you want to permanently delete this product?
                  </span>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 border border-brand-outline-variant/30 text-brand-outline hover:text-brand-umber text-xs font-semibold py-3 uppercase tracking-wider rounded-sm transition-colors bg-white text-center animate-pulse-none"
                >
                  إلغاء / Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteProduct}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-3 uppercase tracking-wider rounded-sm transition-all shadow-sm text-center"
                >
                  حذف / Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Order Confirmation Overlay Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 bg-brand-umber/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-text">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#fff8f3] border border-brand-outline-variant/35 p-6 md:p-8 max-w-md w-full shadow-2xl rounded-sm space-y-6 text-brand-umber font-sans text-right"
              dir="rtl"
            >
              <div className="text-center space-y-2">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-2 mx-auto">
                  <Trash2 className="w-6 h-6" />
                </span>
                <h3 className="font-serif text-xl tracking-wide font-normal text-center">
                  تأكيد حذف الطلب
                </h3>
                <p className="text-xs text-brand-outline font-light leading-relaxed text-center">
                  هل أنت متأكد أنك تريد حذف الطلب رقم <strong className="font-semibold text-brand-umber">"#{orderToDelete.orderNumber}"</strong> من السجل نهائياً؟
                  <br />
                  <span className="text-[10px] text-brand-gold font-mono block mt-1">
                    Are you sure you want to permanently delete this order from history?
                  </span>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  className="flex-1 border border-brand-outline-variant/30 text-brand-outline hover:text-brand-umber text-xs font-semibold py-3 uppercase tracking-wider rounded-sm transition-colors bg-white text-center"
                >
                  إلغاء / Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    verifyAction(() => {
                      handleDeleteOrder(orderToDelete.id);
                      setOrderToDelete(null);
                    });
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-3 uppercase tracking-wider rounded-sm transition-all shadow-sm text-center animate-pulse-none"
                >
                  حذف / Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restore Database Confirmation Overlay Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 bg-brand-umber/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-text">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#fff8f3] border border-brand-outline-variant/35 p-6 md:p-8 max-w-md w-full shadow-2xl rounded-sm space-y-6 text-brand-umber font-sans text-right"
              dir="rtl"
            >
              <div className="text-center space-y-2">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20 mb-2 mx-auto">
                  <RefreshCw className="w-6 h-6" />
                </span>
                <h3 className="font-serif text-xl tracking-wide font-normal text-center">
                  تأكيد إعادة ضبط المتجر
                </h3>
                <p className="text-xs text-brand-outline font-light leading-relaxed text-center">
                  هل أنت متأكد أنك تريد إعادة تعيين المتجر إلى المنتجات والخطوط المنسقة الأصلية؟ سيتم تجاهل كافة التغييرات المخصصة.
                  <br />
                  <span className="text-[10px] text-brand-gold font-mono block mt-1">
                    Reset boutique back to curated defaults? All custom additions will be lost.
                  </span>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 border border-brand-outline-variant/30 text-brand-outline hover:text-brand-umber text-xs font-semibold py-3 uppercase tracking-wider rounded-sm transition-colors bg-white text-center"
                >
                  إلغاء / Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    verifyAction(() => {
                      onResetDatabase();
                      triggerNotification("Restored standard product lines.");
                      setShowResetConfirm(false);
                    });
                  }}
                  className="flex-1 bg-brand-gold hover:bg-brand-umber text-white text-xs font-semibold py-3 uppercase tracking-wider rounded-sm transition-all shadow-sm text-center"
                >
                  إعادة تعيين / Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Clear All Products Confirmation Overlay Modal */}
        {showClearAllConfirm && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#fff8f3] border border-brand-outline-variant/35 p-6 md:p-8 max-w-md w-full shadow-2xl rounded-sm space-y-6 text-brand-umber font-sans text-right"
              dir="rtl"
            >
              <div className="text-center space-y-2">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-2 mx-auto">
                  <Trash2 className="w-6 h-6" />
                </span>
                <h3 className="font-serif text-xl tracking-wide font-normal text-center">
                  تأكيد حذف جميع المنتجات
                </h3>
                <p className="text-xs text-brand-outline font-light leading-relaxed text-center">
                  هل أنت متأكد أنك تريد مسح كافة المنتجات من الكتالوج نهائياً؟
                  <br />
                  <span className="text-[10px] text-brand-gold font-mono block mt-1">
                    Are you sure you want to permanently clear all products from the catalog?
                  </span>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(false)}
                  className="flex-1 border border-brand-outline-variant/30 text-brand-outline hover:text-brand-umber text-xs font-semibold py-3 uppercase tracking-wider rounded-sm transition-colors bg-white text-center"
                >
                  إلغاء / Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAllProducts}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-3 uppercase tracking-wider rounded-sm transition-all shadow-sm text-center"
                >
                  حذف الكل / Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
