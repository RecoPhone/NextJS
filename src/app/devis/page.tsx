"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Stepper from "./components/Stepper";
import StepModel, { type Categorie } from "./components/StepModel";
import StepRepairs from "./components/StepRepairs";
import StepInfo, { type ClientInfo } from "./components/StepInfo";
import StepSchedule from "./components/StepSchedule";
import StepResume, { type StepResumeHandle } from "./components/StepResume";
import DeviceTabs from "./components/DeviceTabs";
import QuoteCard, { type QuoteItem, type QuoteDevice } from "./components/QuoteCard";
import prices from "./data/prices.json";
import Link from "next/link";
import Script from "next/script";

type StepKey = "device" | "repairs" | "info" | "schedule" | "resume";

// Helpers
const genId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
const createDevice = (): QuoteDevice => ({ id: genId(), category: undefined, model: undefined, items: [] });

// Autosave
const DRAFT_KEY = "recophone:devis:draft";
const DRAFT_TTL_MS = 15 * 60 * 1000; // 15 min

const initialClient: ClientInfo = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
  payInTwo: false,
  signatureDataUrl: null,
  aDomicile: false,
  address: null,
  cgvAccepted: false,
  travelFee: null,
};

// Contenu SEO — HowTo & FAQ
const howToSteps = [
  { id: "howto-step-1", title: "Choisir l’appareil", text: "Sélectionnez votre marque et modèle (iPhone, iPad, Samsung, Xiaomi, OnePlus, Google…)." },
  { id: "howto-step-2", title: "Décrire la réparation", text: "Écran, batterie, dock de charge, face arrière, caméras… Ajoutez une ou plusieurs réparations." },
  { id: "howto-step-3", title: "Renseigner vos infos", text: "Coordonnées, options et, si nécessaire, intervention à domicile avec frais transparents." },
  { id: "howto-step-4", title: "Valider & recevoir le devis", text: "Vous recevez votre récapitulatif par e-mail. Vous pouvez réserver un créneau le samedi." },
];

const faqs = [
  { q: "Combien de temps pour obtenir mon devis ?", a: "Généralement en quelques minutes après validation. Le récapitulatif est envoyé automatiquement par e-mail." },
  { q: "Quelles marques et modèles prenez-vous en charge ?", a: "Apple (iPhone, iPad), Samsung (S, A, Note, Tab), Xiaomi, OnePlus et Google. Pour iPad : LCD, vitre (touchscreen) et batterie." },
  { q: "La garantie est-elle incluse ?", a: "Oui, les réparations sont garanties 12 mois (pièces et main d’œuvre)." },
  { q: "Proposez-vous des créneaux le samedi ?", a: "Oui. Le calendrier ne propose que des créneaux le samedi pour plus de simplicité." },
  { q: "Mes données sont-elles en sécurité ?", a: "Nous intervenons sans consulter vos contenus. Conseil : faites une sauvegarde avant la réparation." },
  {
    q: "Et si je souhaite lisser mon budget ?",
    a: <>Découvrez nos <Link href="/abonnements" className="underline hover:no-underline">abonnements</Link> pour bénéficier d’avantages et de réductions.</>,
  },
];

