// src/app/api/stripe/create-payment-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

type CartItem = {
  name: string;           // ex: "iPhone 12 128 Go - Grade A"
  amount: number;         // prix TTC en euros (ex: 329.99)
  quantity?: number;      // défaut = 1
};

function eurToCents(eur: number) {
  return Math.round(eur * 100);
}

export async function POST(req: NextRequest) {
  try {
    const { items, currency = "eur", customerEmail } = await req.json() as {
      items: CartItem[];
      currency?: "eur";
      customerEmail?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Panier vide." }, { status: 400 });
    }

    // ✅ Guardrails basiques pour éviter les dérapages côté client
    const line_items = items.map((it, idx) => {
      const qty = Math.max(1, Math.min(10, Math.floor(it.quantity ?? 1)));
      if (!it.name || typeof it.amount !== "number" || !isFinite(it.amount)) {
        throw new Error(`Item invalide à l’index ${idx}.`);
      }

      const cents = eurToCents(it.amount);
      // bornes : 10€ – 5000€ par item (à ajuster selon ton catalogue)
      if (cents < 1000 || cents > 500000) {
        throw new Error(`Montant hors limites pour "${it.name}".`);
      }

      return {
        quantity: qty,
        price_data: {
          currency,
          unit_amount: cents,
          product_data: {
            name: it.name.slice(0, 250), // Stripe limite la taille
          },
        },
        // Tu peux aussi activer adjustable_quantity si tu veux permettre
        // l’ajustement côté Checkout
        // adjustable_quantity: { enabled: false },
      };
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${siteUrl}/re-smartphones/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/re-smartphones/cancel`,
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ["BE"] }, // adapte au besoin
      // Si retrait sur place uniquement, enlève shipping_address_collection.

      // Optionnel
      customer_email: customerEmail,
      metadata: {
        source: "re-smartphones",
        // Astuce: garde un petit résumé textuel (limité),
        // tu stockeras le détail côté serveur plus tard.
        items: items
          .slice(0, 5)
          .map(i => `${i.quantity ?? 1}x ${i.name} @ ${i.amount}€`)
          .join(" | ")
          .slice(0, 450),
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("create-payment-session error:", err);
    return NextResponse.json({ error: err.message ?? "Erreur Stripe." }, { status: 500 });
  }
}
