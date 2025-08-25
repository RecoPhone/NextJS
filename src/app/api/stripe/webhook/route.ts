import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // évite toute mise en cache

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text(); // body brut requis
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook verify failed:", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      // TODO: marquer l’abonnement actif, mail de bienvenue, etc.
    }
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e: any) {
    console.error("Webhook handler error:", e?.message);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
