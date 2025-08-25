// src/app/abonnements/success/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type VerifySub = {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  plan: {
    id: string;
    nickname: string | null;
    unit_amount: number | null; // cents
    currency: string;
    interval?: "day" | "week" | "month" | "year";
    product_name?: string;
  };
};

type VerifyResponse = {
  id: string;
  created: number;
  mode: "payment" | "subscription";
  status: string;
  payment_status: string;
  amount_total: number; // cents (1ère facture)
  customer_email?: string | null;
  subscription?: VerifySub | null;
  source?: string | null;
};

const fmtEUR = (cents?: number | null) =>
  typeof cents === "number" ? (cents / 100).toLocaleString("fr-BE", { style: "currency", currency: "EUR" }) : "-";

const fmtDate = (epoch: number) =>
  new Date(epoch * 1000).toLocaleString("fr-BE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function SuccessSubscriptionPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

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
        const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`, { cache: "no-store" });
        const data: VerifyResponse = await res.json();

        const ok =
          res.ok &&
          data.mode === "subscription" &&
          data.payment_status === "paid";

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

  const sub = state.data?.subscription ?? null;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-[#222]">Merci ! 🎉</h1>
      <p className="text-gray-700 mb-6">Votre abonnement est actif. Voici votre attestation officielle.</p>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 print:border-0 print:shadow-none">
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-[#222]">Attestation d’abonnement</h2>
            <p className="text-sm text-gray-600">Référence session : {state.data?.id}</p>
            {state.data?.created && <p className="text-sm text-gray-600">Date : {fmtDate(state.data.created)}</p>}
          </div>
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-[#222]">RecoPhone</p>
            <p>hello@recophone.be</p>
            <p>+32 492 09 05 33</p>
            <p>recophone.be</p>
          </div>
        </header>

        {/* Détails client */}
        <div className="mt-4 text-sm text-gray-700">
          <p>
            <span className="font-semibold text-[#222]">Abonné :</span>{" "}
            {state.data?.customer_email ?? "—"}
          </p>
        </div>

        {/* Détails de l’abonnement */}
        <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl bg-[#f9fdf6] p-4 border border-gray-100">
            <p className="text-gray-500">Formule</p>
            <p className="font-semibold text-[#222]">
              {sub?.plan.product_name || sub?.plan.nickname || "Abonnement RecoPhone"}
            </p>
          </div>
          <div className="rounded-xl bg-[#f9fdf6] p-4 border border-gray-100">
            <p className="text-gray-500">Montant par période</p>
            <p className="font-semibold text-[#222]">
              {fmtEUR(sub?.plan.unit_amount)} / {sub?.plan.interval ?? "mois"}
            </p>
          </div>
          <div className="rounded-xl bg-[#f9fdf6] p-4 border border-gray-100">
            <p className="text-gray-500">Début de période</p>
            <p className="font-semibold text-[#222]">
              {sub?.current_period_start ? fmtDate(sub.current_period_start) : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-[#f9fdf6] p-4 border border-gray-100">
            <p className="text-gray-500">Renouvellement</p>
            <p className="font-semibold text-[#222]">
              {sub?.current_period_end ? fmtDate(sub.current_period_end) : "—"}
              {sub?.cancel_at_period_end ? " (résiliation à la fin de période)" : ""}
            </p>
          </div>
          <div className="rounded-xl bg-[#f9fdf6] p-4 border border-gray-100">
            <p className="text-gray-500">Statut</p>
            <p className="font-semibold text-[#222]">{sub?.status ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-[#f9fdf6] p-4 border border-gray-100">
            <p className="text-gray-500">Première facture (payée)</p>
            <p className="font-semibold text-[#222]">{fmtEUR(state.data?.amount_total)}</p>
          </div>
        </div>

        {/* Mentions / cadre légal à minima (général) */}
        <div className="mt-6 text-xs text-gray-600 leading-relaxed">
          <p>
            L’abonnement se renouvelle automatiquement à chaque période indiquée ci-dessus.
            Vous pouvez demander la résiliation avant la date de renouvellement. Les garanties légales de
            conformité s’appliquent. Pour toute question, contactez hello@recophone.be.
          </p>
        </div>
      </section>

      <div className="mt-6 flex gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-[#54b435] hover:bg-[#46962d] text-white font-medium py-3 px-4"
        >
          Imprimer l’attestation / PDF
        </button>
      </div>
    </main>
  );
}