const PageDevis: React.FC = () => {
  const data = prices as Categorie[];

  // Devis multi-appareils
  const [devices, setDevices] = useState<QuoteDevice[]>([createDevice()]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Infos client
  const [client, setClient] = useState<ClientInfo>(initialClient);
  const [infoValid, setInfoValid] = useState<boolean>(false);
  const [slotISO, setSlotISO] = useState<string | null>(null);

  // Steps dynamiques
  const steps = useMemo(() => {
    const arr = [
      { key: "device", label: "Appareil" },
      { key: "repairs", label: "Réparations" },
      { key: "info", label: "Informations" },
    ] as { key: StepKey; label: string }[];
    if (client.aDomicile) arr.push({ key: "schedule", label: "Créneau" });
    arr.push({ key: "resume", label: "Résumé" });
    return arr;
  }, [client.aDomicile]);

  const [current, setCurrent] = useState<number>(0);
  useEffect(() => { if (current >= steps.length) setCurrent(steps.length - 1); }, [steps, current]);
  const stepKey = steps[current]?.key;

  // Device courant
  const currentDevice = devices[activeIndex];
  const selectedCategory = currentDevice?.category;
  const selectedModel = currentDevice?.model;
  const items = currentDevice?.items ?? [];

  // Conditions "Continuer"
  const canNextFromModel = !!selectedCategory && !!selectedModel;
  const anyRepairs = devices.some((d) => d.items.length > 0);
  const canNextFromRepairs = anyRepairs;
  const canNextFromInfo = infoValid;
  const canNextFromSchedule = !client.aDomicile || !!slotISO;

  const canAdvance = (() => {
    switch (stepKey) {
      case "device": return canNextFromModel;
      case "repairs": return canNextFromRepairs;
      case "info": return canNextFromInfo;
      case "schedule": return canNextFromSchedule;
      case "resume": return true;
      default: return false;
    }
  })();

  // Navigation stepper
  const onStepperNavigate = (i: number) => {
    if (i <= current) return setCurrent(i);
    let ok = true;
    for (let s = current; s < i; s++) {
      const k = steps[s].key;
      if (k === "device" && !canNextFromModel) { ok = false; break; }
      if (k === "repairs" && !canNextFromRepairs) { ok = false; break; }
      if (k === "info" && !canNextFromInfo) { ok = false; break; }
      if (k === "schedule" && !canNextFromSchedule) { ok = false; break; }
    }
    if (ok) setCurrent(i);
  };

  const goPrev = () => setCurrent((c) => Math.max(0, c - 1));
  const goNext = () => { if (canAdvance) setCurrent((c) => Math.min(c + 1, steps.length - 1)); };

  // Actions Appareils
  const addDevice = () => { const nextIndex = devices.length; setDevices((p) => [...p, createDevice()]); setActiveIndex(nextIndex); setCurrent(0); };
  const removeDevice = (index: number) => {
    setDevices((prev) => { const arr = prev.filter((_, i) => i !== index); return arr.length ? arr : [createDevice()]; });
    setActiveIndex((i) => (index < i ? i - 1 : index === i ? Math.max(0, i - 1) : i));
  };
  const switchDevice = (index: number) => setActiveIndex(index);
  const setDevice = (patch: Partial<QuoteDevice>) => setDevices((prev) => prev.map((d, i) => (i === activeIndex ? { ...d, ...patch } : d)));
  const setDeviceItems = (newItems: QuoteItem[]) => setDevices((prev) => prev.map((d, i) => (i === activeIndex ? { ...d, items: newItems } : d)));
  const handleSelectModel = (category: string, model: string) => {
    setDevice({ category, model, items: [] });
    const cat = data.find((c) => c.categorie === category);
    const mod = cat?.modeles.find((m) => m.nom === model);
    if (mod?.reparations?.length) setCurrent(1);
  };

  // RESET global (après finalisation)
  const handleClearAll = () => {
    setDevices([createDevice()]);
    setActiveIndex(0);
    setClient(initialClient);
    setSlotISO(null);
    setCurrent(0);
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  };

  // Frais
  const fees: QuoteItem[] = useMemo(() => {
    const fee = client.aDomicile ? (client.travelFee ?? 0) : 0;
    return fee > 0 ? [{ key: "travel", label: "Frais de déplacement", price: fee }] : [];
  }, [client.aDomicile, client.travelFee]);

  const isLast = current === steps.length - 1;

  // PERSISTENCE — RESTORE
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as { updatedAt: number; devices: QuoteDevice[]; activeIndex: number; client: ClientInfo; slotISO: string | null; current: number; };
      if (!draft?.updatedAt) return;
      if (Date.now() - draft.updatedAt > DRAFT_TTL_MS) { localStorage.removeItem(DRAFT_KEY); return; }
      setDevices(draft.devices?.length ? draft.devices : [createDevice()]);
      setActiveIndex(draft.activeIndex ?? 0);
      setClient(draft.client ?? initialClient);
      setSlotISO(draft.slotISO ?? null);
      setCurrent(draft.current ?? 0);
    } catch { /* ignore */ }
  }, []);

  // PERSISTENCE — AUTOSAVE
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const payload = { updatedAt: Date.now(), devices, activeIndex, client, slotISO, current };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch { /* ignore */ }
    }, 800);
    return () => clearTimeout(t);
  }, [devices, activeIndex, client, slotISO, current]);

  // Finalisation
  const resumeRef = useRef<StepResumeHandle>(null);
  const [finishing, setFinishing] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const handleFinish = async () => {
    if (finishing) return;
    try {
      setFinishing(true);
      await resumeRef.current?.finalize();
      handleClearAll();
      setFlash("Merci ! Votre demande est finalisée. Vous allez recevoir votre devis par e-mail.");
      setTimeout(() => setFlash(null), 6000);
    } catch (e) {
      console.error(e);
    } finally {
      setFinishing(false);
    }
  };

  // JSON-LD
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": typeof f.q === "string" ? f.q : "",
      "acceptedAnswer": { "@type": "Answer", "text": (typeof f.a === "string" ? f.a : "Voir notre page Abonnements.") }
    })),
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Comment demander un devis de réparation RecoPhone",
    "description": "Étapes pour obtenir un devis de réparation de smartphone ou tablette chez RecoPhone.",
    "step": howToSteps.map((s, i) => ({ "@type": "HowToStep", "position": i + 1, "name": s.title, "text": s.text, "url": `https://www.recophone.be/devis#${s.id}` })),
  };

  // Petite ligne séparatrice réutilisable
  const SectionDivider = () => (
    <div aria-hidden className="mx-auto h-px w-full bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
  );

  return (
    <main className="min-h-[70vh] px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* H1 sr-only pour SEO/Accessibilité */}
      <h1 className="sr-only">Devis réparation smartphone & tablette – RecoPhone</h1>

      {/* Flash global */}
      {flash && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {flash}
          </div>
        </div>
      )}

      {/* CONTENEUR PRINCIPAL AVEC RYTHME VERTICAL */}
      <div className="mx-auto max-w-6xl space-y-12 md:space-y-16">
        {/* ── HowTo ─────────────────────────────────────────────────────────── */}
        <section
          id="howto"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          aria-labelledby="howto-title"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="howto-title" className="text-xl sm:text-2xl font-extrabold text-[#222]">
                Comment ça marche ?
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                4 étapes simples pour obtenir votre devis RecoPhone.
              </p>
            </div>
            {/* (CTA ancre retiré volontairement) */}
          </div>

          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {howToSteps.map((s, i) => (
              <li key={s.id} id={s.id} className="group rounded-xl border border-gray-200 p-4 transition hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-[#222]">{s.title}</h3>
                </div>
                <p className="mt-3 text-sm text-neutral-700">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Séparateur visuel doux */}
        <SectionDivider />

        {/* ── Bloc FORMULAIRE ──────────────────────────────────────────────── */}
        <section aria-label="Formulaire de devis" className="space-y-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#222]">Devis en ligne</h2>
            <p className="mt-1 text-sm text-gray-600">
              {client.aDomicile
                ? "Appareil(s) → Réparations → Informations → Créneau → Résumé"
                : "Appareil(s) → Réparations → Informations → Résumé"}
            </p>
          </div>

          {/* Stepper */}
          <div>
            <Stepper steps={steps} current={current} onNavigate={onStepperNavigate} />
          </div>

          {/* Grille (formulaire) */}
          <div
            id="devis-form"
            className="scroll-mt-28 grid grid-cols-1 gap-6 lg:grid-cols-3"
          >
            {/* Zone principale */}
            <div className="lg:col-span-2">
              {/* Tabs Appareils */}
              <DeviceTabs
                devices={devices.map((d, i) => ({
                  id: d.id,
                  label: d.model ? d.model : `Appareil ${i + 1}`,
                  isComplete: !!(d.category && d.model),
                }))}
                activeIndex={activeIndex}
                onSwitch={setActiveIndex}
                onAdd={addDevice}
                onRemove={removeDevice}
              />

              {/* Carte step courante */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                {stepKey === "device" && (
                  <StepModel
                    data={data}
                    selectedCategory={selectedCategory}
                    selectedModel={selectedModel}
                    onSelect={handleSelectModel}
                  />
                )}

                {stepKey === "repairs" && (
                  <StepRepairs
                    data={data}
                    selectedCategory={selectedCategory}
                    selectedModel={selectedModel}
                    items={items}
                    onChangeItems={setDeviceItems}
                  />
                )}

                {stepKey === "info" && (
                  <StepInfo
                    value={client}
                    onChange={(val) => { setClient(val); if (!val.aDomicile) setSlotISO(null); }}
                    onValidityChange={setInfoValid}
                  />
                )}

                {stepKey === "schedule" && (
                  <StepSchedule
                    selectedISO={slotISO}
                    onChange={setSlotISO}
                    blockedDates={[
                      "2025-01-01","2025-04-21","2025-05-01","2025-05-29","2025-06-09",
                      "2025-07-21","2025-08-15","2025-11-01","2025-11-11","2025-12-25"
                    ]}
                    autoSelectNextSaturday={true}
                  />
                )}

                {stepKey === "resume" && (
                  <StepResume
                    ref={resumeRef}
                    devices={devices}
                    payInTwo={client.payInTwo}
                    signatureDataUrl={client.signatureDataUrl}
                    aDomicile={client.aDomicile}
                    address={client.address}
                    client={{
                      firstName: client.firstName,
                      lastName: client.lastName,
                      email: client.email,
                      phone: client.phone,
                      notes: client.notes,
                      ...(() => {
                        const v: unknown = (client as any).travelFee;
                        const n = typeof v === "string" ? Number(v.trim()) : typeof v === "number" ? v : NaN;
                        return Number.isFinite(n) ? { travelFee: n } : {};
                      })(),
                    }}
                  />
                )}
              </div>

              {/* Controls (Stepper) */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={current === 0}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  ← Retour
                </button>

                {(() => {
                  const base = "rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
                  if (!canAdvance && stepKey !== "resume") {
                    return <button type="button" disabled className={base} style={{ backgroundColor: "#54b435" }}>Continuer</button>;
                  }
                  if (!isLast) {
                    return (
                      <button
                        type="button"
                        onClick={goNext}
                        disabled={!canAdvance}
                        className={base}
                        style={{ backgroundColor: "#54b435" }}
                      >
                        Continuer
                      </button>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={finishing}
                      className={base}
                      style={{ backgroundColor: "#54b435" }}
                    >
                      {finishing ? "Finalisation…" : "Terminer"}
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Récap */}
            <div className="lg:col-span-1">
              <QuoteCard devices={devices} fees={fees} onClear={handleClearAll} />
            </div>
          </div>
        </section>

        {/* Séparateur visuel doux */}
        <SectionDivider />

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <section
          id="faq"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          aria-labelledby="faq-title"
        >
          <h2 id="faq-title" className="text-xl sm:text-2xl font-extrabold text-[#222]">Questions fréquentes</h2>
          <div className="mt-4 space-y-3">
            {faqs.map((item, idx) => (
              <details key={idx} className="group rounded-xl border border-gray-200 p-4 open:bg-[#edfbe2]/40">
                <summary className="cursor-pointer list-none text-sm font-semibold text-[#222]">{item.q}</summary>
                <div className="mt-2 text-sm text-neutral-700">
                  {typeof item.a === "string" ? item.a : item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* JSON-LD */}
      <Script id="ld-devis-howto" type="application/ld+json">
        {JSON.stringify(howToJsonLd)}
      </Script>
      <Script id="ld-devis-faq" type="application/ld+json">
        {JSON.stringify(faqJsonLd)}
      </Script>

      {/* micro-footer */}
      <div className="mx-auto max-w-6xl mt-10 text-[11px] text-gray-500">
        RecoPhone — des réparations éco-responsables, au prix juste.
      </div>
    </main>
  );
};

export default PageDevis;
