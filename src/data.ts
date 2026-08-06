import { Product, Review } from "./types";

export const CATEGORIES = [
  { id: "all", name: "All Collections" },
  { id: "fine-jewelry", name: "Fine Jewelry" },
  { id: "timepieces", name: "Timepieces" },
  { id: "necklaces", name: "Necklaces" },
  { id: "rings", name: "Rings" },
  { id: "earrings", name: "Earrings" },
  { id: "bracelets", name: "Bracelets" },
  { id: "leather-goods", name: "Leather Goods" },
  { id: "accessories", name: "Accessories" }
];

export const PRODUCTS: Product[] = [];

export const STORIES = [
  {
    title: "Software Craftsmanship Philosophy",
    quote: "Our brand stands for digital restraint. True software elegance is felt in the architecture, loading speed, and clean code—not the loudness of marketing or massive boilerplate frameworks. It's a dialogue between the system and the browser.",
    image: "images/story-luxury.jpg"
  },
  {
    title: "Artisanal Digital Engineering",
    quote: "Every VERO creation is custom-crafted from scratch, utilizing the finest modern paradigms. We dedicate a minimum of 40 focused development hours to compile, refactor, and thoroughly audit every single codebase.",
    image: "images/sculpted-aurelian-ring-4.jpg"
  },
  {
    title: "Eco-Conscious Digital Footprint",
    quote: "100% of our code templates and backend architectures are optimized for minimum CPU utilization and green-energy hosting compliance, ensuring highly sustainable software that respects the future.",
    image: "images/story-eco.jpg"
  }
];

export const REVIEWS: Review[] = [
  {
    id: "rev-1",
    productId: "ring-01",
    productName: "The Eternal Solitaire Ring",
    userId: "usr-01",
    userName: "Elena R.",
    userEmail: "elena@example.com",
    rating: 5,
    title: "Masterpiece of Artistry",
    review: "An absolute masterpiece. The performance and craftsmanship of this VERO piece is flawless. It completely exceeded my expectations!",
    verifiedPurchase: true,
    recommend: true,
    status: "approved",
    images: [],
    helpfulCount: 4,
    votedUserIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: "Elena R.",
    date: "July 12, 2026",
    comment: "An absolute masterpiece."
  },
  {
    id: "rev-2",
    productId: "watch-01",
    productName: "Grand Chronograph Gold",
    userId: "usr-02",
    userName: "Marcello D.",
    userEmail: "marcello@example.com",
    rating: 5,
    title: "Exquisite Quality",
    review: "Exquisite quality and timeless design. It's clear that master jewelers spent serious hours crafting this timepiece. Outstanding.",
    verifiedPurchase: true,
    recommend: true,
    status: "approved",
    images: [],
    helpfulCount: 7,
    votedUserIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: "Marcello D.",
    date: "June 28, 2026",
    comment: "Exquisite quality."
  }
];
