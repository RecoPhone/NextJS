export type CartItemType = "REPAIR" | "ACCESSORY" | "SUBSCRIPTION";

export type VATRate = 0 | 6 | 12 | 21; // Belgique par défaut 21%

export interface BaseItem {
  id: string; // line id (unique)
  type: CartItemType;
  title: string; // ex. "iPhone 12 – Écran"
  subtitle?: string; // ex. "Noir, qualité standard"
  unitPrice: number; // prix HT par unité
  vatRate: VATRate; // 21 par défaut
  quantity: number; // >= 1
  // Libre pour lier au devis / API fournisseur
  metadata?: Record<string, unknown>;
}

export interface CartState {
  items: BaseItem[];
  couponCode?: string;
  updatedAt: number; // timestamp ms
}

export interface CartTotals {
  subtotalExcl: number; // HT
  vatTotal: number; // TVA totale
  totalIncl: number; // TTC
}