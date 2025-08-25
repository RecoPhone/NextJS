"use client";

import React, { FC, useMemo, useState, useEffect } from "react";

export type QuoteItem = {
  key: string;
  label: string;
  price: number;
  qty?: number;
  meta?: {
    color?: string | null;
    partKind?: "back" | "frame";
  };
};

export type QuoteDevice = {
  id: string;
  category?: string;
  model?: string;
  items: QuoteItem[];
};

export type QuoteCardProps = {
  devices: QuoteDevice[];
  fees?: QuoteItem[]; // ex: frais de déplacement
  onClear: () => void;
};

const formatPrice = (n: number) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(n);

const QuoteCard: FC<QuoteCardProps> = ({ devices, fees = [], onClear }) => {
  const [open, setOpen] = useState(false); // tiroir mobile

  const repairsTotal = useMemo(
    () =>
      devices.reduce(
        (sum, d) => sum + d.items.reduce((acc, it) => acc + (it.price * (it.qty ?? 1)), 0),
        0
      ),
    [devices]
  );
  const feesTotal = useMemo(
    () => fees.reduce((acc, it) => acc + (it.price * (it.qty ?? 1)), 0),
    [fees]
  );
  const subtotal = repairsTotal + feesTotal;

  // Fermer au ESC (mobile)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const renderDetails = () => (
    <div className="px-5 py-4 space-y-4">
      {/* Liste des appareils */}
      {devices.map((d, idx) => {
        const deviceTotal = d.items.reduce((acc, it) => acc + (it.price * (it.qty ?? 1)), 0);
        return (
          <div key={d.id} className="rounded-xl border border-gray-200">
            <div className="px-3 py-2 border-b flex items-center justify-between">
              <div className="text-xs text-gray-500">Appareil {idx + 1}</div>
              <div className="text-xs text-gray-500">
                {d.model ? d.model : <span className="italic text-gray-400">non sélectionné</span>}
              </div>
            </div>

            <div className="px-3 py-2 text-xs text-gray-600">
              {d.category ? d.category : <span className="italic text-gray-400">série non sélectionnée</span>}
            </div>

            <div className="px-3 py-2 border-t">
              <div className="text-xs text-gray-500 mb-1">Réparations</div>
              {d.items.length === 0 ? (
                <div className="text-sm text-gray-500 italic">Aucune réparation sélectionnée.</div>
              ) : (
                <ul className="divide-y">
                  {d.items.map((it) => (
                    <li key={it.key} className="py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[#222]">{it.label}</span>
                        <span className="font-medium">{formatPrice(it.price * (it.qty ?? 1))}</span>
                      </div>

                      {/* Couleur (si présente) */}
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

            <div className="px-3 py-2 bg-gray-50 text-sm flex items-center justify-between rounded-b-xl border-t">
              <span className="text-gray-700">Sous-total appareil</span>
              <span className="font-semibold">{formatPrice(deviceTotal)}</span>
            </div>
          </div>
        );
      })}

      {/* Frais (si présents) */}
      {fees.length > 0 && (
        <div className="rounded-xl border border-gray-200">
          <div className="px-3 py-2 border-b text-xs text-gray-500">Frais</div>
          <ul className="divide-y">
            {fees.map((it) => (
              <li key={it.key} className="px-3 py-3 flex items-center justify-between">
                <span className="text-sm text-[#222]">{it.label}</span>
                <span className="text-sm font-medium">{formatPrice(it.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Total */}
      <div className="rounded-xl bg-gray-50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total estimé</span>
          <span className="font-semibold">{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          Prix indicatifs. Confirmation finale au moment de la prise de rendez-vous.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 transition"
        >
          Vider le devis
        </button>
      </div>
    </div>
  );

  return (
    <aside aria-label="Récapitulatif du devis" className="w-full">
      {/* Desktop */}
      <div className="hidden lg:block lg:sticky lg:top-6">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-[#edfbe2] border-b border-gray-200">
            <h3 className="text-base font-semibold text-[#222]">Récapitulatif</h3>
            <p className="text-xs text-gray-600">Mis à jour en temps réel</p>
          </div>
          {renderDetails()}
        </div>
      </div>

      {/* Mobile : sticky bottom + tiroir */}
      <div className="lg:hidden">
        <div className="fixed bottom-0 inset-x-0 z-40">
          <div className="mx-auto max-w-6xl">
            <div className="m-3 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 shadow-lg">
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Total estimé</div>
                  <div className="text-base font-semibold">{formatPrice(subtotal)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Voir le détail
                  </button>
                  <button
                    type="button"
                    onClick={onClear}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Vider
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {open && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              className="fixed bottom-0 inset-x-0 z-50 rounded-t-2xl bg-white shadow-2xl max-h-[75vh] overflow-y-auto"
            >
              <div className="px-5 py-3 border-b flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#222]">Récapitulatif</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                  aria-label="Fermer"
                >
                  Fermer ✕
                </button>
              </div>
              {renderDetails()}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default QuoteCard;
