"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { BaseItem, CartState } from "@/lib/cart/types";
import { cartReducer, initialState, calcTotals, CartAction } from "@/lib/cart/reducer";
import { loadCart, saveCart } from "@/lib/cart/storage";

interface CartContextValue {
  state: CartState;
  addItem: (item: BaseItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  clear: () => void;
  applyCoupon: (code?: string) => void;
  totals: ReturnType<typeof calcTotals>;
  count: number; // total d’unités
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Init depuis localStorage
  useEffect(() => {
    const saved = loadCart();
    dispatch({ type: "INIT", payload: saved });
  }, []);

  // Persist
  useEffect(() => {
    saveCart(state);
  }, [state]);

  // Sync multi-onglets
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "recophone.cart.v1") {
        const saved = loadCart();
        dispatch({ type: "INIT", payload: saved });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const totals = useMemo(() => calcTotals(state), [state]);
  const count = useMemo(() => state.items.reduce((n, it) => n + it.quantity, 0), [state]);

  const value: CartContextValue = {
    state,
    totals,
    count,
    addItem: (item) => dispatch({ type: "ADD_ITEM", payload: item }),
    removeItem: (id) => dispatch({ type: "REMOVE_ITEM", payload: { id } }),
    updateQty: (id, quantity) => dispatch({ type: "UPDATE_QTY", payload: { id, quantity } }),
    clear: () => dispatch({ type: "CLEAR" }),
    applyCoupon: (code) => dispatch({ type: "APPLY_COUPON", payload: { code } }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used within CartProvider");
  return ctx;
}