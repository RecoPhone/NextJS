// src/app/administrateur/login/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.replace("/administrateur");
      } else {
        const data = await res.json().catch(() => ({}));
        setErr(data?.error ?? "Identifiants invalides.");
      }
    } catch {
      setErr("Erreur réseau. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#edfbe2] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="/images/contents/logo_recophone.png" 
            alt="RecoPhone"
            width={72}
            height={72}
            className="rounded-lg"
            priority
          />
          <h1 className="text-2xl font-semibold text-[#222222]">
            Accès administrateur
          </h1>
          <p className="text-sm text-gray-500 text-center">
            Espace privé – RecoPhone
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Identifiant</label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#54b435]"
              placeholder="ben"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <div className="mt-1 relative">
              <input
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#54b435]"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute inset-y-0 right-0 px-3 text-sm text-gray-500 hover:text-gray-700"
                aria-label={showPwd ? "Masquer" : "Afficher"}
              >
                {showPwd ? "Masquer" : "Afficher"}
              </button>
            </div>
          </div>

          {err && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#54b435] text-white font-semibold py-2.5 shadow hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <p className="text-xs text-center text-gray-500 mt-2">
            Accès réservé. Tentatives limitées.
          </p>
        </form>
      </div>
    </main>
  );
}
