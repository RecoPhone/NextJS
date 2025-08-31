"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const navItems = [
  { label: "Accueil", href: "/" },
  { label: "Abonnements", href: "/abonnements" },
  { label: "[RE]Smartphones", href: "/re-smartphones" },
  { label: "Histoire", href: "/histoire" },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

// CartButton chargé en dynamique pour éviter les mismatchs SSR/hydratation
const CartButton = dynamic(() => import("../../components/cart/CartButton"), { ssr: false });

export default function Navbar() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#54b435]/15 bg-[#edfbe2]/80 backdrop-blur supports-[backdrop-filter]:bg-[#edfbe2]/60">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 rounded bg-white px-3 py-2 text-sm font-semibold text-[#222] shadow"
      >
        Aller au contenu
      </a>

      <nav aria-label="Navigation principale">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3">
            {/* Gauche: zone promo réservée */}
            <div className="hidden h-9 md:block" aria-hidden="true" />

            {/* Centre */}
            <div className="justify-self-center">
              <ul className="hidden items-center gap-6 md:flex">
                {navItems.map((item) => {
                  const active = isActive(item.href, pathname);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "px-1 py-2 text-sm font-semibold tracking-wide transition motion-reduce:transition-none",
                          active
                            ? "text-[#54b435] underline underline-offset-8 decoration-2 decoration-[#54b435]"
                            : "text-[#222] hover:text-[#54b435]",
                        ].join(" ")}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Mobile: burger */}
              <button
                className="inline-flex items-center rounded-xl border border-[#54b435]/30 px-3 py-2 text-sm font-medium text-[#222] hover:bg-white/70 transition motion-reduce:transition-none md:hidden"
                aria-expanded={open}
                aria-controls="mobile-menu"
                onClick={() => setOpen((v) => !v)}
              >
                Menu
              </button>
            </div>

            {/* Droite: actions (desktop) */}
            <div className="justify-self-end">
              <div className="hidden items-center gap-2 md:flex">
                {/* Bouton Panier avec badge quantité */}
                <CartButton />

                {/* CTA Devis */}
                <Link
                  href="/devis"
                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-[#54b435] px-4 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54b435] motion-reduce:transition-none"
                >
                  Devis gratuit
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile menu (overlay) */}
          <div
            id="mobile-menu"
            className={["fixed inset-0 z-40 md:hidden", open ? "pointer-events-auto" : "pointer-events-none"].join(" ")}
            aria-hidden={!open}
          >
            <div
              className={[
                "absolute inset-0 bg-black/20 transition-opacity",
                open ? "opacity-100" : "opacity-0",
                "motion-reduce:transition-none",
              ].join(" ")}
              onClick={() => setOpen(false)}
            />
            <div
              className={[
                "absolute left-0 right-0 top-0 rounded-b-2xl border-b border-[#54b435]/15 bg-white shadow",
                "transition-transform duration-300 ease-out",
                open ? "translate-y-0" : "-translate-y-full",
                "motion-reduce:transition-none motion-reduce:transform-none",
              ].join(" ")}
            >
              <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#222]">Menu</span>
                  <button
                    className="rounded-xl border border-[#54b435]/30 px-3 py-2 text-sm font-medium text-[#222] transition hover:bg-[#edfbe2]"
                    onClick={() => setOpen(false)}
                  >
                    Fermer
                  </button>
                </div>

                <ul className="mt-4 space-y-1">
                  {navItems.map((item) => {
                    const active = isActive(item.href, pathname);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={[
                            "block rounded-xl px-3 py-3 text-base font-semibold transition",
                            active ? "bg-[#edfbe2] text-[#54b435]" : "text-[#222] hover:bg-[#edfbe2]",
                          ].join(" ")}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* Accès rapide Panier (mobile) */}
                <div className="mt-4">
                  <Link
                    href="/panier"
                    onClick={() => setOpen(false)}
                    className="inline-flex w-full items-center justify-between rounded-2xl border border-[#54b435]/20 bg-white px-4 py-3 font-semibold text-[#222] hover:bg-[#edfbe2]"
                  >
                    <span>Voir le panier</span>
                    {/* tu veux un badge quantité ici ? je peux l’ajouter ensuite */}
                  </Link>
                </div>

                {/* CTA mobile */}
                <div className="mt-3">
                  <Link
                    href="/devis"
                    onClick={() => setOpen(false)}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#54b435] px-4 py-3 font-semibold text-white shadow transition hover:opacity-90"
                  >
                    Devis gratuit
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* /Mobile menu */}
        </div>
      </nav>
    </header>
  );
}
