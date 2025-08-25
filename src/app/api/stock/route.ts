import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Any = Record<string, any>;
type Product = Any;

const BASE_URL = process.env.FONEDAY_BASE_URL ?? "https://foneday.shop/api/v1";
const TOKEN = (process.env.FONEDAY_TOKEN ?? "").trim();

/* ---------- Utils ---------- */
function normalizeStr(s = ""): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function pick<T = any>(p: Any, keys: string[], fallback?: T): T {
  for (const k of keys) if (p?.[k] != null) return p[k] as T;
  return fallback as T;
}
function parseBrandModelFromSuitable(s: string) {
  const n = normalizeStr(s).replace(/^for\s+/g, "").trim();
  const parts = n.split(/\s+/);
  const brand = parts[0] ? parts[0] : "";
  const model = parts.slice(1).join(" ");
  return { brand, model };
}
function toBoolStock(v: unknown): number {
  if (typeof v === "string") return v.toUpperCase() === "Y" ? 1 : 0;
  if (typeof v === "number") return v > 0 ? 1 : 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  return 0;
}
function inferDeviceBrand(title: string): string {
  const t = normalizeStr(title);
  if (t.includes("iphone") || t.includes("apple")) return "Apple";
  if (t.includes("samsung") || t.includes("galaxy")) return "Samsung";
  if (t.includes("xiaomi") || t.includes("redmi") || t.includes("poco")) return "Xiaomi";
  return "";
}

function toAbsImage(u: string): string {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("//")) return "https:" + u;
  if (u.startsWith("/")) return "https://foneday.shop" + u;
  return u;
}

/* ---------- Mapping ---------- */
type Tag = "glass" | "case" | "cable" | "charger";
type Mapped = {
  id: string;
  sku: string;
  name: string;
  brand: string;     // Apple / Samsung / Xiaomi
  model: string;
  category: string;
  image: string;
  price?: number;
  stock: number;     // 1 en stock, 0 rupture
  supplierBrand: string; // NovaNL, etc.
  tag?: Tag;
  _raw?: Any;
};

function mapProduct(p: Product): Mapped {
  const title = String(pick<string>(p, ["title", "name", "product_name"], "") ?? "");
  const category = String(pick<string>(p, ["category", "category_name"], "") ?? "");

  const supplierBrand = String(pick<string>(p, ["product_brand", "brand", "brand_name"], "") ?? "");

  let deviceBrand = String(pick<string>(p, ["model_brand"], "") ?? "");
  let model = String(pick<string>(p, ["model", "model_name"], "") ?? "");
  const suitable = String(pick<string>(p, ["suitable_for"], "") ?? "");
  if ((!deviceBrand || !model) && suitable) {
    const parsed = parseBrandModelFromSuitable(suitable);
    if (!deviceBrand) deviceBrand = parsed.brand;
    if (!model) model = parsed.model;
  }
  if (!deviceBrand) deviceBrand = inferDeviceBrand(title);

  const sku = String(pick<string>(p, ["sku", "code", "artcode"], "") ?? "");
  const priceRaw = pick<unknown>(p, ["selling_price", "price", "purchase_price"], null);
  const price =
    typeof priceRaw === "string" ? parseFloat(priceRaw) :
    typeof priceRaw === "number" ? priceRaw : undefined;
  const stock = toBoolStock(pick<unknown>(p, ["instock", "stock", "quantity", "qty"], 0));
  const imageRaw = String(pick<string>(p, ["image_url", "image", "thumbnail", "photo"], "") ?? "");
  const image = toAbsImage(imageRaw);

  const idStr = String(((p.id ?? sku) || title || "novanl-item"));

  return {
    id: idStr,
    sku,
    name: title,
    brand: deviceBrand,
    model,
    category,
    image,
    price,
    stock,
    supplierBrand,
    _raw: p,
  };
}

/* ---------- Filtrage ciblé ---------- */
const WANT_GLASS = [
  "tempered glass","temperedglass","glass protector","glassprotector",
  "screen protector","screenprotector",
  "verre trempe","verre trempé","verre de protection","protege ecran","protection ecran",
  "protector","protector glass","privacy","mat","matte","hydrogel"
];
const WANT_CASE = ["case","coque","housse","etui","cover","backcover","back cover"];
const WANT_CABLE = ["cable","usb","type-c","usbc","lightning","micro-usb","micro usb","data cable"];
const WANT_CHARGER = ["chargeur","charger","wireless charger","chargeur sans fil","magsafe","magnet","power adapter","wall charger","car charger"];

const EXCLUDE_INTERNAL = [
  "lcd","ecran","screen","display","digitizer","touch","tactile",
  "batterie","battery",
  "face arriere","back glass","housing","backdoor",
  "chassis","frame","midframe",
  "dock de charge","charge board","charging board","board",
  "port de charge","charging port","usb board",
  "flex","nappe",
  "camera","caméra","rear camera","front camera","lentille","lens",
  "earpiece","haut-parleur interne","loudspeaker","speaker module",
  "microphone","mic","vibreur","taptic",
  "proximite","proximity","capteur","sensor",
  "sim tray","lecteur sim",
  "carte mere","motherboard","pcb","antenne","nfc",
  "button","bouton","power button","volume button","home button","side key","key",
  "display","battery",
];
const EXCLUDE_TOOLS_CONSOM = [
  "tool","tools","kit outil","kit outils","toolkit",
  "spudger","opening","opener","iopener","spatule",
  "tweezer","tweezers","pince","tournevis","screwdriver","screw","vis",
  "heat gun","chauffe","hot air","laminator","oca","separator","press",
  "ultrasonic","souder","solder","microsolder","flux","resin","uv glue",
  "adhesif cadre","adhesif","adhesive","tape","glue","colle","foam",
  "alcool isopropylique","isopropyl alcohol",
  "machine","fixture","moule","mold"
];
const ALLOWED_DEVICE_BRANDS = ["apple","samsung","xiaomi"] as const;

