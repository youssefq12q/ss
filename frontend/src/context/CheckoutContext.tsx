import React, { createContext, useContext, useState } from "react";
import { Order } from "../types";

interface CheckoutContextType {
  checkoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
  promoInput: string;
  setPromoInput: (val: string) => void;
  activePromo: string;
  setActivePromo: (val: string) => void;
  promoError: string;
  setPromoError: (val: string) => void;
  promoSuccess: string;
  setPromoSuccess: (val: string) => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export const CheckoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [activePromo, setActivePromo] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  return (
    <CheckoutContext.Provider
      value={{
        checkoutOpen,
        setCheckoutOpen,
        promoInput,
        setPromoInput,
        activePromo,
        setActivePromo,
        promoError,
        setPromoError,
        promoSuccess,
        setPromoSuccess,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
};
