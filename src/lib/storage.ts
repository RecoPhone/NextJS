// src/lib/storage.ts
import path from "path";
import { promises as fs } from "fs";
import { Client, type AccessOptions, type FileInfo } from "basic-ftp";
import { Writable } from "stream";

/** ---------- Types partagés ---------- */
export type FileItem = {
  name: string;
  relPath: string;
  size: number;
  mtimeMs: number;
};
export type ClientSummary = {
  client: string;
  relPath: string;
  fileCount: number;
  totalSize: number;
  lastModifiedMs: number | null;
};

/** ---------- Config ---------- */
const MODE = (process.env.RECO_STORAGE_MODE ?? "local").toLowerCase(); // "local" | "ftp"
const ROOT = process.env.RECO_STORAGE_DIR ? path.resolve(process.env.RECO_STORAGE_DIR) : "";

/** ---------- Helpers génériques ---------- */
function assertRoot() {
  if (!ROOT) throw new Error("RECO_STORAGE_DIR manquant");
  return ROOT;
}
function safeRel(rel = "") {
  return rel.replace(/^[\\/]+/, "").replace(/\.\.(\/|\\|$)/g, "");
}
function ensureInsideRoot(absPath: string, root: string) {
  const normRoot = root.endsWith(path.sep) ? root : root + path.sep;
  if (!(absPath === root || absPath.startsWith(normRoot))) {
    throw new Error("Chemin hors racine");
  }
}
function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  return ab;
}
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** ---------- LOCAL ---------- */
async function listClientsLocal(): Promise<ClientSummary[]> {
  const root = assertRoot();
  const ents = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  const dirs = ents.filter((e) => e.isDirectory() && !e.name.startsWith(".")); // masque .*
  const out: ClientSummary[] = [];

  for (const d of dirs) {
    const dirAbs = path.join(root, d.name);
    const stack = [dirAbs];
    const files: FileItem[] = [];

    while (stack.length) {
      const cur = stack.pop()!;
      const items = await fs.readdir(cur, { withFileTypes: true }).catch(() => []);
      for (const it of items) {
        if (it.name.startsWith(".")) continue; // masque .*
        const abs = path.join(cur, it.name);
        if (it.isDirectory()) {
          stack.push(abs);
        } else if (it.isFile()) {
          const st = await fs.stat(abs).catch(() => null);
          if (st) {
            files.push({
              name: it.name,
              relPath: path.relative(root, abs),
              size: st.size,
              mtimeMs: st.mtimeMs,
            });
          }
        }
      }
    }

    const totalSize = files.reduce((a, f) => a + f.size, 0);
    const lastModifiedMs = files.length ? Math.max(...files.map((f) => f.mtimeMs)) : null;
    out.push({
      client: d.name,
      relPath: path.relative(root, dirAbs),
      fileCount: files.length,
      totalSize,
      lastModifiedMs,
    });
  }

  out.sort((a, b) => (b.lastModifiedMs ?? 0) - (a.lastModifiedMs ?? 0));
  return out;
}

async function listFilesUnderLocal(relClientDir: string): Promise<FileItem[]> {
  const root = assertRoot();
  const safe = safeRel(relClientDir);
  const abs = path.resolve(root, safe);
  ensureInsideRoot(abs, root);

  const st = await fs.stat(abs);
  if (!st.isDirectory()) throw new Error("Pas un dossier client");

  const files: FileItem[] = [];
  const stack = [abs];

  while (stack.length) {
    const cur = stack.pop()!;
    const items = await fs.readdir(cur, { withFileTypes: true }).catch(() => []);
    for (const it of items) {
      if (it.name.startsWith(".")) continue; // masque .*
      const abs2 = path.join(cur, it.name);
      if (it.isDirectory()) {
        stack.push(abs2);
      } else if (it.isFile()) {
        const st2 = await fs.stat(abs2).catch(() => null);
        if (st2) {
          files.push({
            name: it.name,
            relPath: path.relative(root, abs2),
            size: st2.size,
            mtimeMs: st2.mtimeMs,
          });
        }
      }
    }
  }

  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return files;
}

async function readFileLocal(relPath: string): Promise<ArrayBuffer> {
  const root = assertRoot();
  const safe = safeRel(relPath);
  const abs = path.resolve(root, safe);
  ensureInsideRoot(abs, root);

  const buf = await fs.readFile(abs);
  return bufferToArrayBuffer(buf);
}

/** ---------- FTP/FTPS ---------- */
function ftpJoin(base: string, rel: string) {
  const s = safeRel(rel);
  return (base.replace(/\/+$/, "") + "/" + s.replace(/^\/+/, "")).replace(/\/+/g, "/");
}

// Décide dossier/fichier par un essai réel de `cd` (fiable quel que soit 'type')
async function ftpIsDirPath(c: Client, p: string): Promise<boolean> {
  const back = await c.pwd().catch(() => "/");
  try {
    await c.cd(p);
    await c.cd(back);
    return true;
  } catch {
    return false;
  }
}

