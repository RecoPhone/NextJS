"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { eur } from "@/lib/cart/money";
import { Trash2, Plus, Minus } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { state, totals, updateQty, removeItem, clear } = useCart();
  const [paying, setPaying] = useState(false);

  const hasItems = state.items.length > 0;

  function toStripeItems() {
    return state.items.map((it) => {
      const vat = typeof it.vatRate === "number" ? it.vatRate : 21;
      const unitTtc = it.unitPrice * (1 + vat / 100);
      const nameParts = [it.type ? `[${String(it.type).toUpperCase()}]` : "", it.title, it.subtitle ? `— ${it.subtitle}` : ""]
        .filter(Boolean)
        .join(" ");
      return {
        name: nameParts.slice(0, 250),
        amount: Number(unitTtc.toFixed(2)), // par unité, en EUR
        quantity: Math.max(1, Math.floor(it.quantity ?? 1)),
      };
    });
  }

  async function handlePay() {
    if (!hasItems) return;
    try {
      setPaying(true);
      const res = await fetch("/api/stripe/create-payment-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: toStripeItems(),
          currency: "eur",
          // customerEmail: ... // si tu as l’email client, ajoute-le ici
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur inconnue");
      if (!data?.url) throw new Error("URL manquante.");
      window.location.href = data.url;
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Paiement impossible pour le moment.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-extrabold text-[#222]">Votre panier</h1>
      <p className="mb-8 text-gray-600">Reprenez votre devis, ajoutez des accessoires ou un abonnement.</p>

      {!hasItems ? (
        <div className="rounded-2xl border border-dashed border-[#54b435]/30 bg-white p-10 text-center shadow-sm">
          <p className="mb-6 text-lg text-gray-700">Votre panier est vide pour le moment.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/abonnements" className="rounded-xl border border-[#54b435] px-5 py-3 font-medium text-[#54b435] hover:bg-[#edfbe2]">
              Voir les abonnements
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-[1fr_360px]">
          {/* LISTE */}
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
            <ul className="divide-y divide-gray-100">
              {state.items.map((it) => (
                <li key={it.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm uppercase tracking-wide text-gray-500">{it.type}</p>
                    <h3 className="text-lg font-semibold text-[#222]">{it.title}</h3>
                    {it.subtitle && <p className="text-sm text-gray-600">{it.subtitle}</p>}
                    <p className="mt-1 text-sm text-gray-500">TVA {it.vatRate}%</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center rounded-xl border border-gray-200">
                      <button
                        aria-label="Diminuer la quantité"
                        className="p-2 disabled:opacity-40"
                        onClick={() => updateQty(it.id, Math.max(1, it.quantity - 1))}
                        disabled={it.quantity <= 1}
                      >
                        <Minus size={18} />
                      </button>
                      <span className="min-w-8 text-center text-sm font-medium">{it.quantity}</span>
                      <button
                        aria-label="Augmenter la quantité"
                        className="p-2"
                        onClick={() => updateQty(it.id, it.quantity + 1)}
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">HT</p>
                      <p className="text-base font-semibold">{eur(it.unitPrice * it.quantity)}</p>
                    </div>

                    <button
                      aria-label="Supprimer la ligne"
                      className="rounded-xl border border-red-200 p-2 text-red-600 hover:bg-red-50"
                      onClick={() => removeItem(it.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex justify-between">
              <button onClick={clear} className="text-sm text-red-600 underline underline-offset-4">
                Vider le panier
              </button>
            </div>
          </section>

          {/* RÉCAP */}
          <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-[#222]">Récapitulatif</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Sous-total (HT)</dt>
                <dd className="font-medium">{eur(totals.subtotalExcl)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">TVA</dt>
                <dd className="font-medium">{eur(totals.vatTotal)}</dd>
              </div>
              <div className="mt-2 border-t pt-3">
                <div className="flex justify-between text-base">
                  <dt className="font-semibold">Total TTC</dt>
                  <dd className="font-semibold">{eur(totals.totalIncl)}</dd>
                </div>
              </div>
            </dl>

            <div className="mt-6 grid gap-3">
              <button
                onClick={handlePay}
                disabled={!hasItems || paying}
                className="rounded-xl bg-[#54b435] hover:bg-[#46962d] disabled:opacity-60 text-white font-medium py-3 px-4 transition-all"
              >
                {paying ? "Redirection…" : `Payer ${eur(totals.totalIncl)}`}
              </button>
              <Link href="/devis" className="rounded-xl bg-[#edfbe2] px-4 py-3 text-center font-medium text-[#226122] hover:brightness-95">
                Continuer mon devis
              </Link>
              <Link href="/abonnements" className="rounded-xl border border-[#54b435] px-4 py-3 text-center font-medium text-[#54b435] hover:bg-[#edfbe2]">
                Voir les abonnements
              </Link>
              <p className="mt-1 text-center text-xs text-gray-500">Paiement sécurisé par Stripe</p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
