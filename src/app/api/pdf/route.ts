import { NextRequest } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ───────────────────────── Types (alignés avec StepResume) ───────────────────────── */
type QuoteItemMeta = { color?: string | null; partKind?: "back" | "frame" };
type QuoteItem = { label: string; price: number; qty?: number; meta?: QuoteItemMeta };
type QuoteDevice = { category?: string; model?: string; items: QuoteItem[] };
type CompanyInfo = { name: string; slogan?: string; email: string; phone: string; website?: string; address?: string; vat?: string; };
type ClientInfo = { firstName: string; lastName: string; email: string; phone: string; address?: string; };

type QuotePayload = {
  quoteNumber: string;
  dateISO: string;
  company: CompanyInfo;
  client: ClientInfo;
  devices: QuoteDevice[];
  travelFee?: number;
  payInTwo?: boolean;
  signatureDataUrl?: string | null;
};

type ContractPayload = {
  contractNumber: string;
  dateISO: string;
  quoteRef: string;
  company: CompanyInfo;
  client: ClientInfo;
  amountTotal: number;
  schedule: { label: string; due: string; amountPct: number }[];
  legal: string[];
  signatureDataUrl?: string | null;
};

/* ───────────────────────── Helpers visuels pour le “template pro” ───────────────────────── */
const A4: [number, number] = [595.28, 841.89];
const margin = 36;
const brand = { r: 0x54/255, g: 0xb4/255, b: 0x35/255 }; // #54b435

function euro(n: number) {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(n);
}

async function loadPublicPng(path = "/logo_recophone.png"): Promise<Uint8Array | null> {
  try {
    const p = `${process.cwd()}/public${path}`;
    const buf = await fs.readFile(p);
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch {
    return null;
  }
}

async function drawBrandBar(page: any) {
  page.drawRectangle({ x: 0, y: page.getHeight() - 8, width: page.getWidth(), height: 8, color: rgb(brand.r,brand.g,brand.b) });
}

async function drawHeaderPro(pdf: PDFDocument, page: any, company: CompanyInfo, title: string) {
  await drawBrandBar(page);
  const yTop = page.getHeight() - margin - 6;

  const logoBytes = await loadPublicPng();
  if (logoBytes) {
    const png = await pdf.embedPng(logoBytes);
    const w = 110, h = (png.height / png.width) * w;
    page.drawImage(png, { x: margin, y: yTop - h, width: w, height: h });
  }

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);

  const t = title.toUpperCase();
  const ts = 18;
  const tw = bold.widthOfTextAtSize(t, ts);
  page.drawText(t, { x: page.getWidth() - margin - tw, y: yTop, size: ts, font: bold, color: rgb(0.1,0.1,0.1) });

  let y = yTop - 22;
  const meta = [
    company.address || "",
    company.website ? `Site: ${company.website}` : "",
    company.vat ? `TVA: ${company.vat}` : "",
    `Tél: ${company.phone}`,
    `Email: ${company.email}`,
  ].filter(Boolean);
  meta.forEach((line) => {
    page.drawText(line, { x: margin + 130, y, size: 9, font: reg, color: rgb(0.35,0.35,0.35) });
    y -= 12;
  });

  page.drawLine({ start: { x: margin, y: y - 8 }, end: { x: page.getWidth() - margin }, thickness: 1, color: rgb(0.9,0.9,0.9) });
  return y - 16;
}

async function drawFooterPro(pdf: PDFDocument, page: any, company: CompanyInfo, msg: string) {
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const y = 24;
  page.drawLine({ start: { x: margin, y: y + 14 }, end: { x: page.getWidth() - margin, y: y + 14 }, thickness: 1, color: rgb(0.9,0.9,0.9) });
  page.drawText(msg, { x: margin, y, size: 9, font: reg, color: rgb(0.4,0.4,0.4) });
  const coords = [company.phone, company.email, company.website].filter(Boolean).join(" • ");
  const w = reg.widthOfTextAtSize(coords, 9);
  page.drawText(coords, { x: page.getWidth() - margin - w, y, size: 9, font: reg, color: rgb(0.4,0.4,0.4) });
}

function wrapText(font: any, text: string, size: number, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const tryL = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(tryL, size) > maxWidth) {
      if (line) lines.push(line);
      line = w;
    } else line = tryL;
  }
  if (line) lines.push(line);
  return lines;
}

