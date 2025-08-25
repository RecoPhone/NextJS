import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Any = Record<string, any>;

const BASE_URL = process.env.FONEDAY_BASE_URL ?? "https://foneday.shop/api/v1";
const TOKEN = (process.env.FONEDAY_TOKEN ?? "").trim();

/* ---------- utils ---------- */
function normalizeStr(s = ""): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function pick<T = any>(p: Any, keys: string[], fallback?: T): T {
  for (const k of keys) if (p?.[k] != null) return p[k] as T;
  return fallback as T;
}
function toAbsImage(u: string): string {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("//")) return "https:" + u;
  if (u.startsWith("/")) return "https://foneday.shop" + u;
  return u;
}

/* ---------- cache ---------- */
const POS = new Map<string, { url: string; ts: number }>(); // key = sku|tag
const NEG = new Map<string, number>();                      // key = sku|tag
const TTL_POS = 60 * 60 * 1000; // 60 min
const TTL_NEG = 10 * 60 * 1000; // 10 min
const now = () => Date.now();

function getPos(key: string) {
  const v = POS.get(key); if (!v) return null;
  if (now() - v.ts > TTL_POS) { POS.delete(key); return null; }
  return v.url;
}
function setPos(key: string, url: string) { POS.set(key, { url, ts: now() }); }
function hasFreshNeg(key: string) {
  const ts = NEG.get(key); if (!ts) return false;
  if (now() - ts > TTL_NEG) { NEG.delete(key); return false; }
  return true;
}
function setNeg(key: string) { NEG.set(key, now()); }

/* ---------- API-first lookup ---------- */
async function apiGet(path: string) {
  const res = await fetch(path, {
    headers: { Accept: "application/json", Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  try { return (await res.json()) as Any; } catch { return null; }
}

function extractImageFromProduct(p: Any): string {
  const direct = toAbsImage(String(pick<string>(p, ["image_url", "image", "thumbnail", "photo"], "") ?? ""));
  if (direct) return direct;

  const imgs = p?.images;
  if (Array.isArray(imgs)) {
    // string ou {url/src}
    const first = imgs.find((x: any) => typeof x === "string" ? x : (x?.url || x?.src));
    const u = typeof first === "string" ? first : (first?.url || first?.src || "");
    if (u) return toAbsImage(String(u));
  }
  return "";
}

async function resolveFromApi(sku: string, ean?: string, title?: string): Promise<string | null> {
  const tries: string[] = [
    `${BASE_URL}/products/${encodeURIComponent(sku)}`,
    `${BASE_URL}/products?sku=${encodeURIComponent(sku)}`,
  ];
  if (ean) {
    tries.push(`${BASE_URL}/products?ean=${encodeURIComponent(ean)}`);
  }
  if (title) {
    // certaines API acceptent ?search= ou ?q=
    const q = encodeURIComponent(title);
    tries.push(`${BASE_URL}/products?search=${q}`, `${BASE_URL}/products?q=${q}`);
  }

  for (const url of tries) {
    const payload = await apiGet(url);
    if (!payload) continue;

    const arr: Any[] = Array.isArray(payload)
      ? payload
      : (payload.product ? [payload.product] : (payload.products ?? payload.data ?? payload.items ?? []));

    if (!Array.isArray(arr) || arr.length === 0) continue;

    // choisir le meilleur match
    const bySku = arr.find(p => String(p?.sku ?? "").toLowerCase() === sku.toLowerCase());
    const p = bySku ?? arr[0];

    const img = extractImageFromProduct(p);
    if (img) return img;
  }
  return null;
}

/* ---------- STRICT HTML fallback (si l’API n’a pas d’image) ---------- */
async function fetchHTML(url: string, ms = 2600) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const res = await fetch(url, { signal: c.signal, cache: "no-store", headers: { Accept: "text/html" } });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; } finally { clearTimeout(t); }
}
function abs(url: string, base: string) { try { return new URL(url, base).toString(); } catch { return url; } }
function titleOk(pageTitle: string, tag: string, brand: string) {
  const t = normalizeStr(pageTitle);
  if (!/novanl/.test(t)) return false;
  if (brand && !t.includes(normalizeStr(brand))) return false;
  switch (tag) {
    case "glass":   return /glass|protector|tempered|screen\s*protector/.test(t);
    case "case":    return /\bcase\b|cover|coque|housse/.test(t);
    case "cable":   return /cable|lightning|type[-\s]?c|usb/.test(t);
    case "charger": return /charger|power\s*adapter|magsafe|wireless/.test(t);
    default:        return true;
  }
}
function isBad(u: string) {
  const s = u.toLowerCase();
  return s.includes("/images/flags/") || /logo|icon|sprite|placeholder|dummy|blank/.test(s) ||
         /\/fdx\b|fdx-/.test(s) || /display|screen[-_ ]?replacement|incell|in-cell/.test(s);
}
function extractFromHTML(html: string, pageUrl: string, tag: string): string | null {
  const og = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];
  const ogAbs = og ? abs(og, pageUrl) : "";
  const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)]
    .map(m => abs(m[1], pageUrl))
    .filter(u => /\.(png|jpe?g|webp|avif)(\?|$)/i.test(u))
    .filter(u => !isBad(u));

  const score = (u: string) => {
    const s = u.toLowerCase();
    if (tag === "glass"   && /(glass|protector|tempered)/.test(s)) return 3;
    if (tag === "case"    && /(case|cover|coque|housse)/.test(s)) return 3;
    if (tag === "cable"   && /(cable|typec|type-c|lightning|usb)/.test(s)) return 3;
    if (tag === "charger" && /(charger|power|magsafe|wireless)/.test(s)) return 3;
    let sc = 0;
    if (/product|catalog|upload|storage|novanl/i.test(s)) sc += 2;
    if (/\/(xl|large|big|original)\b/i.test(s)) sc += 1;
    if (u.length > 60) sc += 1;
    return sc;
  };

  const candidates = (ogAbs && !isBad(ogAbs)) ? [ogAbs, ...imgs] : imgs;
  candidates.sort((a, b) => score(b) - score(a));
  return candidates[0] ?? null;
}

