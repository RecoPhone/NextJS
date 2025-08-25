// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";
// Évite toute mise en cache / static optimization
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new NextResponse("Webhook not configured", { status: 400 });
  }

  // Important : récupérer le corps brut
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // (Optionnel) Récupérer les line items si nécessaire
        // const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

        // TODO: marquer la commande payée, envoyer un mail, générer PDF, stocker le devis, etc.
        // Exemple d'accès :
        // session.id
        // session.mode === "payment" | "subscription"
        // session.customer_email
        // session.metadata?.quoteId

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        // TODO: synchroniser l'abonnement (plan, statut, dates)
        // sub.id, sub.status, sub.current_period_end, sub.items.data, etc.
        break;
      }

      default:
        // console.debug(`Unhandled event type: ${event.type}`);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}
