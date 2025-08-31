// src/app/api/auth/login/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { signAdminJWT, isProd, AUTH_COOKIE_NAME } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

type Entry = { count: number; first: number };
const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 5;
const BCRYPT_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

declare global {
  // eslint-disable-next-line no-var
  var __rpRate: Map<string, Entry> | undefined;
}
const rate: Map<string, Entry> = (globalThis.__rpRate ??= new Map<string, Entry>());

function getClientIP(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return "unknown";
}

function isOriginAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  let allowCsv = process.env.ADMIN_ALLOWED_ORIGINS?.trim();
  if (!allowCsv || allowCsv.length === 0) {
    allowCsv = isProd()
      ? (process.env.NEXT_PUBLIC_SITE_URL ?? "")
      : "http://localhost:3000,http://127.0.0.1:3000";
  }
  try {
    const o = new URL(origin);
    const allow = allowCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => new URL(s));
    return allow.some((a) => a.host === o.host && a.protocol === o.protocol);
  } catch {
    return false;
  }
}

function ensureEntry(ip: string, now: number): Entry {
  const current = rate.get(ip);
  if (!current) {
    const fresh: Entry = { count: 0, first: now };
    rate.set(ip, fresh);
    return fresh;
  }
  if (now - current.first >= WINDOW_MS) {
    const reset: Entry = { count: 0, first: now };
    rate.set(ip, reset);
    return reset;
  }
  return current;
}

function recordFail(ip: string, now: number): NextResponse {
  const base = ensureEntry(ip, now);
  const updated: Entry = { count: base.count + 1, first: base.first };
  rate.set(ip, updated);
  if (now - updated.first < WINDOW_MS && updated.count >= LIMIT) {
    return NextResponse.json({ error: "Trop de tentatives. Réessaie plus tard." }, { status: 429 });
  }
  return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
}

// --- Helpers ENV sûrs
function cleanEnv(val: string | undefined): string {
  if (!val) return "";
  return val.replace(/^\s*['"]?/, "").replace(/['"]?\s*$/, "").replace(/\r?\n/g, "").trim();
}

/** Récupère le hash depuis ENV : priorité à ADMIN_PASSWORD_HASH_B64 (Base64), sinon ADMIN_PASSWORD_HASH (brut) */
function getHashFromEnv(): { hash: string; source: "b64" | "raw" } {
  const rawB64 = cleanEnv(process.env.ADMIN_PASSWORD_HASH);
  if (rawB64) {
    try {
      const decoded = Buffer.from(rawB64, "base64").toString("utf8");
      if (BCRYPT_RE.test(decoded)) {
        console.warn("[auth] Using bcrypt hash from B64");
        return { hash: decoded, source: "b64" };
      } else {
        console.error("[auth] ADMIN_PASSWORD_HASH décodé mais format invalide.");
      }
    } catch {
      console.error("[auth] ADMIN_PASSWORD_HASH invalide (Base64).");
    }
  }
  const raw = cleanEnv(process.env.ADMIN_PASSWORD_HASH);
  if (raw && BCRYPT_RE.test(raw)) {
    console.warn("[auth] Using bcrypt hash from RAW");
    return { hash: raw, source: "raw" };
  }
  return { hash: "", source: "raw" };
}

export async function POST(req: NextRequest) {
  if (!isOriginAllowed(req)) {
    return NextResponse.json({ error: "Origin refusée" }, { status: 403 });
  }

  const ip = getClientIP(req);
  const now = Date.now();
  ensureEntry(ip, now);

  const raw = await req.json().catch(() => ({} as Record<string, unknown>));
  const usernameInput = typeof raw.username === "string" ? raw.username.trim() : "";
  const passwordInput = typeof raw.password === "string" ? raw.password : "";

  if (!usernameInput || !passwordInput) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  const cfgUser = cleanEnv(process.env.ADMIN_USERNAME);
  const { hash: cfgHash } = getHashFromEnv();

  if (!cfgUser || !cfgHash) {
    console.error("[auth] ENV manquantes ou hash invalide.");
    return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
  }

  // Username insensible à la casse
  if (usernameInput.toLowerCase() !== cfgUser.toLowerCase()) {
    console.warn(`[auth] Username mismatch: got="${usernameInput}" expected="${cfgUser}"`);
    return recordFail(ip, now);
  }

  console.warn("[auth] bcrypt.compare", {
    inputLen: passwordInput.length,
    hashPrefix: cfgHash.slice(0, 7),
  });

  const passOk = await bcrypt.compare(passwordInput, cfgHash);
  if (!passOk) {
    return recordFail(ip, now);
  }

  rate.set(ip, { count: 0, first: now });

  const token = await signAdminJWT({ sub: cfgUser, role: "admin" });
  const res = NextResponse.json({ success: true }, { status: 200 });

  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