/* ───────────────────────── Builders: devis & contrat ───────────────────────── */
async function buildQuotePdfBuffer(data: QuotePayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage(A4);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = await drawHeaderPro(pdf, page, data.company, "Devis");
  page.drawText(`Devis n° ${data.quoteNumber} — ${new Date(data.dateISO).toLocaleString("fr-BE")}`, { x: margin, y, size: 9, font: reg, color: rgb(0.3,0.3,0.3) });
  y -= 20;

  page.drawText("Client", { x: margin, y, size: 11, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 14;
  for (const line of [`${data.client.firstName} ${data.client.lastName}`, data.client.email, data.client.phone, data.client.address || ""].filter(Boolean)) {
    page.drawText(line, { x: margin, y, size: 10, font: reg, color: rgb(0.2,0.2,0.2) }); y -= 12;
  }
  y -= 6;

  // Table header
  const colX = [margin, margin + 210, margin + 410, margin + 480];
  const headerY = y;
  page.drawRectangle({ x: margin - 2, y: headerY - 16, width: 523, height: 18, color: rgb(0.96, 0.99, 0.96) });
  [["Appareil",colX[0]],["Réparation",colX[1]],["Détails",colX[2]],["Prix",colX[3]]].forEach(([t,x]) =>
    page.drawText(String(t), { x: Number(x), y: headerY - 12, size: 9, font: bold, color: rgb(0.1,0.1,0.1) })
  );
  y = headerY - 24;

  const drawRow = (m: string, label: string, det: string, price: number, zebra: boolean) => {
    if (zebra) page.drawRectangle({ x: margin - 2, y: y - 2, width: 523, height: 14, color: rgb(0.985, 0.99, 0.985) });
    page.drawText(m, { x: colX[0], y, size: 9, font: reg, color: rgb(0.15,0.15,0.15) });
    page.drawText(label, { x: colX[1], y, size: 9, font: reg, color: rgb(0.15,0.15,0.15) });
    if (det) page.drawText(det, { x: colX[2], y, size: 9, font: reg, color: rgb(0.35,0.35,0.35) });
    const s = euro(price); const w = bold.widthOfTextAtSize(s, 9);
    page.drawText(s, { x: colX[3] + 42 - w, y, size: 9, font: bold, color: rgb(0.1,0.1,0.1) });
  };

  let total = 0, rowIndex = 0;

  const addPageIfNeeded = async (min = 80) => {
    if (y < min) {
      page = pdf.addPage(A4);
      y = await drawHeaderPro(pdf, page, data.company, "Devis");
      // redraw table header
      const hY = y;
      page.drawRectangle({ x: margin - 2, y: hY - 16, width: 523, height: 18, color: rgb(0.96, 0.99, 0.96) });
      [["Appareil",colX[0]],["Réparation",colX[1]],["Détails",colX[2]],["Prix",colX[3]]].forEach(([t,x]) =>
        page.drawText(String(t), { x: Number(x), y: hY - 12, size: 9, font: bold, color: rgb(0.1,0.1,0.1) })
      );
      y = hY - 24;
    }
  };

  for (const d of data.devices) {
    const model = d.model || "";
    for (const it of d.items) {
      await addPageIfNeeded(80);
      const det = it.meta && "color" in it.meta ? `${it.meta.partKind === "back" ? "Face arrière" : "Châssis"} : ${it.meta.color ?? "Je ne sais pas"}` : "";
      const price = it.price * (it.qty ?? 1);
      drawRow(model, it.label, det, price, rowIndex % 2 === 1);
      total += price; rowIndex++; y -= 14;
    }
  }
  if (data.travelFee && data.travelFee > 0) {
    await addPageIfNeeded(80);
    drawRow("—", "Frais de déplacement", "", data.travelFee, rowIndex % 2 === 1);
    total += data.travelFee; rowIndex++; y -= 14;
  }

  // Totaux encadrés
  y -= 8;
  page.drawRectangle({ x: colX[2] - 10, y: y - 10, width: 170, height: 28, color: rgb(1,1,1), borderColor: rgb(0.9,0.9,0.9), borderWidth: 1 });
  page.drawText("Total estimé", { x: colX[2] - 6, y: y + 6, size: 10, font: reg, color: rgb(0.2,0.2,0.2) });
  const totalStr = euro(total); const tw = bold.widthOfTextAtSize(totalStr, 12);
  page.drawText(totalStr, { x: colX[3] + 42 - tw, y: y + 4, size: 12, font: bold, color: rgb(0.1,0.1,0.1) });

  await drawFooterPro(pdf, page, data.company, "Devis valable 14 jours • CGV disponibles sur recophone.be/cgv");
  return await pdf.save();
}

async function buildContractPdfBuffer(data: ContractPayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage(A4);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = await drawHeaderPro(pdf, page, data.company, "Contrat de paiement en deux fois");
  page.drawText(`Contrat n° ${data.contractNumber} — ${new Date(data.dateISO).toLocaleString("fr-BE")} | Réf. devis ${data.quoteRef}`, { x: margin, y, size: 9, font: reg, color: rgb(0.3,0.3,0.3) });
  y -= 20;

  page.drawText("Client", { x: margin, y, size: 11, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 14;
  for (const line of [`${data.client.firstName} ${data.client.lastName}`, data.client.email, data.client.phone, data.client.address || ""].filter(Boolean)) {
    page.drawText(line, { x: margin, y, size: 10, font: reg, color: rgb(0.2,0.2,0.2) }); y -= 12;
  }
  y -= 6;

  // Échéancier
  page.drawText("Échéancier", { x: margin, y, size: 11, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 16;
  const colX = [margin, margin + 220, margin + 430];
  const rows = [["Échéance","Exigibilité","Montant"], ...data.schedule.map(s => [s.label, s.due, euro((s.amountPct/100)*data.amountTotal)])];
  rows.forEach((r, i) => {
    const isHead = i === 0; const f = isHead ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
    const font = isHead ? bold : reg;
    const c = isHead ? rgb(0.1,0.1,0.1) : rgb(0.2,0.2,0.2);
    if (isHead) page.drawRectangle({ x: margin - 2, y: y - 16, width: 523, height: 18, color: rgb(0.96, 0.99, 0.96) });
    page.drawText(String(r[0]), { x: colX[0], y: y - 12, size: 9, font, color: c });
    page.drawText(String(r[1]), { x: colX[1], y: y - 12, size: 9, font, color: c });
    const s = String(r[2]); const w = font.widthOfTextAtSize(s, 9);
    page.drawText(s, { x: colX[2] + 42 - w, y: y - 12, size: 9, font, color: c }); y -= 18;
  });

  const tot = euro(data.amountTotal), tw = bold.widthOfTextAtSize(tot, 12);
  page.drawText("Total", { x: colX[1], y: y - 2, size: 10, font: reg, color: rgb(0.2,0.2,0.2) });
  page.drawText(tot, { x: colX[2] + 42 - tw, y: y - 4, size: 12, font: bold, color: rgb(0.1,0.1,0.1) });
  y -= 24;

  // Conditions légales (wrapping)
  page.drawText("Conditions légales", { x: margin, y, size: 11, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 14;
  const linesWrap = (t: string, max = 523) => wrapText(reg, t, 9, max);
  for (const li of data.legal) {
    const lines = linesWrap(`• ${li}`);
    for (const line of lines) {
      if (y < 80) {
        page = pdf.addPage(A4);
        y = await drawHeaderPro(pdf, page, data.company, "Contrat de paiement en deux fois") - 6;
      }
      page.drawText(line, { x: margin, y, size: 9, font: reg, color: rgb(0.25,0.25,0.25) });
      y -= 12;
    }
  }
  y -= 10;

  // Signature
  page.drawText("Signature du client", { x: margin, y, size: 11, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 12;
  // (Si tu veux intégrer la signature image depuis data URL dans /api/pdf, ajoute parseDataUrlImage ici)
  page.drawLine({ start: { x: margin, y: y - 8 }, end: { x: margin + 220, y: y - 8 }, thickness: 1, color: rgb(0,0,0) });

  await drawFooterPro(pdf, page, data.company, "Document contractuel — Conservez une copie");
  return await pdf.save();
}

/* ───────────────────────── Handler POST ─────────────────────────
  Body attendu :
  {
    "docType": "quote" | "contract",
    "payload": <QuotePayload | ContractPayload>,
    "download": true   // pour forcer attachment
  }
------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const { docType, payload, download } = (await req.json()) as {
    docType: "quote" | "contract";
    payload: QuotePayload | ContractPayload;
    download?: boolean;
  };

  if (!docType || !payload) {
    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });
  }

  try {
    let bytes: Uint8Array;
    let filename: string;

    if (docType === "quote") {
      bytes = await buildQuotePdfBuffer(payload as QuotePayload);
      filename = `devis_${(payload as QuotePayload).quoteNumber}.pdf`;
    } else {
      bytes = await buildContractPdfBuffer(payload as ContractPayload);
      filename = `contrat_${(payload as ContractPayload).contractNumber}.pdf`;
    }

    // Toujours renvoyer le PDF en téléchargement
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
