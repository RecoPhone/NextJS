"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import {
  Home,
  FileText,
  CreditCard,
  Boxes,
  FileUp,
  Menu,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/administrateur", label: "Dashboard", icon: Home },
  { href: "/administrateur/devis", label: "Devis", icon: FileText },
  { href: "/administrateur/stripe", label: "Stripe", icon: CreditCard },
  { href: "/administrateur/stocks", label: "Stocks", icon: Boxes },
  { href: "/administrateur/documents", label: "Documents", icon: FileUp },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/administrateur" && pathname.startsWith(href));

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/administrateur/login");
  };

  return (
    <div className="min-h-screen bg-[#edfbe2] text-[#222222]">
      {/* Topbar (mobile) */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            className="p-2 rounded-xl border hover:bg-gray-50"
            onClick={() => setOpen((s) => !s)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/administrateur" className="flex items-center gap-2">
            <Image
              src="/images/contents/icone_recophone.png"
              alt="RecoPhone"
              width={28}
              height={28}
              className="rounded"
            />
            <span className="font-semibold">Admin RecoPhone</span>
          </Link>

          <button
            onClick={logout}
            className="p-2 rounded-xl border hover:bg-gray-50"
            aria-label="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer mobile */}
        {open && (
          <nav className="border-t bg-white">
            <ul className="px-2 py-2">
              {NAV.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 ${
                      isActive(href) ? "bg-[#edfbe2] border border-[#54b435]/30" : ""
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block col-span-3 xl:col-span-2">
            <div className="sticky top-6">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/images/contents/icone_recophone.png"
                  alt="RecoPhone"
                  width={40}
                  height={40}
                  className="rounded"
                />
                <div>
                  <p className="text-sm text-gray-500">Espace administrateur</p>
                  <p className="font-semibold">RecoPhone</p>
                </div>
              </div>

              <nav className="space-y-1">
                {NAV.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition
                      ${isActive(href)
                        ? "bg-white border border-[#54b435]/30 shadow-sm"
                        : "hover:bg-white/70"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>

              <button
                onClick={logout}
                className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border hover:bg-white"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </aside>

          {/* Main */}
          <main className="col-span-12 lg:col-span-9 xl:col-span-10">
            <div className="bg-white rounded-2xl shadow p-5 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
