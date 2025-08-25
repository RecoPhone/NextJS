"use client";

import { BaseItem, VATRate } from "@/lib/cart/types";
import { mkLineId } from "@/lib/cart/reducer";
import { useCartContext } from "@/context/CartContext";

export function useCart() {
  const ctx = useCartContext();

  /** Ajouter une réparation depuis le formulaire Devis */
  function addRepair(opts: {
    device: string; // ex. "iPhone 12"
    part: string;   // ex. "Écran"
    variant?: string; // ex. "Noir"
    priceExcl: number;
    vatRate?: VATRate; // défaut 21
    quantity?: number;
    metadata?: Record<string, unknown>;
  }) {
    const item: BaseItem = {
      id: mkLineId(),
      type: "REPAIR",
      title: `${opts.device} – ${opts.part}`,
      subtitle: opts.variant,
      unitPrice: opts.priceExcl,
      vatRate: opts.vatRate ?? 21,
      quantity: opts.quantity ?? 1,
      metadata: opts.metadata,
    };
    ctx.addItem(item);
  }

  /** Ajouter un accessoire */
  function addAccessory(opts: {
    name: string; // ex. "Coque antichoc"
    variant?: string; // "Noir"
    priceExcl: number;
    vatRate?: VATRate;
    quantity?: number;
    metadata?: Record<string, unknown> & { sku?: string };
  }) {
    ctx.addItem({
      id: mkLineId(),
      type: "ACCESSORY",
      title: opts.name,
      subtitle: opts.variant,
      unitPrice: opts.priceExcl,
      vatRate: opts.vatRate ?? 21,
      quantity: opts.quantity ?? 1,
      metadata: opts.metadata,
    });
  }

  /** Ajouter un abonnement */
  function addSubscription(opts: {
    plan: "Essentiel" | "Familial" | "Zen" | string;
    priceExcl: number; // 1er mois avant paiement récurrent (optionnel)
    vatRate?: VATRate;
    quantity?: number;
    metadata?: Record<string, unknown> & { planId?: string };
  }) {
    ctx.addItem({
      id: mkLineId(),
      type: "SUBSCRIPTION",
      title: `Abonnement ${opts.plan}`,
      unitPrice: opts.priceExcl,
      vatRate: opts.vatRate ?? 21,
      quantity: opts.quantity ?? 1,
      metadata: opts.metadata,
    });
  }

return useCartContext();
}