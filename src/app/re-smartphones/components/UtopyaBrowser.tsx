"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { UtopyaItem } from "@/types/utopya";
import { useCart } from "@/hooks/useCart";
import type { BaseItem } from "@/lib/cart/types";

type SortKey = "name_asc" | "price_asc" | "price_desc";

type Props = {
  initialItems: UtopyaItem[];
};

const VAT_RATE = 21;               // BE 21%
const PAGE_SIZE = 10;              // 10 items par défaut
const DEFAULT_BRAND = "iPhone";    // filtre initial
const ALLOWED_BRANDS = ["iPhone", "Samsung", "iPad"] as const;

/* ---------- Abonnement (CTA) ---------- */
const ABO_PRICE_TTC = 9.9; // Prix mensuel TTC de l'abonnement
const ABO_NAME = "Abonnement RecoCare (mensuel)";

/* ---------- Design tokens ---------- */
const WRAP = "max-w-7xl mx-auto px-3 sm:px-4 lg:px-6";
const BTN_BASE =
  "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition";
const BTN_PRIMARY =
  "text-white bg-[#54b435] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_PRIMARY_IN_CART =
  "text-white bg-emerald-600 cursor-default";
const BTN_SECONDARY =
  "border text-[#222] hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed";

/* ---------- Prix ---------- */
function parsePriceTTC(price?: string | null): number | null {
  if (!price) return null;
  let s = price.replace(/\u00A0/g, " ").trim();

  // Cas "242€95"
  const euroMiddle = s.match(/(^|\s)(\d+)\s*€\s*(\d{1,2})(\D|$)/);
  if (euroMiddle) {
    const intPart = euroMiddle[2];
    const decPart = euroMiddle[3].padEnd(2, "0");
    const n = Number(`${intPart}.${decPart}`);
    return Number.isFinite(n) ? n : null;
  }

  // Général
  let t = s.replace(/[^\d,.\s-]/g, "").replace(/\s/g, "");
  if (t.includes(",") && t.lastIndexOf(",") > t.lastIndexOf(".")) {
    t = t.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  } else {
    t = t.replace(/,/g, "");
  }
  const n = Number(t);
  if (Number.isFinite(n)) return n;

  // Filet de sécu
  const alt = s.match(/(\d{1,3}(?:[ .]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?)(?!.*\d)/);
  if (alt) {
    let u = alt[1].replace(/\s/g, "");
    if (u.includes(",") && u.lastIndexOf(",") > u.lastIndexOf(".")) {
      u = u.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
    } else {
      u = u.replace(/,/g, "");
    }
    const n2 = Number(u);
    if (Number.isFinite(n2)) return n2;
  }
  return null;
}
function ttcToHt(ttc: number, vat = VAT_RATE): number {
  const ht = ttc / (1 + vat / 100);
  return Math.round(ht * 100) / 100;
}
function formatTTCDisplay(ttc: number | null, fallback?: string | null) {
  if (ttc == null) return fallback ?? "Prix sur demande";
  return ttc.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });
}

/** Préfère le TTC numérique `price_raw_eur` s’il existe, sinon parse l’ancien champ texte `price`. */
function getPriceTTCFromItem(it: any): number | null {
  const raw = (it as any)?.price_raw_eur;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return parsePriceTTC(it.price);
}

