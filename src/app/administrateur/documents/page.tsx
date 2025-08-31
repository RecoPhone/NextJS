"use client";

import { useEffect, useMemo, useState } from "react";

type ClientSummary = {
  client: string;
  relPath: string;
  fileCount: number;
  totalSize: number;
  lastModifiedMs: number | null;
};
type FileItem = { name: string; relPath: string; size: number; mtimeMs: number };

function fmtDate(ms: number | null) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString();
}

// parse JSON en sécurité (si HTML -> message clair)
async function safeJson(resp: Response) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    const snippet = text.slice(0, 250);
    throw new Error(
      `Réponse non-JSON (${resp.status}) : ${
        snippet.includes("<!DOCTYPE") ? "Le serveur a renvoyé une page HTML (erreur probable)." : snippet
      }`
    );
  }
}

export default function DocumentsPage() {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<ClientSummary | null>(null);
  const [files, setFiles] = useState<FileItem[] | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errorClients, setErrorClients] = useState<string | null>(null);
  const [errorFiles, setErrorFiles] = useState<string | null>(null);

  // fetch clients
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrorClients(null);
    fetch("/api/admin/storage/clients", { credentials: "include" })
      .then(safeJson)
      .then((j) => {
        if (!mounted) return;
        if (j?.ok) setClients((j.data as ClientSummary[]).filter((c) => !c.client.startsWith(".")));
        else setErrorClients(j?.error ?? "Erreur inconnue");
      })
      .catch((e) => mounted && setErrorClients(String(e)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // filtered clients
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clients;
    return clients.filter((c) => c.client.toLowerCase().includes(t));
  }, [q, clients]);

  // fetch files for selected
  useEffect(() => {
    if (!selected) return;
    setFiles(null);
    setErrorFiles(null);
    setLoadingFiles(true);

    const url = `/api/admin/storage/files?client=${encodeURIComponent(selected.relPath)}`;
    fetch(url, { credentials: "include" })
      .then(safeJson)
      .then((j) => {
        if (j?.ok) setFiles((j.data as FileItem[]).filter((f) => !f.name.startsWith(".")));
        else setErrorFiles(j?.error ?? "Erreur inconnue");
      })
      .catch((e) => setErrorFiles(String(e)))
      .finally(() => setLoadingFiles(false));
  }, [selected]);

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents (devis & contrats)</h1>
          <p className="text-sm text-gray-500">Accès direct aux dossiers clients et à leurs PDF.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un dossier client…"
            className="w-80 max-w-full rounded-xl border px-3 py-2 bg-white/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]"
          />
        </div>
      </header>

      {/* Bloc clients */}
      <div className="rounded-2xl border bg-white/70 backdrop-blur-sm overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gradient-to-r from-[#e8f9de] to-[#f4fff0] text-sm text-gray-700 flex items-center justify-between">
          <span>Dossiers clients ({filtered.length})</span>
          <span className="text-xs text-gray-500">Triés par dernière activité</span>
        </div>

        {errorClients ? (
          <div className="p-4 text-sm text-red-600">{errorClients}</div>
        ) : loading ? (
          <div className="p-4 text-sm text-gray-600">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">Aucun dossier trouvé.</div>
        ) : (
          <ul className="divide-y">
            {filtered.map((c) => {
              const active = selected?.relPath === c.relPath;
              return (
                <li key={c.relPath}>
                  <button
                    onClick={() => setSelected(c)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition ${
                      active ? "bg-white" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* dossier icône */}
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f9de]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-[#54b435]"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M10 4h-4c-1.103 0-2 .897-2 2v2h9.586l2 2H20V8a2 2 0 0 0-2-2h-6l-2-2z" />
                          <path d="M2 20V8h9.586l2 2H22v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
                        </svg>
                      </span>
                      <div>
                        <div className="font-medium">{c.client}</div>
                        <div className="text-xs text-gray-500">
                          {c.fileCount} fichier(s) • Dernière modif: {fmtDate(c.lastModifiedMs)}
                        </div>
                      </div>
                    </div>
                    {/* badge */}
                    <span className="text-[11px] px-2 py-1 rounded-full border bg-white">
                      {c.relPath}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Bloc fichiers du client sélectionné */}
      {selected && (
        <div className="rounded-2xl border bg-white/70 backdrop-blur-sm overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-gradient-to-r from-[#e8f9de] to-[#f4fff0] text-sm text-gray-700">
            Fichiers de <strong>{selected.client}</strong>
          </div>

          {errorFiles ? (
            <div className="p-4 text-sm text-red-600">{errorFiles}</div>
          ) : loadingFiles ? (
            <div className="p-4 text-sm text-gray-600">Chargement…</div>
          ) : !files || files.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">Aucun fichier.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left font-medium px-4 py-2">Fichier</th>
                    <th className="text-left font-medium px-4 py-2">Modifié</th>
                    <th className="text-left font-medium px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {files.map((f) => {
                    const openUrl = `/api/admin/storage/download?path=${encodeURIComponent(f.relPath)}&download=0`;
                    return (
                      <tr key={f.relPath} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <a
                            href={openUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 hover:underline text-[#204a24]"
                          >
                            {/* icône PDF */}
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[#204a24]/10">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="h-4 w-4"
                                fill="currentColor"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6" />
                              </svg>
                            </span>
                            <span className="font-medium">{f.name}</span>
                          </a>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{fmtDate(f.mtimeMs)}</td>
                        <td className="px-4 py-2">
                          <a
                            href={openUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-lg border px-2 py-1 hover:bg-white shadow-sm"
                          >
                            Ouvrir
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
