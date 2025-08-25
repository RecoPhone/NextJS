// src/lib/stripe.ts
import Stripe from "stripe";

const apiVersion =
  (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) || "2024-06-20";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion,
});