/* ---------- Normalisations ---------- */
function brandTag(name?: string | null): "iPhone" | "Samsung" | "iPad" | "Autre" {
  if (!name) return "Autre";
  const s = name.toLowerCase();
  if (/\bipad\b/.test(s)) return "iPad";
  if (/\biphone|iphones\b/.test(s)) return "iPhone";
  if (/\bapple\b/.test(s)) return "iPhone";
  if (/samsung|galaxy|note|z\s?(flip|fold)/.test(s)) return "Samsung";
  return "Autre";
}
function fallbackCapacity(name?: string | null): string | null {
  if (!name) return null;
  const m = name.match(/(\d+)\s?(GB|Go|TB)/i);
  if (!m) return null;
  return `${m[1]} ${m[2].toUpperCase().replace("GO", "GB")}`;
}
function recencyScore(name?: string | null): number {
  if (!name) return 0;
  const s = name.toLowerCase();

  // iPhone 15/14/13..., Pro/Pro Max > Plus > standard
  const mIph = s.match(/iphone\s*(\d{1,2})/);
  if (mIph) {
    let base = Number(mIph[1]);
    if (/pro\s*max/.test(s)) base += 0.3;
    else if (/pro/.test(s)) base += 0.2;
    else if (/plus/.test(s)) base += 0.1;
    return 1000 + base;
  }
  if (/iphone\s*se/.test(s)) return 1010;

  // iPad Pro > Air > Mini > (classique) + année
  if (/\bipad\b/.test(s)) {
    let base = 920;
    if (/pro/.test(s)) base += 0.3;
    else if (/air/.test(s)) base += 0.2;
    else if (/mini/.test(s)) base += 0.1;
    const y = s.match(/20(1\d|2\d|3\d|4\d)/);
    if (y) base += Number(y[0].slice(2)) / 100;
    return base;
  }

  // Samsung : Z Fold/Flip > S > Note > A
  const mZFold = s.match(/z\s*fold\s*(\d+)/);
  if (mZFold) return 950 + Number(mZFold[1]);
  const mZFlip = s.match(/z\s*flip\s*(\d+)/);
  if (mZFlip) return 940 + Number(mZFlip[1]);
  const mSGal = s.match(/\bs\s?(\d{2})\b/);
  if (mSGal) return 900 + Number(mSGal[1]);
  const mNote = s.match(/note\s*(\d+)/);
  if (mNote) return 880 + Number(mNote[1]);
  const mA = s.match(/\ba\s?(\d{2,3})\b/);
  if (mA) return 800 + Number(mA[1]) / 10;

  return 0;
}

