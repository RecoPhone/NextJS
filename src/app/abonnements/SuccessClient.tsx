// src/app/abonnements/success/SuccessClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type LineItem = {
  id: string;
  name: string;
  quantity: number;
  unit_amount: number | null; // en cents
  amount_total: number;       // en cents
  currency: string;
};

type VerifyResponse = {
  id: string;
  created: number;
  mode: "payment" | "subscription";
  status: string; // checkout.session status
  payment_status: "paid" | "unpaid" | "no_payment_required" | string;
  currency: string;
  amount_total: number; // en cents
  customer_email?: string | null;
  subscription_status?: string | null; // si ton endpoint la renvoie
  source?: string | null;
  line_items?: LineItem[] | null;
};

const fmtEUR = (cents?: number | null) =>
  typeof cents === "number"
    ? (cents / 100).toLocaleString("fr-BE", { style: "currency", currency: "EUR" })
    : "—";

const fmtDate = (epoch: number) =>
  new Date(epoch * 1000).toLocaleString("fr-BE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function SuccessClient({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<{
    loading: boolean;
    data: VerifyResponse | null;
    ok: boolean;
  }>({ loading: true, data: null, ok: false });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!sessionId) {
        setState({ loading: false, data: null, ok: false });
        return;
      }
      try {
        const res = await fetch(
          `/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}&source=abonnements`,
          { cache: "no-store" }
        );
        const data: VerifyResponse = await res.json();

        const paid = data.payment_status === "paid";
        const isSub = data.mode === "subscription";
        const subActive = (data.subscription_status || "").toLowerCase() === "active";

        const ok = res.ok && (paid || subActive) && (isSub || data.mode === "payment");

        if (!cancelled) setState({ loading: false, data, ok });
      } catch {
        if (!cancelled) setState({ loading: false, data: null, ok: false });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const items = useMemo(() => state.data?.line_items ?? [], [state.data]);

  if (state.loading) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p className="text-gray-700">Vérification en cours…</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-[#222]">
        {state.ok ? "Merci, votre abonnement est actif 🎉" : "Confirmation impossible"}
      </h1>
      <p className="text-gray-700 mb-6">
        {state.ok
          ? "Le paiement a bien été confirmé et votre abonnement a été activé."
          : "Nous n’avons pas pu confirmer la souscription pour le moment."}
      </p>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 print:border-0 print:shadow-none">
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-[#222]">Récapitulatif</h2>
            <p className="text-sm text-gray-600">Référence session : {state.data?.id ?? "—"}</p>
            {state.data?.created && (
              <p className="text-sm text-gray-600">Date : {fmtDate(state.data.created)}</p>
            )}
            {state.data?.mode === "subscription" && (
              <p className="text-sm text-gray-600">
                Mode : Abonnement {state.data?.subscription_status ? `(${state.data.subscription_status})` : ""}
              </p>
            )}
          </div>
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-[#222]">RecoPhone</p>
            <p>hello@recophone.be</p>
            <p>+32 492 09 05 33</p>
            <p>recophone.be</p>
          </div>
        </header>

        <div className="mt-4 text-sm text-gray-700">
          <p>
            <span className="font-semibold text-[#222]">Client :</span>{" "}
            {state.data?.customer_email ?? "—"}
          </p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">Offre</th>
                <th className="py-2">Qté</th>
                <th className="py-2">PU TTC</th>
                <th className="py-2 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td className="py-2 text-gray-500" colSpan={4}>
                    Aucune ligne.
                  </td>
                </tr>
              )}
              {items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="py-2 pr-4">{it.name}</td>
                  <td className="py-2">{it.quantity}</td>
                  <td className="py-2">{fmtEUR(it.unit_amount)}</td>
                  <td className="py-2 text-right">{fmtEUR(it.amount_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 border-t pt-4 flex items-center justify-end">
          <div className="text-right">
            <p className="text-base font-semibold text-[#222]">
              Total : {fmtEUR(state.data?.amount_total ?? 0)}
            </p>
            <p className="text-xs text-gray-500">TVA incluse le cas échéant.</p>
          </div>
        </div>
      </section>

      <div className="mt-6 flex gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-[#54b435] hover:bg-[#46962d] text-white font-medium py-3 px-4"
        >
          Imprimer / PDF
        </button>
      </div>
    </main>
  );
}
