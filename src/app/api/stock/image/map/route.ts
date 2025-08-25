import { NextRequest, NextResponse } from "next/server";
import { imageGetMany, imageSet, imageDel } from "@/lib/imageStore";

export const dynamic = "force-dynamic";

/* ---------- Utils ---------- */
function normalizeStr(s = ""): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function isValidSku(s: string) {
  return /^[A-Za-z0-9._\-]+$/.test(s);
}
function isValidUrl(u: string) {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
function abs(url: string, base: string) {
  try { return new URL(url, base).toString(); } catch { return url; }
}
async function fetchHTML(url: string, ms = 3000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const res = await fetch(url, { signal: c.signal, cache: "no-store", headers: { Accept: "text/html" } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function titleMatches(pageTitle: string, tag?: string, brand?: string) {
  const t = normalizeStr(pageTitle);
  if (!/novanl/.test(t)) return false;
  if (brand && !t.includes(normalizeStr(brand))) return false;
  const need = (re: RegExp) => re.test(t);
  switch (tag) {
    case "glass":   return need(/glass|protector|tempered|screen\s*protector/);
    case "case":    return need(/\bcase\b|cover|coque|housse/);
    case "cable":   return need(/cable|lightning|type[-\s]?c|usb/);
    case "charger": return need(/charger|power\s*adapter|magsafe|wireless/);
    default:        return true;
  }
}
function isBadImage(u: string) {
  const s = u.toLowerCase();
  return s.includes("/images/flags/")
      || /logo|icon|sprite|placeholder|dummy|blank/.test(s)
      || /\/fdx\b|fdx-/.test(s)                     // marque d'écrans
      || /display|screen[-_ ]?replacement|incell|in-cell/.test(s);
}
function scoreImage(u: string, tag?: string) {
  const s = u.toLowerCase();
  let sc = 0;
  if (/\/media\/products\//.test(s)) sc += 3;     // chemin “bon”
  if (/--large\.(jpg|jpeg|png|webp|avif)\b/.test(s)) sc += 2; // grande taille
  if (/conversions/.test(s)) sc += 1;
  if (tag === "glass"   && /(glass|protector|tempered)/.test(s)) sc += 2;
  if (tag === "case"    && /(case|cover|coque|housse)/.test(s))  sc += 2;
  if (tag === "cable"   && /(cable|typec|type-c|lightning|usb)/.test(s)) sc += 2;
  if (tag === "charger" && /(charger|power|magsafe|wireless)/.test(s))   sc += 2;
  if (u.length > 60) sc += 1;
  return sc;
}
function makeSlug(title: string) {
  // Nettoie, gère les "+" → plus, supprime le bruit
  let t = " " + title + " ";
  t = t.replace(/(\b[a-z]\d{1,2}\d*\b)\s*\+/gi, "$1 plus"); // S23+ -> S23 plus
  t = t.replace(/\+/g, " plus ");
  let n = normalizeStr(t).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  n = n
    .replace(/-?\b(incl|magnetics|case|friendly|with|for|compatible)\b-?/g, "-")
    .replace(/-(black|white|clear|transparent|blue|red|green|pink|purple|gold|silver|gray|grey|noir|blanc|transparent)$/i, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return n;
}

/* ---------- Autofill: résout via la fiche publique ---------- */
async function resolveOneViaHTML(hint: { sku: string; title: string; brand?: string; tag?: string }) {
  const slug = makeSlug(hint.title);
  const variants = Array.from(new Set([`novanl-${slug}`, slug]));
  const roots = [
    "https://foneday.shop/article",
    "https://foneday.shop/en/article",
    "https://foneday.shop/fr/article",
  ];

  for (const v of variants) {
    for (const root of roots) {
      const url = `${root}/${v}`;
      const html = await fetchHTML(url, 3000);
      if (!html) continue;

      const pageTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1]
        || html.match(/<title>([^<]+)<\/title>/i)?.[1]
        || "";

      if (!titleMatches(pageTitle || "", hint.tag, hint.brand)) continue;

      // 1) JSON-LD (souvent la meilleure source)
      const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const m of ldMatches) {
        try {
          const json = JSON.parse(m[1].trim());
          const imgs: string[] = [];
          const push = (x: any) => {
            if (!x) return;
            if (Array.isArray(x)) x.forEach(push);
            else if (typeof x === "string") imgs.push(x);
          };
          if (json?.image) push(json.image);
          if (json?.["@graph"]) {
            for (const node of json["@graph"]) {
              if (node?.image) push(node.image);
            }
          }
          const candidates = imgs
            .map((u) => abs(u, url))
            .filter((u) => /\.(png|jpe?g|webp|avif)(\?|$)/i.test(u))
            .filter((u) => !isBadImage(u))
            .sort((a, b) => scoreImage(b, hint.tag) - scoreImage(a, hint.tag));
          if (candidates[0]) return candidates[0];
        } catch { /* ignore JSON parse */ }
      }

      // 2) og:image
      const og = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];
      const ogAbs = og ? abs(og, url) : "";
      if (ogAbs && !isBadImage(ogAbs)) return ogAbs;

      // 3) <img> tags
      const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)]
        .map((m) => abs(m[1], url))
        .filter((u) => /\.(png|jpe?g|webp|avif)(\?|$)/i.test(u))
        .filter((u) => !isBadImage(u))
        .sort((a, b) => scoreImage(b, hint.tag) - scoreImage(a, hint.tag));
      if (imgs[0]) return imgs[0];
    }
  }
  return null;
}

/* ---------- Handlers ---------- */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const skusParam = url.searchParams.get("skus") || "";
  const skus = skusParam.split(",").map((s) => s.trim()).filter(Boolean);
  const bad = skus.find((s) => !isValidSku(s));
  if (bad) return NextResponse.json({ error: `Invalid SKU: ${bad}` }, { status: 400 });

  const map = await imageGetMany(skus);
  return NextResponse.json({ map });
}

/**
 * POST modes :
 *  - { sku, url }             -> set manuel
 *  - { action: "autofill", hints: [{sku, title, brand?, tag?}, ...] } -> résolution HTML & enregistrement
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));

  // Mode SET manuel
  if (body?.sku && body?.url && !body?.action) {
    const sku = String(body.sku || "").trim();
    const url = String(body.url || "").trim();
    if (!isValidSku(sku)) return NextResponse.json({ error: "Invalid SKU" }, { status: 400 });
    if (!isValidUrl(url)) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    await imageSet(sku, url);
    return NextResponse.json({ ok: true });
  }

  // Mode AUTOFILL
  if (body?.action === "autofill" && Array.isArray(body?.hints)) {
    const hints = body.hints as Array<{ sku: string; title: string; brand?: string; tag?: string }>;
    const out: Record<string, string> = {};
    for (const h of hints) {
      const sku = (h?.sku || "").trim();
      const title = (h?.title || "").trim();
      if (!isValidSku(sku) || !title) continue;

      // déjà en cache ?
      const existing = await imageGetMany([sku]);
      if (existing[sku]) { out[sku] = existing[sku]; continue; }

      // essaie de résoudre via la page produit
      const found = await resolveOneViaHTML({ sku, title, brand: h.brand, tag: h.tag });
      if (found) {
        await imageSet(sku, found);
        out[sku] = found;
      }
    }
    return NextResponse.json({ map: out });
  }

  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sku = String(body?.sku || "").trim();
  if (!isValidSku(sku)) return NextResponse.json({ error: "Invalid SKU" }, { status: 400 });

  await imageDel(sku);
  return NextResponse.json({ ok: true });
}