function looksLikeScreenProtector(s: string): boolean {
  const n = normalizeStr(s).replace(/[^a-z0-9]+/g, " ");
  return (
    /tempered\s*glass/.test(n) ||
    /glass\s*protector/.test(n) ||
    /screen\s*protector/.test(n) ||
    /protector\s*glass/.test(n) ||
    /glassprotector/.test(n) ||
    /screenprotector/.test(n)
  );
}
function tagWanted(name: string, category: string): Tag | null {
  const n = normalizeStr(name);
  const c = normalizeStr(category);
  const has = (arr: string[]) => arr.some(k => n.includes(k) || c.includes(k));
  if (has(WANT_GLASS) || looksLikeScreenProtector(name) || looksLikeScreenProtector(category)) return "glass";
  if (has(WANT_CASE)) return "case";
  if (has(WANT_CABLE)) return "cable";
  if (has(WANT_CHARGER)) return "charger";
  return null;
}
function isStrictWanted(p: Mapped): boolean {
  const n = normalizeStr(p.name);
  const c = normalizeStr(p.category);
  if (EXCLUDE_INTERNAL.some(k => n.includes(k) || c.includes(k))) return false;
  if (EXCLUDE_TOOLS_CONSOM.some(k => n.includes(k) || c.includes(k))) return false;

  const t = tagWanted(p.name, p.category);
  if (!t) return false;

  const b = normalizeStr(p.brand);
  if (!ALLOWED_DEVICE_BRANDS.includes(b as (typeof ALLOWED_DEVICE_BRANDS)[number])) return false;

  return true;
}

/* ---------- Fetch + cache ---------- */
let RAW_CACHE: { ts: number; mapped: Mapped[] } | null = null;
const TTL_MS = 10 * 60 * 1000; // 10 minutes

async function fetchProductsOnce(): Promise<Product[]> {
  const headers: HeadersInit = { Accept: "application/json", Authorization: `Bearer ${TOKEN}` };
  // 1 essai rapide avec limit; fallback sans
  for (const url of [
    `${BASE_URL}/products?limit=500`,
    `${BASE_URL}/products`,
  ]) {
    const res = await fetch(url, { headers, cache: "no-store", next: { revalidate: 0 } });
    if (res.status === 401) throw new Error("401_UNAUTHENTICATED");
    if (!res.ok) continue;
    const payload = (await res.json().catch(() => null)) as Any;
    const arr: Product[] = Array.isArray(payload) ? payload : (payload?.products ?? []);
    if (Array.isArray(arr) && arr.length) return arr;
  }
  return [];
}

async function getMappedCached(forceFresh = false): Promise<Mapped[]> {
  const now = Date.now();
  if (!forceFresh && RAW_CACHE && now - RAW_CACHE.ts < TTL_MS) {
    return RAW_CACHE.mapped;
  }
  const raw = await fetchProductsOnce();
  const mapped = raw.map(mapProduct);
  RAW_CACHE = { ts: now, mapped };
  return mapped;
}

/* ---------- Handler ---------- */
export async function GET(req: NextRequest) {
  try {
    if (!TOKEN) {
      return NextResponse.json({ error: "FONEDAY_TOKEN manquant côté serveur." }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const q = normalizeStr(searchParams.get("q") ?? "");
    const onlyInStock = searchParams.get("inStock") === "1";
    const fresh = searchParams.get("fresh") === "1";
    const debug = searchParams.get("debug") === "1";

    const mapped = await getMappedCached(fresh);

    // Supplier NovaNL (brand ou titre)
    const ensureNovaNL = (p: Mapped) => {
      const s = normalizeStr(p.supplierBrand || "");
      const n = normalizeStr(p.name || "");
      return s.includes("novanl") || /nova[\s-]?nl/.test(s) || n.includes("novanl") || /nova[\s-]?nl/.test(n);
    };

    // Filtrage principal
    let filtered = mapped.filter(ensureNovaNL).filter(isStrictWanted);

    // Recherche & stock
    if (q) {
      filtered = filtered.filter(p =>
        normalizeStr(`${p.name} ${p.brand} ${p.model} ${p.sku}`).includes(q)
      );
    }
    if (onlyInStock) {
      filtered = filtered.filter(p => (p.stock ?? 0) > 0);
    }

    // Tag par famille
    filtered = filtered.map(p => ({ ...p, tag: tagWanted(p.name, p.category) || undefined }));

    if (debug) {
      const sample = filtered.slice(0, 8).map(p => ({
        sku: p.sku, name: p.name, brand: p.brand, model: p.model, cat: p.category, tag: p.tag, stock: p.stock, img: !!p.image
      }));
      return NextResponse.json({
        count: filtered.length,
        items: filtered,
        debug: { totalRaw: mapped.length, sample, cacheAgeSec: RAW_CACHE ? Math.round((Date.now() - RAW_CACHE.ts)/1000) : 0 }
      });
    }

    return NextResponse.json({ count: filtered.length, items: filtered });
  } catch (e: any) {
    if (e?.message === "401_UNAUTHENTICATED") {
      return NextResponse.json(
        { error: "FoneDay API error", status: 401, hint: "Vérifie le token (.env) et les droits sur /products." },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: "Unhandled error", message: e?.message ?? String(e) }, { status: 500 });
  }
}
