import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
    rememberMe: z.boolean().optional(),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    rememberMe: z.boolean().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().optional(),
    loyaltyPoints: z.number().optional(),
    totalSpent: z.number().optional(),
    tier: z.string().optional(),
    avatar: z.string().optional(),
  }),
});

export const productSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Product name is required"),
    categoryId: z.string().optional(),
    price: z.number().nonnegative("Price must be a non-negative number"),
    originalPrice: z.number().optional(),
    pointsEarned: z.number().optional(),
    stock: z.number().optional(),
    isNew: z.boolean().optional(),
    isPreOrder: z.boolean().optional(),
    image: z.string().min(1, "Main image is required"),
    secondaryImages: z.array(z.string()).optional(),
    sizeOptions: z.array(z.string()).optional(),
    materialOptions: z.array(z.string()).optional(),
    description: z.string().optional(),
  }),
});

export const orderSchema = z.object({
  body: z.object({
    shippingName: z.string().min(1, "Shipping name is required"),
    shippingEmail: z.string().email("Invalid email address"),
    shippingAddress: z.string().min(1, "Shipping address is required"),
    shippingCity: z.string().min(1, "Shipping city is required"),
    shippingZip: z.string().min(1, "Shipping zip is required"),
    shippingPhone: z.string().optional(),
    total: z.number().nonnegative("Total must be non-negative"),
    items: z.array(z.object({
      product: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        image: z.string(),
        categoryName: z.string(),
      }),
      quantity: z.number().positive(),
      selectedMaterial: z.string(),
      selectedSize: z.string(),
    })).min(1, "Order items cannot be empty"),
  }),
});

export const reviewSchema = z.object({
  body: z.object({
    productId: z.string().min(1, "Product ID is required"),
    productName: z.string().optional(),
    productImage: z.string().optional(),
    rating: z.number().min(1).max(5),
    title: z.string().min(1, "Review title is required"),
    review: z.string().min(1, "Review comment is required"),
    images: z.array(z.string()).optional(),
    videoUrl: z.string().optional(),
    recommend: z.boolean().optional(),
    isAnonymous: z.boolean().optional(),
  }),
});

export const replyReviewSchema = z.object({
  body: z.object({
    adminName: z.string().optional(),
    reply: z.string().min(1, "Reply message is required"),
  }),
});

export const reportReviewSchema = z.object({
  body: z.object({
    reason: z.enum(["Spam", "Offensive", "Fake Review", "Wrong Information", "Other"]),
    details: z.string().optional(),
  }),
});

export const promoSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Promo code is required"),
    discountPercent: z.number().min(1).max(100),
  }),
});

export const rewardSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    cost: z.number().positive(),
    code: z.string().min(1, "Code is required"),
    discountPercent: z.number().min(1).max(100),
  }),
});

export const redeemRewardSchema = z.object({
  body: z.object({
    rewardId: z.string().min(1, "Reward ID is required"),
  }),
});

export const cartItemSchema = z.object({
  body: z.object({
    product: z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      image: z.string(),
    }),
    quantity: z.number().positive(),
    selectedMaterial: z.string(),
    selectedSize: z.string(),
  }),
});

export const wishlistItemSchema = z.object({
  body: z.object({
    product: z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      image: z.string(),
    }),
  }),
});