/* ---------- handler ---------- */
export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;
    const sku   = (sp.get("sku")   ?? "").trim();
    const title = (sp.get("title") ?? "").trim();
    const ean   = (sp.get("ean")   ?? "").trim();
    const tag   = (sp.get("tag")   ?? "").trim();   // glass|case|cable|charger
    const brand = (sp.get("brand") ?? "").trim();   // Apple|Samsung|Xiaomi

    if (!sku || !title) return NextResponse.json({ error: "Missing sku/title" }, { status: 400 });

    const key = `${sku}|${tag || "na"}`;
    const hit = getPos(key);
    if (hit) return NextResponse.json({ image: hit, cached: 1 });
    if (hasFreshNeg(key)) return NextResponse.json({ image: null, cached: 1 }, { status: 404 });

    // 1) API FoneDay d'abord
    const apiImg = await resolveFromApi(sku, ean || undefined, title);
    if (apiImg) { setPos(key, apiImg); return NextResponse.json({ image: apiImg, source: "api" }); }

    // 2) Fallback HTML (strict)
    const slugBase = normalizeStr(title).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const variants = Array.from(new Set([
      `novanl-${slugBase}`,
      slugBase,
    ]));

    const roots = [
      "https://foneday.shop/article",
      "https://foneday.shop/en/article",
      "https://foneday.shop/fr/article",
    ];

    for (const v of variants) {
      for (const root of roots) {
        const url = `${root}/${v}`;
        const html = await fetchHTML(url, 2600);
        if (!html) continue;

        const pageTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1]
                       || html.match(/<title>([^<]+)<\/title>/i)?.[1]
                       || "";
        if (!titleOk(pageTitle || "", tag, brand)) continue;

        const img = extractFromHTML(html, url, tag);
        if (img) { setPos(key, img); return NextResponse.json({ image: img, source: "html", from: url }); }
      }
    }

    setNeg(key);
    return NextResponse.json({ image: null }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: "Unhandled error", message: e?.message ?? String(e) }, { status: 500 });
  }
}
