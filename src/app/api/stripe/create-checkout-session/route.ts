// src/app/api/stripe/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

type CreateSessionPayload = {
  mode?: "payment" | "subscription";
  line_items?: Array<{ price: string; quantity?: number }>;
  success_url?: string;
  cancel_url?: string;
  customer_email?: string;
  metadata?: Record<string, string>;
  // champs Stripe optionnels pass-through (ex: allow_promotion_codes, automatic_tax, etc.)
  [k: string]: unknown;
};

export async function POST(req: Request) {
  try {
    const {
      mode = "payment",
      line_items,
      success_url,
      cancel_url,
      customer_email,
      metadata,
      ...rest
    } = (await req.json()) as CreateSessionPayload;

    const session = await stripe.checkout.sessions.create({
      mode,
      // Pour "subscription", tu peux aussi fournir `subscription_data` si besoin
      line_items,
      success_url:
        success_url ??
        `${process.env.NEXT_PUBLIC_SITE_URL}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancel_url ?? `${process.env.NEXT_PUBLIC_SITE_URL}/abonnements`,
      customer_email,
      metadata,
      ...rest, // ex: allow_promotion_codes: true
    });

    return NextResponse.json({ id: session.id, url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("create-checkout-session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
