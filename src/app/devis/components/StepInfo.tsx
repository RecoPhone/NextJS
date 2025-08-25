"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type ClientAddress = {
  street: string;
  number: string;
  postalCode: string;
  city: string;
};

export type ClientInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
  payInTwo: boolean;
  signatureDataUrl?: string | null;
  aDomicile: boolean;
  address?: ClientAddress | null;
  cgvAccepted: boolean;

  // Distance & frais
  distanceKm?: number | null;
  travelFee?: number | null;
};

export type StepInfoProps = {
  value: ClientInfo;
  onChange: (val: ClientInfo) => void;
  onValidityChange?: (isValid: boolean) => void;
};

// ---- Déplacement ----
const BASE_ADDRESS_TEXT = "Rte de Saussin 38/23a, 5190 Jemeppe-sur-Sambre, Belgique";
const FREE_RADIUS_KM = 15;
const RATE_EUR_PER_KM = 3.5;

const emailOk = (v: string) => /\S+@\S+\.\S+/.test(v);
const phoneOk = (v: string) => v.replace(/\D/g, "").length >= 8;

const StepInfo: React.FC<StepInfoProps> = ({ value, onChange, onValidityChange }) => {
  const v = value;

  // ===== Validation globale step =====
  const isBaseValid = v.firstName.trim() !== "" && v.lastName.trim() !== "" && emailOk(v.email) && phoneOk(v.phone);
  const isPay2xValid = !v.payInTwo || !!v.signatureDataUrl;

  const addr = v.address;
  // Adresse complète (sans CGV) — sert pour l’auto-calcul
  const isAddressComplete =
    !!addr &&
    addr.street.trim() !== "" &&
    addr.number.trim() !== "" &&
    addr.postalCode.trim() !== "" &&
    addr.city.trim() !== "";

  // Pour valider l’étape on garde la contrainte CGV si aDomicile
  const isAddrValidForStep = !v.aDomicile || (isAddressComplete && v.cgvAccepted === true);

  const isValid = isBaseValid && isPay2xValid && isAddrValidForStep;

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  // ===== Signature Canvas =====
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const width = Math.min(parent?.clientWidth ?? 320, 640);
    const height = 160;
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#222";
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
    }
  };

  useEffect(() => {
    if (v.payInTwo) setupCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.payInTwo]);

  const startDraw = (x: number, y: number) => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!ctx || !c) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };
  const drawTo = (x: number, y: number) => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!ctx || !isDrawing) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasDrawn(true);
  };

  // ===== Handlers génériques =====
  const merge = (patch: Partial<ClientInfo>) => onChange({ ...v, ...patch });
  const mergeAddr = (patch: Partial<ClientAddress>) =>
    onChange({
      ...v,
      address: { ...(v.address ?? { street: "", number: "", postalCode: "", city: "" }), ...patch },
    });

  // Si on décoche "à domicile", on nettoie l’adresse & CGV & distance/frais
  useEffect(() => {
    if (!v.aDomicile) {
      onChange({ ...v, address: null, cgvAccepted: false, distanceKm: null, travelFee: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.aDomicile]);

  // ===== Auto-calcul distance & frais (debounce 600 ms) =====
  const [loadingDist, setLoadingDist] = useState(false);
  const clientAddressText = useMemo(() => {
    if (!addr) return "";
    return `${addr.street} ${addr.number}, ${addr.postalCode} ${addr.city}, Belgique`;
  }, [addr]);

  useEffect(() => {
    if (!(v.aDomicile && isAddressComplete)) return;

    const handle = setTimeout(async () => {
      try {
        setLoadingDist(true);

        const [gFromRes, gToRes] = await Promise.all([
          fetch(`/api/geocode?q=${encodeURIComponent(BASE_ADDRESS_TEXT)}&country=be`).then(r => r.json()),
          fetch(`/api/geocode?q=${encodeURIComponent(clientAddressText)}&country=be`).then(r => r.json()),
        ]);

        if (!gFromRes?.lat || !gToRes?.lat) throw new Error("geocode");

        const distRes = await fetch(
          `/api/distance?from=${encodeURIComponent(`${gFromRes.lat},${gFromRes.lon}`)}&to=${encodeURIComponent(`${gToRes.lat},${gToRes.lon}`)}`
        ).then(r => r.json());

        const distanceKm: number = distRes?.distanceKm ?? 0;
        const beyond = Math.max(0, distanceKm - FREE_RADIUS_KM);
        const travelFee = parseFloat((beyond * RATE_EUR_PER_KM).toFixed(2));

        onChange({ ...v, distanceKm, travelFee });
      } catch {
        onChange({ ...v, distanceKm: null, travelFee: null });
      } finally {
        setLoadingDist(false);
      }
    }, 600); // <— debounce

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.aDomicile, addr?.street, addr?.number, addr?.postalCode, addr?.city]);

  // ===== UI =====
  return (
    <section aria-labelledby="step-info-title" className="w-full">
      <header className="mb-3">
        <h2 id="step-info-title" className="text-xl font-semibold text-[#222]">3) Vos informations</h2>
        <p className="text-sm text-gray-600">Renseignez vos coordonnées. Options supplémentaires selon votre choix.</p>
      </header>

      {/* Coordonnées de base */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
          <input type="text" value={v.firstName} onChange={(e) => merge({ firstName: e.target.value })}
                 className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
          <input type="text" value={v.lastName} onChange={(e) => merge({ lastName: e.target.value })}
                 className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" value={v.email} onChange={(e) => merge({ email: e.target.value })}
                 className={["w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                   emailOk(v.email) ? "border-gray-300 focus:ring-[#54b435]" : "border-red-300 focus:ring-red-300"].join(" ")} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone *</label>
          <input type="tel" value={v.phone} onChange={(e) => merge({ phone: e.target.value })}
                 className={["w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                   phoneOk(v.phone) ? "border-gray-300 focus:ring-[#54b435]" : "border-red-300 focus:ring-red-300"].join(" ")} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Précisions (facultatif)</label>
          <textarea value={v.notes ?? ""} onChange={(e) => merge({ notes: e.target.value })} rows={3}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]" />
        </div>
      </div>

      {/* Options */}
      <div className="mt-4 space-y-4">
        {/* Payer en deux fois */}
        <div className="rounded-2xl border border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-[#222]">Payer en deux fois</label>
              <p className="text-[11px] text-gray-500">Une signature manuscrite est requise.</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={v.payInTwo}
                     onChange={(e) => merge({ payInTwo: e.target.checked, signatureDataUrl: e.target.checked ? v.signatureDataUrl ?? null : null })} />
              <span className="w-11 h-6 bg-gray-300 rounded-full relative transition peer-checked:bg-[#54b435]">
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:left-6" />
              </span>
            </label>
          </div>

          {v.payInTwo && (
            <div className="px-4 pb-4">
              <div className="rounded-xl border border-gray-200 p-3">
                <p className="text-xs text-gray-600 mb-2">Signez ci-dessous :</p>
                <div className="relative">
                  <canvas ref={canvasRef}
                          className="w-full rounded-lg border border-gray-300 touch-none bg-white"
                          onPointerDown={(e) => { (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId); const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); startDraw(e.clientX - r.left, e.clientY - r.top); }}
                          onPointerMove={(e) => { const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); drawTo(e.clientX - r.left, e.clientY - r.top); }}
                          onPointerUp={() => endDraw()} />
                  {!hasDrawn && !v.signatureDataUrl && (
                    <span className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">Tracez votre signature…</span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={() => { setupCanvas(); setHasDrawn(false); merge({ signatureDataUrl: null }); }}
                          className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Effacer</button>
                  <button type="button" onClick={() => { const c = canvasRef.current; if (!c) return; merge({ signatureDataUrl: c.toDataURL("image/png") }); }}
                          className="rounded-xl px-3 py-1.5 text-sm text-white" style={{ backgroundColor: "#54b435" }}>Enregistrer</button>
                  {v.signatureDataUrl && <span className="text-[11px] text-gray-500">✓ Signature enregistrée</span>}
                </div>
                {!isPay2xValid && <p className="mt-2 text-[11px] text-red-500">Signature requise.</p>}
              </div>
            </div>
          )}
        </div>

        {/* À domicile */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-[#222]">Réparation à domicile</label>
              <p className="text-[11px] text-gray-500">Belgique uniquement. 15 km offerts, {RATE_EUR_PER_KM.toFixed(1)} €/km au-delà.</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={v.aDomicile}
                     onChange={(e) => merge({ aDomicile: e.target.checked })} />
              <span className="w-11 h-6 bg-gray-300 rounded-full relative transition peer-checked:bg-[#54b435]">
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:left-6" />
              </span>
            </label>
          </div>

          {v.aDomicile && (
            <div className="px-4 pb-4">
              {/* Adresse */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rue *</label>
                  <input type="text" value={addr?.street ?? ""} onChange={(e) => mergeAddr({ street: e.target.value })}
                         className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">N° *</label>
                  <input type="text" value={addr?.number ?? ""} onChange={(e) => mergeAddr({ number: e.target.value })}
                         className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Code postal *</label>
                  <input type="text" value={addr?.postalCode ?? ""} onChange={(e) => mergeAddr({ postalCode: e.target.value })}
                         className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ville *</label>
                  <input type="text" value={addr?.city ?? ""} onChange={(e) => mergeAddr({ city: e.target.value })}
                         className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]" />
                </div>
              </div>

              {/* Résultat auto-calcul */}
              <div className="mt-3">
                {loadingDist ? (
                  <span className="text-sm text-gray-700">Calcul de la distance…</span>
                ) : (v.distanceKm ?? null) !== null ? (
                  <span className="text-sm text-gray-700">
                    Distance estimée : <strong>{(v.distanceKm ?? 0).toFixed(1)} km</strong> — Frais :
                    <strong> {new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(v.travelFee ?? 0)}</strong>
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">Renseignez l’adresse pour estimer les frais de déplacement.</span>
                )}
              </div>

              <div className="mt-3">
                <label className="inline-flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-[#54b435] focus:ring-[#54b435]"
                         checked={v.cgvAccepted} onChange={(e) => merge({ cgvAccepted: e.target.checked })} />
                  <span>J’ai lu et j’accepte les <a href="/cgv" className="text-[#54b435] underline">CGV</a>.*</span>
                </label>
                {!isAddrValidForStep && v.aDomicile && (
                  <p className="mt-1 text-[11px] text-red-500">Adresse complète et acceptation des CGV requises.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isValid && <div className="mt-3 text-[12px] text-red-600">Merci de compléter les champs requis avant de continuer.</div>}
    </section>
  );
};

export default StepInfo;
