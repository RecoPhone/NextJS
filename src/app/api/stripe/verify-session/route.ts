// src/app/api/stripe/verify-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";

function getProductName(
  p: string | Stripe.Product | Stripe.DeletedProduct | null | undefined
): string | undefined {
  if (!p || typeof p === "string") return undefined;
  if ("deleted" in p && p.deleted) return undefined;
  return p.name;
}

// 👇 petit type util pour satisfaire TS sur les champs period
type SubscriptionWithPeriod = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  if (!session_id) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // ----- ONE-SHOT
    let lineItems:
      | Array<{
          id: string;
          name: string;
          quantity: number;
          unit_amount: number | null;
          amount_subtotal: number | null;
          amount_total: number;
          currency: string;
        }>
      | null = null;

    if (session.mode === "payment") {
      const li = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ["data.price.product"],
      });

      lineItems = li.data.map((d) => {
        const price = d.price as Stripe.Price | null;
        const productName = price ? getProductName(price.product) : undefined;
        return {
          id: d.id,
          name: productName ?? d.description ?? "Article",
          quantity: d.quantity ?? 1,
          unit_amount: price?.unit_amount ?? null,
          amount_subtotal: d.amount_subtotal ?? null,
          amount_total: d.amount_total,
          currency: d.currency ?? session.currency!,
        };
      });
    }

    // ----- ABONNEMENT
    let subscriptionInfo:
      | {
          id: string;
          status: string;
          current_period_start: number | null;
          current_period_end: number | null;
          cancel_at_period_end: boolean;
          plan: {
            id: string;
            nickname: string | null;
            unit_amount: number | null;
            currency: string;
            interval?: "day" | "week" | "month" | "year";
            product_name?: string;
          };
        }
      | null = null;

    if (session.mode === "subscription" && session.subscription) {
      const sub = (await stripe.subscriptions.retrieve(session.subscription as string, {
        expand: ["items.data.price.product"],
      })) as unknown as SubscriptionWithPeriod;

      const item = sub.items.data[0];

      // ✅ on lit prudemment avec fallback null pour rester typé
      const current_period_start =
        typeof sub.current_period_start === "number"
          ? sub.current_period_start
          : ((sub as any).current_period_start as number | undefined) ?? null;

      const current_period_end =
        typeof sub.current_period_end === "number"
          ? sub.current_period_end
          : ((sub as any).current_period_end as number | undefined) ?? null;

      const productName = getProductName(item.price.product);

      subscriptionInfo = {
        id: sub.id,
        status: sub.status,
        current_period_start,
        current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        plan: {
          id: item.price.id,
          nickname: item.price.nickname ?? null,
          unit_amount: item.price.unit_amount ?? null,
          currency: item.price.currency,
          interval: item.price.recurring?.interval,
          product_name: productName,
        },
      };
    }

    return NextResponse.json({
      id: session.id,
      created: session.created,
      mode: session.mode,
      status: session.status,
      payment_status: session.payment_status,
      currency: session.currency,
      amount_total: session.amount_total,
      customer_email: session.customer_details?.email ?? session.customer_email ?? null,
      source: session.metadata?.source ?? null,
      line_items: lineItems,
      subscription: subscriptionInfo,
    });
  } catch (e: any) {
    console.error("verify-session error:", e);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