function fmtDate(epoch?: number) {
  if (!epoch) return null;
  try {
    return new Date(epoch * 1000).toLocaleString("fr-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

/** Récupère les IDs d’articles présents dans le panier actuel (selon ton contexte). */
function useCartIds() {
  const cart: any = useCart();
  const sources = [cart?.items, cart?.lines, cart?.state?.items, cart?.state?.lines];

  const ids = useMemo(() => {
    const set = new Set<string>();
    for (const arr of sources) {
      if (Array.isArray(arr)) {
        for (const it of arr) {
          const id = String(it?.id ?? it?.item?.id ?? it?.productId ?? it?.sku ?? "");
          if (id) set.add(id);
        }
      }
    }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sources?.map?.((x: any) => (Array.isArray(x) ? x.length : 0))), cart?.count]);

  return { ids, addItem: cart?.addItem as (item: BaseItem) => void };
}

/* ---------- Section d’info / réassurance (enrichie) ---------- */
function InfoSection() {
  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-start gap-3">
      <svg className="mt-0.5 h-5 w-5 flex-none text-[#54b435]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9 16.17l-3.88-3.88-1.41 1.41L9 19 20.29 7.71l-1.41-1.41z" />
      </svg>
      <span className="text-sm text-gray-700">{children}</span>
    </li>
  );

  const Badge = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-gray-700">
      {children}
    </span>
  );

  return (
    <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-[#222]">Qualité & Garanties RecoPhone</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 flex-none text-[#54b435]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25l7.5 3v6.75c0 4.28-3.17 8.15-7.5 9-4.33-.85-7.5-4.72-7.5-9V5.25l7.5-3z"/></svg>
          <div>
            <p className="font-medium text-[#222]">Garantie 2 ans</p>
            <p className="text-sm text-gray-600">
              24&nbsp;mois sur le bon fonctionnement. <strong>Hors casse, choc et oxydation/liquides</strong>.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 flex-none text-[#54b435]" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="7" width="16" height="10" rx="2"/><rect x="19" y="10" width="2" height="4" rx="1"/></svg>
          <div>
            <p className="font-medium text-[#222]">Batterie neuve</p>
            <p className="text-sm text-gray-600">Batterie remplacée par une neuve (ou équivalent performance) avant expédition.</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-base font-semibold text-[#222]">Comment lire les grades&nbsp;?</h4>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <Badge>A+</Badge>
              <span className="text-sm font-medium text-gray-800">Comme neuf</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li>Écran et châssis <strong>quasi impeccables</strong> (micro-traces invisibles à 20&nbsp;cm).</li>
              <li>Pas d’impact ni d’éraflure marquée.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <Badge>A</Badge>
              <span className="text-sm font-medium text-gray-800">Très bon état</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li>Légères micro-rayures possibles sur le châssis.</li>
              <li>Écran sans rayure visible allumé (aucun défaut d’affichage).</li>
            </ul>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <Badge>B</Badge>
              <span className="text-sm font-medium text-gray-800">Bon état</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li>Rayures <strong>légères à modérées</strong> sur châssis et/ou dos.</li>
              <li>Petites marques possibles; écran OK (mini micro-traces invisibles allumé).</li>
            </ul>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <Badge>C</Badge>
              <span className="text-sm font-medium text-gray-800">État correct</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li>Traces d’usage <strong>plus visibles</strong> (rayures marquées, petites bosses).</li>
              <li>Écran fonctionnel; micro-rayures possibles visibles éteint.</li>
            </ul>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Quel que soit le grade esthétique, l’appareil est <strong>100% fonctionnel</strong> et testé par nos soins.
        </p>
      </div>

      <div className="mt-6">
        <h4 className="text-base font-semibold text-[#222]">Couleur & lots MixABC</h4>
        <p className="mt-1 text-sm text-gray-700">
          Sur les lots <strong>MixABC</strong>, la <strong>couleur n’est pas garantie</strong> (au sein d’un même modèle/capacité).
          Les caractéristiques techniques restent identiques; la sélection se fait selon la disponibilité.
        </p>
      </div>

      <div className="mt-6">
        <h4 className="text-base font-semibold text-[#222]">Ce que vous recevez</h4>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          <li className="text-sm text-gray-700">Appareil <strong>débloqué tout opérateur</strong>, réinitialisé (aucun compte lié) et IMEI vérifié.</li>
          <li className="text-sm text-gray-700"><strong>Batterie neuve</strong> installée et test de charge.</li>
          <li className="text-sm text-gray-700">Câble/charge <span className="text-gray-600">(selon fiche produit)</span>.</li>
          <li className="text-sm text-gray-700">Tests multipoints (boutons, haut-parleurs, caméras, Wi-Fi, Bluetooth, capteurs…).</li>
        </ul>
      </div>

      <div className="mt-6">
        <h4 className="text-base font-semibold text-[#222]">Garantie & retours</h4>
        <ul className="mt-2 space-y-2">
          <li className="text-sm text-gray-700">Garantie légale de <strong>24&nbsp;mois</strong> sur le bon fonctionnement (hors casse/oxydation).</li>
          <li className="text-sm text-gray-700"><strong>Droit de rétractation 14&nbsp;jours</strong> pour les achats à distance. L’appareil doit être renvoyé dans son état d’origine.</li>
          <li className="text-sm text-gray-700">SAV réactif : assistance et prise en charge selon nos conditions.</li>
        </ul>
      </div>

      <p className="mt-5 text-xs text-gray-500">
        Les visuels sont non contractuels. Détails et accessoires selon la fiche produit. Pour toute question, contactez RecoPhone.
      </p>
    </section>
  );
}

export default function UtopyaBrowser({ initialItems }: Props) {
  const { ids: cartIds, addItem } = useCartIds();

  // Filtres (drawer mobile uniquement)
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState<string>(DEFAULT_BRAND); // iPhone par défaut
  const [sort, setSort] = useState<SortKey>("price_desc");  // tri initial : plus cher d'abord

  // Pagination locale
  const [visible, setVisible] = useState<number>(PAGE_SIZE);

  // Modal
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<UtopyaItem | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Enrichissement
  const enriched = useMemo(() => {
    return (initialItems ?? []).map((it) => {
      const btag = brandTag(it.name);
      const cap = it.capacity ?? fallbackCapacity(it.name);

      // ✅ utilise price_raw_eur si dispo
      const priceTTC = getPriceTTCFromItem(it);
      const priceHT  = priceTTC != null ? ttcToHt(priceTTC, VAT_RATE) : 0;
      const displayPrice = formatTTCDisplay(priceTTC, it.price);

      const recency = recencyScore(it.name);
      const id = (it.sku || it.url || it.name) ?? "";
      const inCart = cartIds.has(String(id));

      return {
        ...it,
        __id: id,
        brandTag: btag,
        capacity: cap,
        priceTTC,
        priceHT,
        displayPrice,
        recency,
        inCart,
      };
    });
  }, [initialItems, cartIds]);

  // Filtrage + tri (iPhone/Samsung/iPad seulement)
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let arr = enriched
      .filter((i) => ALLOWED_BRANDS.includes(i.brandTag as any))
      .filter((i) => {
        const okQ = !needle || (i.name?.toLowerCase().includes(needle) ?? false);
        const okBrand = brand === "all" ? true : i.brandTag === brand;
        return okQ && okBrand;
      });

    switch (sort) {
      case "price_asc":
        arr = arr.sort((a, b) => (a.priceTTC ?? Infinity) - (b.priceTTC ?? Infinity) || b.recency - a.recency);
        break;
      case "price_desc":
        arr = arr.sort((a, b) => (b.priceTTC ?? -Infinity) - (a.priceTTC ?? -Infinity) || b.recency - a.recency);
        break;
      default:
        arr = arr.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "") || b.recency - a.recency);
    }
    return arr;
  }, [enriched, q, brand, sort]);

  // Reset pagination quand on change les filtres
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [q, brand, sort]);

  // Modal helpers
  function openModal(item: UtopyaItem) {
    setCurrent(item);
    setOpen(true);
  }
  function closeModal() {
    setOpen(false);
    setCurrent(null);
  }
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Ajout au panier (HT + TVA)
  function handleAddToCart(p: any) {
    const id = (p.__id || p.sku || p.url || p.name || `utopya-${Math.random().toString(36).slice(2)}`) as string;

    const item: BaseItem = {
      id,
      type: "ACCESSORY",
      title: p.name ?? "Smartphone reconditionné",
      subtitle:
        [p.capacity, p.grade && `Grade ${String(p.grade).replace(/grade/i, "").trim()}`]
          .filter(Boolean)
          .join(" · ") || undefined,
      unitPrice: typeof p.priceHT === "number" ? p.priceHT : 0, // HT
      vatRate: VAT_RATE,
      quantity: 1,
      metadata: {
        source: "utopya",
        sku: p.sku ?? null,
        capacity: p.capacity ?? null,
        grade: p.grade ?? null,
        state: p.state ?? null,
        priceTTC: p.priceTTC ?? null,
        displayPrice: p.displayPrice ?? p.price ?? null,
        image: p.image ?? null,
        url: p.url ?? null,
        scrapedAt: p.scraped_at ?? null,
        brandTag: p.brandTag ?? null,
      },
    };

    addItem(item);
  }

  /* ---------- Abonnement : ajout lié à un produit (carte uniquement, sans popup) ---------- */
  function addSubscriptionFor(p: any) {
    const relatedId = (p.__id || p.sku || p.url || p.name || "unknown").toString();
    const id = `abo-${relatedId}`; // évite les doublons dans le panier
    const unitPriceHT = ttcToHt(ABO_PRICE_TTC, VAT_RATE);

    const item: BaseItem = {
      id,
      type: "ACCESSORY", // gardé simple pour compat CartItemType
      title: ABO_NAME,
      subtitle: "Assistance, diagnostic, prêt* (selon dispo)",
      unitPrice: unitPriceHT, // HT
      vatRate: VAT_RATE,
      quantity: 1,
      metadata: {
        source: "upsell",
        related: relatedId,
        priceTTC: ABO_PRICE_TTC,
        billing: "monthly",
      },
    };

    addItem(item);
  }

  // Liste paginée
  const pageItems = filtered.slice(0, visible);

  return (
    <section className={WRAP}>
      {/* Header: compteur + bouton Filtres (mobile uniquement) */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-medium text-[#222]">{filtered.length}</span> résultats
          {brand ? <> · <span className="capitalize">{brand}</span></> : null}
          {q ? <> · “{q}”</> : null}
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className={`${BTN_BASE} ${BTN_SECONDARY} whitespace-nowrap sm:hidden`}
          aria-expanded={showFilters}
          aria-controls="filters-panel"
        >
          Filtres & tri
        </button>
      </div>

      {/* Filtres Desktop (toujours visibles) */}
      <div id="filters-panel" className="mb-5 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        <input
          placeholder="Rechercher un modèle (ex: iPhone 15)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher"
        />

        {/* Marque: iPhone (défaut) / Samsung / iPad */}
        <select
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          aria-label="Filtrer par marque"
        >
          {ALLOWED_BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* Tri (par défaut “prix décroissant”) */}
        <select
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Trier"
        >
          <option value="price_desc">Prix : plus cher</option>
          <option value="price_asc">Prix : moins cher</option>
          <option value="name_asc">Nom (A→Z)</option>
        </select>
      </div>

      {/* Filtres Mobile : drawer */}
      {showFilters && (
        <div className="sm:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} aria-hidden />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">Filtres & tri</h3>
              <button onClick={() => setShowFilters(false)} className={`${BTN_BASE} ${BTN_SECONDARY}`}>
                Fermer
              </button>
            </div>

            <div className="grid gap-3">
              <input
                placeholder="Rechercher (ex: iPhone 15)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Rechercher"
              />
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                aria-label="Filtrer par marque"
              >
                {ALLOWED_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Trier"
              >
                <option value="price_desc">Prix : plus cher</option>
                <option value="price_asc">Prix : moins cher</option>
                <option value="name_asc">Nom (A→Z)</option>
              </select>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowFilters(false)} className={`${BTN_BASE} ${BTN_PRIMARY} flex-1 whitespace-nowrap`}>
                Appliquer
              </button>
              <button
                onClick={() => {
                  setQ("");
                  setBrand(DEFAULT_BRAND);
                  setSort("price_desc");
                }}
                className={`${BTN_BASE} ${BTN_SECONDARY} flex-1 whitespace-nowrap`}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {pageItems.length === 0 ? (
        <p className="text-gray-600">Aucun résultat avec ces filtres.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5 lg:gap-6">
            {pageItems.map((p, idx) => {
              const key = (p.__id || p.sku || p.url || p.name || idx.toString()) as string;
              const inCart = Boolean(p.inCart || cartIds.has(String(key)));
              const relatedId = (p.__id || p.sku || p.url || p.name || "").toString();
              const hasAbo = cartIds.has(`abo-${relatedId}`);

              return (
                <article
                  key={key}
                  className={`group rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                    inCart ? "border-emerald-300" : "border-gray-200"
                  }`}
                >
                  {/* Image */}
                  <div className="w-full overflow-hidden rounded-xl bg-white border border-gray-100 flex items-center justify-center aspect-square sm:aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image ?? "/placeholder.png"}
                      alt={p.name ?? "Produit reconditionné"}
                      className="max-h-full w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>

                  <h3 className="mt-3 line-clamp-2 text-[15px] sm:text-base font-semibold text-[#222]">
                    {p.name ?? "Modèle inconnu"}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] sm:text-xs text-gray-600">
                    <span className="rounded-full border px-2 py-0.5">{p.brandTag}</span>
                    {p.capacity && <span className="rounded-full border px-2 py-0.5">{p.capacity}</span>}
                    {p.grade && (
                      <span className="rounded-full border px-2 py-0.5">
                        {`Grade ${String(p.grade).replace(/grade/i, "").trim()}`}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <p className="text-lg sm:text-xl font-bold text-[#54b435]">
                      {p.displayPrice ?? p.price ?? "Prix sur demande"}
                    </p>
                    {inCart && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        Dans le panier
                      </span>
                    )}
                  </div>

                  {/* Boutons : spacing via gap, pas de débordement */}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => handleAddToCart(p)}
                      disabled={inCart}
                      className={`${BTN_BASE} ${inCart ? BTN_PRIMARY_IN_CART : BTN_PRIMARY} flex-1 whitespace-nowrap`}
                      aria-live="polite"
                      title={inCart ? "Déjà dans le panier" : "Ajouter cet article au panier"}
                    >
                      <span>Ajouter au panier</span>
                    </button>

                    <button
                      onClick={() => openModal(p)}
                      className={`${BTN_BASE} ${BTN_SECONDARY} flex-1 whitespace-nowrap`}
                      aria-haspopup="dialog"
                    >
                      <span>Détails</span>
                    </button>
                  </div>

                  {/* CTA abonnement : visible si l'article est dans le panier et pas d'abo lié (sans tooltip) */}
                  {inCart && !hasAbo && (
                    <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-sm font-medium text-emerald-800">
                        Protégez-le pour {formatTTCDisplay(ABO_PRICE_TTC)} / mois
                      </div>
                      <p className="mt-1 text-xs text-emerald-700">
                        Assistance prioritaire, diagnostic, prêt* (selon disponibilité).
                      </p>
                      <div className="mt-2">
                        <button
                          onClick={() => addSubscriptionFor(p)}
                          className={`${BTN_BASE} ${BTN_PRIMARY} whitespace-nowrap`}
                        >
                          Ajouter l’abonnement
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {filtered.length > visible && (
            <div className="mt-5 flex justify-center">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className={`${BTN_BASE} ${BTN_SECONDARY} whitespace-nowrap`}
              >
                <span>
                  Voir plus ({Math.min(PAGE_SIZE, filtered.length - visible)} de plus)
                </span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Section réassurance */}
      <InfoSection />

      {/* Modal de détails (pas d'abo ici) */}
      {open && current && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="utopya-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
              setCurrent(null);
            }
          }}
        >
          <div className="w-full max-w-full sm:max-w-xl sm:rounded-2xl rounded-none bg-white shadow-2xl ring-1 ring-black/5 max-h-[100vh] sm:max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-4 sm:px-5 py-3">
              <h2 id="utopya-modal-title" className="text-base sm:text-lg font-semibold text-[#222] line-clamp-2 pr-4">
                {current.name ?? "Détails du produit"}
              </h2>
              <button
                ref={closeBtnRef}
                onClick={() => {
                  setOpen(false);
                  setCurrent(null);
                }}
                className={`${BTN_BASE} ${BTN_SECONDARY} whitespace-nowrap`}
                aria-label="Fermer la fenêtre"
              >
                <span>Fermer</span>
              </button>
            </div>

            <div className="grid gap-4 p-4 sm:p-5 sm:grid-cols-2">
              <div className="col-span-1 flex items-center justify-center rounded-xl border border-gray-100 bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={(current as any).image ?? "/placeholder.png"}
                  alt={current.name ?? "Produit reconditionné"}
                  className="max-h-72 w-auto object-contain"
                />
              </div>

              <div className="col-span-1 space-y-2 text-sm text-gray-700">
                <p>
                  <span className="text-gray-500">Marque :</span>{" "}
                  <strong>{brandTag(current.name)}</strong>
                </p>
                {(current.capacity || fallbackCapacity(current.name)) && (
                  <p>
                    <span className="text-gray-500">Capacité :</span>{" "}
                    <strong>{current.capacity ?? fallbackCapacity(current.name)}</strong>
                  </p>
                )}
                {current.grade && (
                  <p>
                    <span className="text-gray-500">Grade :</span>{" "}
                    <strong>{String(current.grade).replace(/grade/i, "").trim()}</strong>
                  </p>
                )}
                {(() => {
                  const ttc = getPriceTTCFromItem(current);
                  return (
                    <p>
                      <span className="text-gray-500">Prix (TTC) :</span>{" "}
                      <strong className="text-[#54b435]">
                        {formatTTCDisplay(ttc, (current as any).price)}
                      </strong>
                    </p>
                  );
                })()}
                {fmtDate((current as any).scraped_at) && (
                  <p className="text-xs text-gray-500">Mise à jour : {fmtDate((current as any).scraped_at)}</p>
                )}

                <div className="pt-1">
                  {(() => {
                    const key = (current.sku || current.url || current.name)?.toString() ?? "";
                    const inCart = cartIds.has(key);
                    return (
                      <button
                        onClick={() => {
                          if (!inCart) {
                            const enrichedItem = enriched.find((x) => String((x as any).__id) === key);
                            handleAddToCart(enrichedItem ?? current);
                          }
                        }}
                        disabled={inCart}
                        className={`${BTN_BASE} ${inCart ? BTN_PRIMARY_IN_CART : BTN_PRIMARY} whitespace-nowrap`}
                      >
                        <span>
                          {inCart ? "Dans le panier ✓" : "Ajouter au panier"}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
