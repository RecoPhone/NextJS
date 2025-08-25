export type CartItemLine = { label: string; price: number; qty?: number };
export type CartDevice = { category?: string; model?: string; items: CartItemLine[] };
export type CartFee = { label: string; price: number };

export type CartQuote = {
  id: string;
  createdAt: string;
  devices: CartDevice[];
  fees: CartFee[];
  total: number;
  client: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notes?: string;
    aDomicile: boolean;
    address?: { street: string; number: string; postalCode: string; city: string } | null;
    slotISO: string | null;
    payInTwo: boolean;
  };
};

const CART_KEY = "recophone:cart";

export function loadCart(): CartQuote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartQuote[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(list: CartQuote[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("recophone:cart:updated"));
}

const genId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)) + "-" + Date.now().toString(36);

export function addQuote(q: Omit<CartQuote, "id" | "createdAt">): CartQuote {
  const full: CartQuote = {
    ...q,
    id: genId(),
    createdAt: new Date().toISOString(),
  };
  const curr = loadCart();
  curr.push(full);
  saveCart(curr);
  return full;
}
