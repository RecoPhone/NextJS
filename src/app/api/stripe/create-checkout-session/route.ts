// src/app/api/stripe/create-checkout-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs"; 

type PlanKey = "essentiel" | "familial" | "zen";

function getEnvPrice(key: PlanKey) {
  // Priorité aux variables serveur
  const server = {
    essentiel: process.env.STRIPE_PRICE_ESSENTIEL,
    familial: process.env.STRIPE_PRICE_FAMILIAL,
    zen: process.env.STRIPE_PRICE_ZEN,
  }[key];

  if (server) return server;

  // Fallback : variables publiques actuelles (prod_… chez toi)
  const pub = {
    essentiel: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL,
    familial: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILIAL,
    zen: process.env.NEXT_PUBLIC_STRIPE_PRICE_ZEN,
  }[key];

  return pub;
}

async function resolvePriceId(possibleId?: string): Promise<string> {
  if (!possibleId) {
    throw new Error("Aucun ID de prix/produit configuré.");
  }
  // Si c'est déjà un price_… on renvoie tel quel
  if (possibleId.startsWith("price_")) return possibleId;

  // Si c'est un prod_… on va chercher le prix mensuel actif le moins cher
  if (possibleId.startsWith("prod_")) {
    const prices = await stripe.prices.list({
      product: possibleId,
      active: true,
      limit: 50,
      type: "recurring",
      expand: ["data.tiers"],
    });

    const monthly = prices.data.filter((p) => p.recurring?.interval === "month");
    if (!monthly.length) {
      throw new Error("Aucun price mensuel actif trouvé pour le produit.");
    }

    // Choisir le moins cher (unit_amount peut être null si "tiers", on met en bas de liste)
    monthly.sort((a, b) => (a.unit_amount ?? Number.MAX_SAFE_INTEGER) - (b.unit_amount ?? Number.MAX_SAFE_INTEGER));

    return monthly[0].id;
  }

  throw new Error("ID Stripe invalide. Attendu price_… ou prod_…");
}

export async function POST(req: NextRequest) {
  try {
    const { plan, customerEmail }: { plan: PlanKey; customerEmail?: string } = await req.json();

    if (!["essentiel", "familial", "zen"].includes(plan)) {
      return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
    }

    const configured = getEnvPrice(plan);
    const priceId = await resolvePriceId(configured);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      // Pas besoin de stripe-js ici, on utilisera session.url
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/abonnements/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/abonnements/cancel`,
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      customer_email: customerEmail, // optionnel si tu veux préremplir
      metadata: { plan },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("Stripe Checkout error:", err);
    return NextResponse.json({ error: err.message ?? "Erreur Stripe." }, { status: 500 });
  }
}
