"use client";

import React, {
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { QuoteDevice } from "./QuoteCard";

/** — Types — */
export type StepResumeProps = {
  devices: QuoteDevice[];
  payInTwo: boolean;
  signatureDataUrl?: string | null;
  aDomicile: boolean;
  address?: { street: string; number: string; postalCode: string; city: string } | null;
  client: { firstName: string; lastName: string; email: string; phone: string; notes?: string; travelFee?: number | undefined; };
};
export type StepResumeHandle = {
  finalize: () => Promise<void>;
};

const formatPrice = (n: number) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(n);

/** — Types API — */
type QuoteItemMeta = { color?: string | null; partKind?: "back" | "frame" };
type QuoteItemLite = { label: string; price: number; qty?: number; meta?: QuoteItemMeta };
type QuoteDeviceLite = { category?: string; model?: string; items: QuoteItemLite[] };
type CompanyInfo = { name: string; slogan?: string; email: string; phone: string; website?: string; address?: string; vat?: string; };
type ClientInfoLite = { firstName: string; lastName: string; email: string; phone: string; address?: string; };

type QuotePayload = { quoteNumber: string; dateISO: string; company: CompanyInfo; client: ClientInfoLite; devices: QuoteDeviceLite[]; travelFee?: number; payInTwo?: boolean; signatureDataUrl?: string | null; };
type ContractPayload = { contractNumber: string; dateISO: string; quoteRef: string; company: CompanyInfo; client: ClientInfoLite; amountTotal: number; schedule: { label: string; due: string; amountPct: number }[]; legal: string[]; signatureDataUrl?: string | null; };

/** — Constantes — */
const COMPANY: CompanyInfo = {
  name: "RecoPhone",
  slogan: "Réparations éco-responsables, au prix juste",
  email: "hello@recophone.be",
  phone: "+32/492.09.05.33",
  website: "recophone.be",
  address: "Rte de Saussin 38/23a, 5190 Jemeppe-sur-Sambre",
  vat: "BE06 95 86 62 21",
};

function genId(prefix: "Q" | "C") {
  const d = new Date();
  const stamp =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0") +
    "-" +
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0") +
    String(d.getSeconds()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

/** — API helpers — */
async function downloadPdf(docType: "quote" | "contract", payload: QuotePayload | ContractPayload) {
  const res = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docType, payload, download: true }),
  });
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    docType === "quote"
      ? `devis_${(payload as QuotePayload).quoteNumber}.pdf`
      : `contrat_${(payload as ContractPayload).contractNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function finishQuote(body: { quote: QuotePayload; contract?: ContractPayload | null; payInTwo: boolean }) {
  const res = await fetch("/api/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as { ok: true; quoteUrl: string; contractUrl?: string | null };
}

/** — Component — */
const StepResume = forwardRef<StepResumeHandle, StepResumeProps>(function StepResume(
  { devices, payInTwo, signatureDataUrl, aDomicile, address, client },
  ref
) {
  const repairsTotal = useMemo(
    () => devices.reduce((sum, d) => sum + d.items.reduce((acc, it) => acc + it.price * (it.qty ?? 1), 0), 0),
    [devices]
  );
  const travelFee = aDomicile ? client.travelFee ?? 0 : 0;
  const grandTotal = repairsTotal + travelFee;

  const [quoteNumber] = useState(() => genId("Q"));
  const [contractNumber] = useState(() => genId("C"));

  const [busy, setBusy] = useState<"none" | "quote" | "finish">("none");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [finalized, setFinalized] = useState<boolean>(false);

  const buildDevicesLite = (): QuoteDeviceLite[] =>
    devices.map((d) => ({
      category: d.category,
      model: d.model,
      items: d.items.map((it) => ({
        label: it.label,
        price: it.price,
        qty: it.qty,
        meta: it.meta
          ? { color: typeof it.meta.color === "undefined" ? null : it.meta.color, partKind: it.meta.partKind as "back" | "frame" | undefined }
          : undefined,
      })),
    }));

  const buildClientLite = (): ClientInfoLite => ({
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
  });

  const quotePayload: QuotePayload = {
    quoteNumber,
    dateISO: new Date().toISOString(),
    company: COMPANY,
    client: buildClientLite(),
    devices: buildDevicesLite(),
    travelFee,
    payInTwo,
    signatureDataUrl: signatureDataUrl ?? null,
  };

  const contractPayload: ContractPayload = {
    contractNumber,
    dateISO: new Date().toISOString(),
    quoteRef: quoteNumber,
    company: COMPANY,
    client: buildClientLite(),
    amountTotal: grandTotal,
    schedule: [
      { label: "Acompte (50%)", due: "à la validation", amountPct: 50 },
      { label: "Solde (50%)", due: "à la livraison/retrait", amountPct: 50 },
    ],
    legal: [
      "Le client reconnaît avoir été informé des conditions d’intervention et des tarifs.",
      "Garantie pièces et main d’œuvre : 12 mois (hors dommages accidentels, oxydation, casse, micro-rayures).",
      "Les données du client sont traitées conformément au RGPD, uniquement pour la gestion de sa réparation.",
      "En cas de paiement échelonné, le matériel peut être retenu jusqu’au paiement complet.",
      "Des intérêts de retard et/ou une indemnité forfaitaire peuvent être appliqués en cas de non-paiement (selon vos CGV).",
    ],
    signatureDataUrl: signatureDataUrl ?? null,
  };

  /** — finalize() — appelé par le Stepper — */
  useImperativeHandle(ref, () => ({
    finalize: async () => {
      try {
        setErrorMsg(null);
        setBusy("finish");
        await finishQuote({
          quote: quotePayload,
          contract: payInTwo ? contractPayload : null,
          payInTwo,
        });
        setFinalized(true);
      } catch (e: any) {
        const msg = e?.message || "Une erreur est survenue lors de la finalisation.";
        setErrorMsg(msg);
        throw new Error(msg);
      } finally {
        setBusy("none");
      }
    },
  }));

  /** — Bouton local “Télécharger le devis” (toujours visible) — */
  const onDownloadQuote = async () => {
    try {
      setErrorMsg(null);
      setBusy("quote");
      await downloadPdf("quote", quotePayload);
    } catch (e: any) {
      setErrorMsg(e?.message || "Erreur lors de la génération du devis.");
    } finally {
      setBusy("none");
    }
  };

  return (
    <section aria-labelledby="step-resume-title" className="w-full">
      <header className="mb-3">
        <h2 id="step-resume-title" className="text-xl font-semibold text-[#222]">
          {aDomicile ? "5) Résumé & confirmation" : "4) Résumé & confirmation"}
        </h2>
        <p className="text-sm text-gray-600">Vérifiez les informations avant de valider votre demande de devis.</p>
      </header>

      <div className="space-y-4">
        {/* Bandeau success (sans liens) */}
        {finalized && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Merci ! Votre demande est finalisée. Vous allez recevoir votre devis{payInTwo ? " et votre contrat" : ""} par e-mail.
          </div>
        )}

        {/* Appareils + réparations */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b text-sm font-medium text-[#222]">Appareils & réparations</div>
          {devices.map((d, idx) => {
            const deviceTotal = d.items.reduce((acc, it) => acc + it.price * (it.qty ?? 1), 0);
            return (
              <div key={d.id ?? idx} className="px-4 py-3 border-b last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-[#222]">Appareil {idx + 1}</div>
                  <div className="text-xs text-gray-600">{d.model ?? "—"}</div>
                </div>
                <div className="text-xs text-gray-600">{d.category ?? "—"}</div>

                <div className="mt-2">
                  {d.items.length === 0 ? (
                    <div className="text-sm text-gray-500 italic">Aucune réparation sélectionnée.</div>
                  ) : (
                    <ul className="divide-y">
                      {d.items.map((it, i) => (
                        <li key={it.key ?? i} className="py-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[#222]">{it.label}</span>
                            <span className="font-medium">{formatPrice(it.price * (it.qty ?? 1))}</span>
                          </div>
                          {typeof it?.meta?.color !== "undefined" && (
                            <div className="mt-1 text-[11px] text-gray-600 flex items-center gap-2">
                              <span className="rounded-full bg-gray-100 px-2 py-0.5">
                                Couleur : <strong>{it.meta?.color ?? "Je ne sais pas"}</strong>
                              </span>
                              {it.meta?.partKind && (
                                <span className="text-gray-500">
                                  ({it.meta.partKind === "back" ? "Face arrière" : "Châssis"})
                                </span>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-2 text-sm flex items-center justify-between">
                  <span className="text-gray-700">Sous-total appareil</span>
                  <span className="font-semibold">{formatPrice(deviceTotal)}</span>
                </div>
              </div>
            );
          })}

          <div className="px-4 py-3 bg-gray-50 text-sm flex items-center justify-between rounded-b-2xl">
            <span className="text-gray-700">Total estimé</span>
            <span className="font-semibold">{formatPrice(grandTotal)}</span>
          </div>
        </div>

        {/* Coordonnées client */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b text-sm font-medium text-[#222]">Vos coordonnées</div>
          <div className="px-4 py-3 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-gray-600">Nom :</span>{" "}
              <strong>{client.firstName} {client.lastName}</strong>
            </div>
            <div>
              <span className="text-gray-600">Téléphone :</span> <strong>{client.phone}</strong>
            </div>
            <div className="sm:col-span-2">
              <span className="text-gray-600">Email :</span> <strong>{client.email}</strong>
            </div>
            {client.notes && (
              <div className="sm:col-span-2">
                <span className="text-gray-600">Précisions :</span>{" "}
                <span className="italic">{client.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* À domicile */}
        {aDomicile ? (
          <div className="rounded-2xl border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b text-sm font-medium text-[#222]">Intervention à domicile</div>
            <div className="px-4 py-3 text-sm space-y-2">
              {address && (
                <div>
                  <div className="text-gray-600">Adresse :</div>
                  <div className="font-medium">
                    {address.street} {address.number}, {address.postalCode} {address.city}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Frais de déplacement</span>
                <span className="font-medium">{formatPrice(travelFee)}</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Paiement */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b text-sm font-medium text-[#222]">Paiement</div>
          <div className="px-4 py-3 text-sm">
            {payInTwo ? (
              <div>Le <strong>contrat</strong> sera généré et envoyé avec le devis lors du clic sur <strong>Terminer</strong>.</div>
            ) : (
              <div>Règlement standard (au retrait / après intervention).</div>
            )}
          </div>
        </div>

        {/* Actions (uniquement Télécharger le devis) */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b text-sm font-medium text-[#222]">Documents</div>
          <div className="px-4 py-3 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={onDownloadQuote}
              disabled={busy !== "none"}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "#54b435" }}
            >
              {busy === "quote" ? "Génération du devis…" : "Télécharger le devis"}
            </button>
          </div>

          {errorMsg && <div className="px-4 pb-3 text-sm text-red-600">{errorMsg}</div>}
        </div>
      </div>
    </section>
  );
});

export default StepResume;
