import { BaseItem, CartState, CartTotals, VATRate } from "./types";
import { round2 } from "./money";

export type CartAction =
  | { type: "INIT"; payload: CartState | null }
  | { type: "ADD_ITEM"; payload: BaseItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QTY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR" }
  | { type: "APPLY_COUPON"; payload: { code?: string } };

export const initialState: CartState = {
  items: [],
  updatedAt: Date.now(),
};

export function calcTotals(state: CartState): CartTotals {
  const subtotalExcl = round2(
    state.items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0)
  );
  const vatTotal = round2(
    state.items.reduce((acc, it) => acc + (it.unitPrice * it.quantity * (it.vatRate as VATRate)) / 100, 0)
  );
  const totalIncl = round2(subtotalExcl + vatTotal);
  return { subtotalExcl, vatTotal, totalIncl };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "INIT": {
      return action.payload ?? initialState;
    }
    case "ADD_ITEM": {
      // Fusion si même type + titre + metadata significative ? Ici on fusionne strictement par id produit logique si fourni.
      // Par simplicité, on merge si title+subtitle+vatRate+unitPrice+type sont identiques.
      const idx = state.items.findIndex(
        (i) =>
          i.type === action.payload.type &&
          i.title === action.payload.title &&
          i.subtitle === action.payload.subtitle &&
          i.vatRate === action.payload.vatRate &&
          i.unitPrice === action.payload.unitPrice
      );
      let items = [...state.items];
      if (idx >= 0) {
        items[idx] = { ...items[idx], quantity: items[idx].quantity + action.payload.quantity };
      } else {
        items.push(action.payload);
      }
      return { ...state, items, updatedAt: Date.now() };
    }
    case "REMOVE_ITEM": {
      const items = state.items.filter((i) => i.id !== action.payload.id);
      return { ...state, items, updatedAt: Date.now() };
    }
    case "UPDATE_QTY": {
      const items = state.items.map((i) =>
        i.id === action.payload.id
          ? { ...i, quantity: Math.max(1, Math.floor(action.payload.quantity || 1)) }
          : i
      );
      return { ...state, items, updatedAt: Date.now() };
    }
    case "CLEAR": {
      return { items: [], updatedAt: Date.now(), couponCode: undefined };
    }
    case "APPLY_COUPON": {
      return { ...state, couponCode: action.payload.code, updatedAt: Date.now() };
    }
    default:
      return state;
  }
}

export function mkLineId() {
  // id court, sans dépendre d’une lib :
  return (
    Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
  ).toUpperCase();
}