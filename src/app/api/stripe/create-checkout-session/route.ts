import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PlanKey = "essentiel" | "familial" | "zen";

const REQUIRED_ENV = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_ESSENTIEL",
  "STRIPE_PRICE_FAMILIAL",
  "STRIPE_PRICE_ZEN",
];

function checkEnv() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();
    if (!plan) {
      return NextResponse.json({ error: "Paramètre 'plan' manquant." }, { status: 400 });
    }
    if (!["essentiel", "familial", "zen"].includes(plan)) {
      return NextResponse.json({ error: `Plan inconnu: ${plan}` }, { status: 400 });
    }

    const env = checkEnv();
    if (!env.ok) {
      // ⚠️ Dev uniquement : on indique clairement ce qui manque (sans exposer de secrets)
      return NextResponse.json(
        { error: `Variables d'env manquantes: ${env.missing.join(", ")}` },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    const PRICES: Record<PlanKey, string> = {
      essentiel: process.env.STRIPE_PRICE_ESSENTIEL as string,
      familial: process.env.STRIPE_PRICE_FAMILIAL as string,
      zen: process.env.STRIPE_PRICE_ZEN as string,
    };

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      req.headers.get("origin") ??
      "http://localhost:3000";

    // Log non sensible pour aider en dev
    console.log("[Stripe] create-checkout-session", { plan, price: PRICES[plan as PlanKey], origin });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRICES[plan as PlanKey], quantity: 1 }],
      success_url: `${origin}/abonnements/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/abonnements`,
      billing_address_collection: "required",
      locale: "fr",
      automatic_tax: { enabled: true },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    // En dev, retourne le message pour déboguer vite
    const msg = err?.message || "Erreur inconnue";
    console.error("Stripe create-session error:", msg);
    return NextResponse.json({ error: `Stripe error: ${msg}` }, { status: 500 });
  }
}
