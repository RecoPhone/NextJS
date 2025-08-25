"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart } from "lucide-react";

export default function CartButton({ className = "" }: { className?: string }) {
  const { count } = useCart();

  return (
    <Link
      href="/panier"
      aria-label="Ouvrir le panier"
      className={`relative inline-flex items-center gap-2 rounded-2xl border border-[#54b435]/20 bg-white/60 px-3 py-2 text-sm font-medium text-[#222] shadow-sm backdrop-blur transition hover:border-[#54b435]/40 hover:shadow ${className}`}
    >
      <ShoppingCart size={18} />
      <span>Panier</span>
      <span
        aria-live="polite"
        className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#54b435] px-1.5 text-xs font-semibold text-white"
      >
        {count}
      </span>
    </Link>
  );
}
