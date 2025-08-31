import { NextRequest } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ───────────────────────── Types ───────────────────────── */
type QuoteItemMeta = { color?: string | null; partKind?: "back" | "frame" };
type QuoteItem = { label: string; price: number; qty?: number; meta?: QuoteItemMeta };
type QuoteDevice = { category?: string; model?: string; items: QuoteItem[] };
type CompanyInfo = { name: string; slogan?: string; email: string; phone: string; website?: string; address?: string; vat?: string; };
type ClientInfo = { firstName: string; lastName: string; email: string; phone: string; address?: string; };

type QuotePayload = {
  quoteNumber: string;
  createdAt?: string; // ISO
  company: CompanyInfo;
  client: ClientInfo;
  device: QuoteDevice;
  subtotal?: number;
  vat?: number;
  total?: number;
  travelFee?: number;
  discount?: number;
  note?: string;
};

/* ───────────────────────── Utils ───────────────────────── */
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const n = (v: unknown, fallback = 0) => {
  if (isNum(v)) return v;
  const num = typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(num) ? num : fallback;
};
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

function eur(x: unknown) {
  const v = n(x, 0);
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(v);
}

async function loadPublicImage(path: string): Promise<Uint8Array | null> {
  try {
    const p = `${process.cwd()}/public${path}`;
    const buf = await fs.readFile(p);
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch {
    return null;
  }
}

/* ───────────────────────── Drawing helpers (safe) ───────────────────────── */
function hLine(page: any, x1: unknown, x2: unknown, y: unknown, thickness = 1, color?: any) {
  const sx = n(x1), ex = n(x2), sy = n(y);
  if (!isNum(sx) || !isNum(ex) || !isNum(sy)) return;
  page.drawLine({ start: { x: sx, y: sy }, end: { x: ex, y: sy }, thickness, color });
}
function vLine(page: any, x: unknown, y1: unknown, y2: unknown, thickness = 1, color?: any) {
  const sx = n(x), sy = n(y1), ey = n(y2);
  if (!isNum(sx) || !isNum(sy) || !isNum(ey)) return;
  page.drawLine({ start: { x: sx, y: sy }, end: { x: sx, y: ey }, thickness, color });
}

/* ───────────────────────── Layout constants ───────────────────────── */
const A4 = { width: 595.28, height: 841.89 };
const margin = 40;
const brand = { bg: rgb(0.329, 0.706, 0.208) }; // #54b435
const ink = {
  primary: rgb(0.133, 0.133, 0.133),
  gray: rgb(0.55, 0.55, 0.55),
  light: rgb(0.88, 0.88, 0.88),
};

/* ───────────────────────── Sections ───────────────────────── */
async function drawBrandBar(page: any) {
  const yTop = A4.height - margin;
  page.drawRectangle({ x: 0, y: yTop, width: A4.width, height: 12, color: brand.bg });
}

async function drawHeader(pdf: PDFDocument, page: any, fontBold: any, font: any, payload: QuotePayload) {
  const yTop = A4.height - margin - 20;
  const xLeft = margin;
  const xRight = A4.width - margin;

  // Logo (PNG/JPG)
  let y = yTop;
  const png = await loadPublicImage("/logo_recophone.png");
  const jpg = !png ? await loadPublicImage("/logo_recophone.jpg") : null;
  try {
    if (png) {
      const img = await pdf.embedPng(png);
      const w = 90, h = (img.height / img.width) * w;
      page.drawImage(img, { x: xLeft, y: y + 2, width: w, height: h });
    } else if (jpg) {
      const img = await pdf.embedJpg(jpg);
      const w = 90, h = (img.height / img.width) * w;
      page.drawImage(img, { x: xLeft, y: y + 2, width: w, height: h });
    }
  } catch { /* ignore */ }

  // Company / title
  page.drawText(str(payload.company?.name, "RecoPhone"), { x: xLeft + 100, y, size: 16, font: fontBold, color: ink.primary });
  y -= 18;
  const slogan = str(payload.company?.slogan, "Réparer — Reconditionner — Protéger");
  page.drawText(slogan, { x: xLeft + 100, y, size: 10, font, color: ink.gray });

  // Quote meta
  const qn = str(payload.quoteNumber, "DEVIS-0000");
  const dateStr = str(payload.createdAt, new Date().toISOString().slice(0, 10));
  const right = [
    `Devis n° ${qn}`,
    `Date : ${new Date(dateStr).toLocaleDateString("fr-BE")}`,
  ];
  const rX = xRight - 180;
  let ry = yTop;
  right.forEach((t) => { page.drawText(t, { x: rX, y: ry, size: 11, font, color: ink.primary }); ry -= 14; });

  // separator
  hLine(page, margin, A4.width - margin, y - 8, 1, ink.light);
  return y - 16;
}

function drawClientDevice(page: any, fontBold: any, font: any, payload: QuotePayload, yStart: number) {
  let y = yStart;

  page.drawText("Client", { x: margin, y, size: 12, font: fontBold, color: ink.primary });
  page.drawText("Appareil", { x: A4.width / 2, y, size: 12, font: fontBold, color: ink.primary });
  y -= 14;

  const clientLines = [
    `${str(payload.client?.firstName)} ${str(payload.client?.lastName)}`.trim(),
    str(payload.client?.email),
    str(payload.client?.phone),
    str(payload.client?.address),
  ].filter(Boolean);

  const dev = payload.device || { items: [] };
  const deviceLines = [str(dev.category), str(dev.model)].filter(Boolean);

  clientLines.forEach((t) => { page.drawText(t, { x: margin, y, size: 10, font, color: ink.primary }); y -= 12; });
  let yDev = yStart - 14;
  deviceLines.forEach((t) => { page.drawText(t, { x: A4.width / 2, y: yDev, size: 10, font, color: ink.primary }); yDev -= 12; });

  const yNext = Math.min(y, yDev) - 12;
  hLine(page, margin, A4.width - margin, yNext, 1, ink.light);
  return yNext - 10;
}

function drawItemsTable(page: any, fontBold: any, font: any, payload: QuotePayload, yStart: number) {
  let y = yStart;
  const items = Array.isArray(payload.device?.items) ? payload.device.items : [];
  const cols = { label: margin, qty: A4.width - margin - 160, price: A4.width - margin - 80, total: A4.width - margin };

  // Header
  page.drawText("Désignation", { x: cols.label, y, size: 11, font: fontBold });
  page.drawText("Qté", { x: cols.qty, y, size: 11, font: fontBold });
  page.drawText("Prix", { x: cols.price, y, size: 11, font: fontBold });
  page.drawText("Total", { x: cols.total - 40, y, size: 11, font: fontBold });
  y -= 10;
  hLine(page, margin, A4.width - margin, y, 1, ink.light);
  y -= 8;

  if (items.length === 0) {
    page.drawText("Aucune ligne", { x: cols.label, y, size: 10, font, color: ink.gray });
    y -= 12;
  } else {
    for (const it of items) {
      const qty = n(it.qty, 1);
      const lineTotal = n(it.price, 0) * qty;
      const line = it.label
        + (it.meta?.color ? ` — ${it.meta.color}` : "")
        + (it.meta?.partKind ? ` (${it.meta.partKind})` : "");
      page.drawText(line, { x: cols.label, y, size: 10, font });
      page.drawText(String(qty), { x: cols.qty, y, size: 10, font });
      page.drawText(eur(it.price), { x: cols.price, y, size: 10, font });
      page.drawText(eur(lineTotal), { x: cols.total - 40, y, size: 10, font });
      y -= 14;
    }
  }

  hLine(page, margin, A4.width - margin, y, 1, ink.light);
  return y - 10;
}

function drawTotals(page: any, fontBold: any, font: any, payload: QuotePayload, yStart: number) {
  let y = yStart;
  const x = A4.width - margin - 200;

  const subtotal = n(payload.subtotal);
  const travel = n(payload.travelFee);
  const discount = n(payload.discount);
  const vat = n(payload.vat);
  const total = n(payload.total, subtotal + travel - discount + vat);

  const rows = [
    ["Sous-total", eur(subtotal)],
    ...(travel ? ([["Déplacement", eur(travel)]] as const) : []),
    ...(discount ? ([["Remise", `- ${eur(discount)}`]] as const) : []),
    ["TVA", eur(vat)],
    ["Total", eur(total)],
  ] as const;

  rows.forEach(([k, v], i) => {
    const isLast = i === rows.length - 1;
    page.drawText(k, { x, y, size: 11, font });
    page.drawText(v, { x: x + 120, y, size: 11, font: isLast ? fontBold : font });
    y -= 14;
    if (!isLast) hLine(page, x, x + 200, y + 4, 1, ink.light);
  });

  return y - 6;
}

function drawFooter(page: any, font: any, payload: QuotePayload) {
  const y = margin - 10;
  hLine(page, margin, A4.width - margin, y + 14, 1, ink.light);
  const contact = [str(payload.company?.email), str(payload.company?.phone), str(payload.company?.website)]
    .filter(Boolean)
    .join(" • ");
  page.drawText(contact, { x: margin, y, size: 9, font, color: ink.gray });
}

/* ───────────────────────── Handler ───────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const download = searchParams.get("download") === "1";

    const body = (await req.json()) as Partial<QuotePayload> | undefined;
    if (!body) return new Response(JSON.stringify({ error: "payload vide" }), { status: 400 });

    const payload: QuotePayload = {
      quoteNumber: str(body.quoteNumber, "DEVIS-0000"),
      createdAt: str(body.createdAt, new Date().toISOString()),
      company: body.company as CompanyInfo,
      client: body.client as ClientInfo,
      device: (body.device as QuoteDevice) ?? { items: [] },
      subtotal: n(body.subtotal, 0),
      vat: n(body.vat, 0),
      total: n(body.total, 0),
      travelFee: n(body.travelFee, 0),
      discount: n(body.discount, 0),
      note: str(body.note),
    };

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([A4.width, A4.height]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    await drawBrandBar(page);
    const yAfterHeader = await drawHeader(pdf, page, fontBold, font, payload);
    const yAfterClient = drawClientDevice(page, fontBold, font, payload, yAfterHeader);
    const yAfterItems = drawItemsTable(page, fontBold, font, payload, yAfterClient);
    drawTotals(page, fontBold, font, payload, yAfterItems);
    drawFooter(page, font, payload);

    const bytes = await pdf.save();
    const filename = `devis_${payload.quoteNumber.replace(/[^A-Za-z0-9_-]+/g, "-")}.pdf`;
    const buf = Buffer.from(bytes);

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(buf.length),
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "pdf failed" }), { status: 500 });
  }
}