async function withFtp<T>(fn: (c: Client, base: string) => Promise<T>): Promise<T> {
  const host = process.env.FTP_HOST ?? "";
  const port = Number(process.env.FTP_PORT ?? 21);
  const user = process.env.FTP_USER ?? "";
  const password = process.env.FTP_PASS ?? "";
  const secure = String(process.env.FTP_SECURE ?? "true").toLowerCase() === "true"; // FTPS recommandé
  const base = process.env.FTP_BASE_DIR ?? "/";

  if (!host || !user || !password) throw new Error("Config FTP incomplète");

  const access: AccessOptions = {
    host,
    port,
    user,
    password,
    secure,
    secureOptions: { rejectUnauthorized: false }, // tolérant en dev
  };

  const c = new Client(30_000);
  c.ftp.verbose = false;

  try {
    await c.access(access);
    return await fn(c, base);
  } finally {
    c.close();
  }
}

async function listClientsFtp(): Promise<ClientSummary[]> {
  return withFtp(async (c, base) => {
    // listing racine avec fallback (certains FTP exigent cd avant list)
    let entries: FileInfo[] = [];
    try {
      await c.cd(base);
      entries = await c.list();
    } catch {
      try {
        entries = await c.list(base);
      } catch {
        entries = [];
      }
    }

    // ne garder que les répertoires réels (test cd), ignorer cachés
    const dirEntries: { name: string; full: string }[] = [];
    for (const e of entries) {
      if (!e.name || e.name.startsWith(".")) continue;
      const full = ftpJoin(base, e.name);
      if (await ftpIsDirPath(c, full)) {
        dirEntries.push({ name: e.name, full });
      }
    }

    const out: ClientSummary[] = [];
    for (const d of dirEntries) {
      const stack = [d.full];
      const files: FileItem[] = [];

      while (stack.length) {
        const cur = stack.pop()!;
        let items: FileInfo[] = [];
        try {
          await c.cd(cur);
          items = await c.list();
        } catch {
          try {
            items = await c.list(cur);
          } catch {
            items = [];
          }
        }

        for (const it of items) {
          if (!it.name || it.name.startsWith(".")) continue; // masque .*
          const p = ftpJoin(cur, it.name);

          if (await ftpIsDirPath(c, p)) {
            stack.push(p);
          } else {
            const rel = p.replace(new RegExp("^" + escapeRegex(base) + "/?"), "");
            const mtimeMs =
              (it as any).modifiedAt instanceof Date
                ? (it as any).modifiedAt.getTime()
                : Date.now();
            files.push({
              name: it.name,
              relPath: rel,
              size: it.size ?? 0,
              mtimeMs,
            });
          }
        }
      }

      const totalSize = files.reduce((a, f) => a + f.size, 0);
      const lastModifiedMs = files.length ? Math.max(...files.map((f) => f.mtimeMs)) : null;

      out.push({
        client: d.name,
        relPath: d.name, // chemin relatif client (par rapport à la base FTP)
        fileCount: files.length,
        totalSize,
        lastModifiedMs,
      });
    }

    out.sort((a, b) => (b.lastModifiedMs ?? 0) - (a.lastModifiedMs ?? 0));
    return out;
  });
}

async function listFilesUnderFtp(relClientDir: string): Promise<FileItem[]> {
  return withFtp(async (c, base) => {
    const root = ftpJoin(base, relClientDir);
    const files: FileItem[] = [];
    const stack = [root];

    while (stack.length) {
      const cur = stack.pop()!;
      let items: FileInfo[] = [];
      try {
        await c.cd(cur);
        items = await c.list();
      } catch {
        try {
          items = await c.list(cur);
        } catch {
          items = [];
        }
      }

      for (const it of items) {
        if (!it.name || it.name.startsWith(".")) continue; // masque .*
        const p = ftpJoin(cur, it.name);

        if (await ftpIsDirPath(c, p)) {
          stack.push(p);
        } else {
          const rel = p.replace(new RegExp("^" + escapeRegex(base) + "/?"), "");
          const mtimeMs =
            (it as any).modifiedAt instanceof Date
              ? (it as any).modifiedAt.getTime()
              : Date.now();
          files.push({
            name: it.name,
            relPath: rel,
            size: it.size ?? 0,
            mtimeMs,
          });
        }
      }
    }

    files.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return files;
  });
}

async function readFileFtp(relPath: string): Promise<ArrayBuffer> {
  return withFtp(async (c, base) => {
    const full = ftpJoin(base, relPath);
    const chunks: Buffer[] = [];
    const sink = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(Buffer.from(chunk));
        cb();
      },
    });
    await c.downloadTo(sink, full);
    const buf = Buffer.concat(chunks);
    return bufferToArrayBuffer(buf);
  });
}

/** ---------- EXPORTS ---------- */
export async function listClients(): Promise<ClientSummary[]> {
  return MODE === "ftp" ? listClientsFtp() : listClientsLocal();
}
export async function listFilesUnder(relClientDir: string): Promise<FileItem[]> {
  return MODE === "ftp" ? listFilesUnderFtp(relClientDir) : listFilesUnderLocal(relClientDir);
}
export async function readFileBinary(relPath: string): Promise<ArrayBuffer> {
  return MODE === "ftp" ? readFileFtp(relPath) : readFileLocal(relPath);
}
