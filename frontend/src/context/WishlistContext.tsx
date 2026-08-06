import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "../types";

interface WishlistContextType {
  favorites: string[];
  setFavorites: React.Dispatch<React.SetStateAction<string[]>>;
  toggleFavorite: (product: Product, e?: React.MouseEvent) => void;
  isFavorited: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
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

  useEffect(() => {
    localStorage.setItem("vero_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    );
  };

  const isFavorited = (productId: string) => favorites.includes(productId);

  return (
    <WishlistContext.Provider
      value={{
        favorites,
        setFavorites,
        toggleFavorite,
        isFavorited,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
