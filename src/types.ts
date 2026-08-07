export interface Product {
  id: string;
  name: string;
  categoryName: string;
  categoryId: string;
  price: number;
  originalPrice?: number; // Old price (السعر القديم)
  discountPercent?: number; // Calculated or explicit percentage discount
  pointsEarned?: number; // VERO points customer earns upon buying this product (عدد النقاط عند الشراء)
  image: string;
  secondaryImages: string[];
  description: string;
  tagline: string;
  isNew?: boolean;
  isPreOrder?: boolean;
  materialOptions?: string[]; // hex codes or names
  sizeOptions?: string[];
  details?: string[];
  craftsmanship?: string;
  stock?: number; // Stock quantity (undefined or null or a positive number)
}

export interface CartItem {
  id: string; // unique cart item id (e.g., prod_id + size + material)
  product: Product;
  quantity: number;
  selectedMaterial: string; // hex or name
  selectedSize: string;
}

export interface ReviewReply {
  id: string;
  reviewId: string;
  adminName: string;
  reply: string;
  createdAt: string;
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  userId: string;
  userName?: string;
  reason: "Spam" | "Offensive" | "Fake Review" | "Wrong Information" | "Other";
  details?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  orderId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number; // 1 to 5
  title: string;
  review: string;
  verifiedPurchase: boolean;
  recommend: boolean;
  isAnonymous?: boolean;
  status: "approved" | "pending" | "rejected" | "hidden";
  images: string[];
  videoUrl?: string;
  helpfulCount: number;
  votedUserIds: string[];
  reports?: ReviewReport[];
  reply?: ReviewReply;
  createdAt: string;
  updatedAt: string;
  // Legacy compatibility fields
  author?: string;
  date?: string;
  comment?: string;
}

export interface ReviewNotification {
  id: string;
  userId: string;
  reviewId?: string;
  title: string;
  message: string;
  read: boolean;
  type: "review_approved" | "review_rejected" | "admin_reply" | "order_update";
  createdAt: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  avatar: string;
  provider: "google" | "facebook" | "apple" | "email";
  tier: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
  role?: "admin" | "customer";
  sessionToken?: string;
  loyaltyPoints: number;
  hasReceivedWelcomeBonus?: boolean;
  totalSpent?: number; // Lifetime total spending in EGP
  joinedDate: string;
  redeemedRewards?: string[];
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  target?: string;
  details?: string;
  ip?: string;
  timestamp: string;
}

export function getTierFromSpent(spent: number): "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" {
  if (spent >= 150000) return "Diamond";
  if (spent >= 70000) return "Platinum";
  if (spent >= 30000) return "Gold";
  if (spent >= 10000) return "Silver";
  return "Bronze";
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  createdAt: string;
  total: number;
  status: string;
  shippingName: string;
  shippingEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  shippingPhone?: string;
  items: {
    product: {
      id: string;
      name: string;
      price: number;
      image: string;
      categoryName: string;
    };
    quantity: number;
    selectedMaterial: string;
    selectedSize: string;
  }[];
}

export interface Reward {
  id: string;
  title: string;
  titleEn: string;
  cost: number;
  code: string;
  description: string;
  descriptionEn: string;
  discountPercent: number;
}

export interface Promo {
  id: string;
  code: string;
  discountPercent: number;
  isActive?: boolean;
  description?: string;
}


