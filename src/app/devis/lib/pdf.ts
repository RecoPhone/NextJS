import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type QuoteItemMeta = { color?: string | null; partKind?: "back" | "frame" };
export type QuoteItem = { label: string; price: number; qty?: number; meta?: QuoteItemMeta };
export type QuoteDevice = { category?: string; model?: string; items: QuoteItem[] };

export type CompanyInfo = {
  name: string;
  slogan?: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  vat?: string;
};

export type ClientInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
};

export type QuotePayload = {
  quoteNumber: string;
  dateISO: string;
  company: CompanyInfo;
  client: ClientInfo;
  devices: QuoteDevice[];
  travelFee?: number;
  payInTwo?: boolean;
  // pour le contrat
  signatureDataUrl?: string | null;
};

export type ContractPayload = {
  contractNumber: string;
  dateISO: string;
  quoteRef: string;
  company: CompanyInfo;
  client: ClientInfo;
  amountTotal: number;
  schedule: { label: string; due: string; amountPct: number }[]; // ex. [{label:'Acompte', due:'à la validation', amountPct:50}, ...]
  legal: string[]; // tes CGV/clauses légales
  signatureDataUrl?: string | null;
};

function euro(n: number) {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(n);
}

async function loadPublicPng(path = "/logo_recophone.png"): Promise<Uint8Array | null> {
  try {
    // En route handler, on a accès à process.cwd() + "public"
    const fs = await import("fs/promises");
    const p = `${process.cwd()}/public${path}`;
    const buf = await fs.readFile(p);
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch {
    return null;
  }
}

function parseDataUrlImage(dataUrl: string): Uint8Array | null {
  try {
    const [head, b64] = dataUrl.split(",", 2);
    if (!head || !b64) return null;
    return Uint8Array.from(Buffer.from(b64, "base64"));
  } catch {
    return null;
  }
}

async function drawHeader(pdf: PDFDocument, page: any, company: CompanyInfo, title: string) {
  const margin = 36; // 0.5"
  const yTop = page.getHeight() - margin;
  const logoBytes = await loadPublicPng();
  if (logoBytes) {
    const png = await pdf.embedPng(logoBytes);
    const logoW = 90; // px on PDF (≈ 32mm)
    const ratio = png.height / png.width;
    page.drawImage(png, { x: margin, y: yTop - logoW * ratio, width: logoW, height: logoW * ratio });
  }

  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdf.embedFont(StandardFonts.Helvetica);

  // Titre à droite
  const titleSize = 16;
  const titleWidth = fontBold.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: page.getWidth() - margin - titleWidth,
    y: yTop - 10,
    size: titleSize,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });

  // Nom + slogan
  page.drawText(company.name, { x: margin + 105, y: yTop - 8, size: 14, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  if (company.slogan) {
    page.drawText(company.slogan, { x: margin + 105, y: yTop - 28, size: 10, font: fontReg, color: rgb(0.35, 0.35, 0.35) });
  }

  // Coordonnées
  let y = yTop - 46;
  const lines: string[] = [];
  if (company.address) lines.push(company.address);
  lines.push(`Tél: ${company.phone}`);
  lines.push(`Email: ${company.email}`);
  if (company.website) lines.push(`Site: ${company.website}`);
  if (company.vat) lines.push(`TVA: ${company.vat}`);
  for (const line of lines) {
    page.drawText(line, { x: margin + 105, y, size: 9, font: fontReg, color: rgb(0.3, 0.3, 0.3) });
    y -= 14;
  }

  // trait
  page.drawLine({
    start: { x: margin, y: y - 8 },
    end: { x: page.getWidth() - margin, y: y - 8 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });
  return y - 16;
}

/* ────────────────────────────────────────────────────────────────────────────
   DEVIS
   ──────────────────────────────────────────────────────────────────────────── */
export async function buildQuotePdfBuffer(data: QuotePayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 36;

  // Header
  let y = await drawHeader(pdf, page, data.company, "DEVIS");
  page.drawText(`Devis n° ${data.quoteNumber} — ${new Date(data.dateISO).toLocaleString("fr-BE")}`, {
    x: margin, y, size: 9, font, color: rgb(0.3, 0.3, 0.3),
  });
  y -= 24;

  // Bloc client
  page.drawText("Client", { x: margin, y, size: 11, font: bold, color: rgb(0.1, 0.1, 0.1) });
  y -= 16;
  const clientLines = [
    `${data.client.firstName} ${data.client.lastName}`,
    data.client.email,
    data.client.phone,
    data.client.address ?? "",
  ].filter(Boolean);
  clientLines.forEach((line) => {
    page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 14;
  });
  y -= 6;

  // Tableau réparations
  const colX = [margin, margin + 210, margin + 410, margin + 480]; // Appareil | Réparation | Détails | Prix
  const headerY = y;
  const headerBg = rgb(0.95, 0.98, 0.93);

  // en-tête
  page.drawRectangle({ x: margin - 2, y: headerY - 16, width: 523, height: 18, color: headerBg });
  [["Appareil", colX[0]], ["Réparation", colX[1]], ["Détails", colX[2]], ["Prix", colX[3]]].forEach(([txt, x]) => {
    page.drawText(String(txt), { x: Number(x), y: headerY - 12, size: 9, font: bold, color: rgb(0.1, 0.1, 0.1) });
  });
  y = headerY - 24;

  let total = 0;
  const drawRow = (model: string, label: string, detail: string, price: number) => {
    page.drawText(model, { x: colX[0], y, size: 9, font, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(label, { x: colX[1], y, size: 9, font, color: rgb(0.15, 0.15, 0.15) });
    if (detail) page.drawText(detail, { x: colX[2], y, size: 9, font, color: rgb(0.35, 0.35, 0.35) });
    const priceStr = euro(price);
    const pw = font.widthOfTextAtSize(priceStr, 9);
    page.drawText(priceStr, { x: colX[3] + 42 - pw, y, size: 9, font: bold, color: rgb(0.1, 0.1, 0.1) });
  };

  for (const d of data.devices) {
    const model = d.model ?? "";
    for (const it of d.items) {
      const detail =
        it.meta && "color" in it.meta
          ? `${it.meta.partKind === "back" ? "Face arrière" : "Châssis"} : ${it.meta.color ?? "Je ne sais pas"}`
          : "";
      drawRow(model, it.label, detail, it.price * (it.qty ?? 1));
      total += it.price * (it.qty ?? 1);
      y -= 14;
      if (y < 80) { /* page suivante simple si besoin */
        y = 700;
      }
    }
  }
  if (data.travelFee && data.travelFee > 0) {
    drawRow("—", "Frais de déplacement", "", data.travelFee);
    total += data.travelFee;
    y -= 14;
  }

  // total
  y -= 6;
  const totalStr = euro(total);
  const w = bold.widthOfTextAtSize(totalStr, 12);
  page.drawText("Total estimé", { x: colX[2], y, size: 10, font: font, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(totalStr, { x: colX[3] + 42 - w, y, size: 12, font: bold, color: rgb(0.1, 0.1, 0.1) });
  y -= 24;

  // note
  const note =
    "Prix indicatifs. Confirmation finale au moment de la prise de rendez-vous. " +
    "Garantie 12 mois pièces et main d’œuvre (hors casse, oxydation, micro-rayures).";
  page.drawText(note, { x: margin, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  const bytes = await pdf.save();
  return bytes;
}

/* ────────────────────────────────────────────────────────────────────────────
   CONTRAT Paiement en deux fois
   ──────────────────────────────────────────────────────────────────────────── */
export async function buildContractPdfBuffer(data: ContractPayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 36;

  let y = await drawHeader(pdf, page, data.company, "CONTRAT DE PAIEMENT EN DEUX FOIS");
  page.drawText(`Contrat n° ${data.contractNumber} — ${new Date(data.dateISO).toLocaleString("fr-BE")} | Réf. devis ${data.quoteRef}`, {
    x: margin, y, size: 9, font, color: rgb(0.3, 0.3, 0.3),
  });
  y -= 24;

  // Client
  page.drawText("Client", { x: margin, y, size: 11, font: bold, color: rgb(0.1, 0.1, 0.1) });
  y -= 16;
  const cl = data.client;
  [ `${cl.firstName} ${cl.lastName}`, cl.email, cl.phone, cl.address ?? "" ].filter(Boolean).forEach(line => {
    page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.2,0.2,0.2) }); y -= 14;
  });

  y -= 6;
  // Échéancier
  page.drawText("Échéancier", { x: margin, y, size: 11, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 18;
  const total = data.amountTotal;
  const colX = [margin, margin + 220, margin + 430];
  [["Échéance","Exigibilité","Montant"]].concat(
    data.schedule.map(s => [s.label, s.due, euro((s.amountPct/100)*total)]).concat([["Total","",""],])
  ).forEach((row, idx) => {
    const isHeader = idx === 0;
    const f = isHeader ? bold : font;
    const c = isHeader ? rgb(0.1,0.1,0.1) : rgb(0.2,0.2,0.2);
    const bg = isHeader ? rgb(0.95,0.98,0.93) : undefined;
    if (bg) page.drawRectangle({ x: margin-2, y: y-4, width: 523, height: 16, color: bg });
    page.drawText(String(row[0]), { x: colX[0], y, size: 9, font: f, color: c });
    page.drawText(String(row[1]), { x: colX[1], y, size: 9, font: f, color: c });
    if (row[2]) {
      const s = String(row[2]);
      const w = f.widthOfTextAtSize(s, 9);
      page.drawText(s, { x: colX[2]+42 - w, y, size: 9, font: f, color: c });
    }
    y -= 16;
  });
  // Total
  const totStr = euro(total);
  const tw = bold.widthOfTextAtSize(totStr, 12);
  page.drawText("Total", { x: colX[1], y: y-4, size: 10, font, color: rgb(0.2,0.2,0.2) });
  page.drawText(totStr, { x: colX[2]+42 - tw, y: y-6, size: 12, font: bold, color: rgb(0.1,0.1,0.1) });
  y -= 28;

  // Légal (tes CGV)
  page.drawText("Conditions légales", { x: margin, y, size: 11, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 16;
  const wrap = (text: string, max = 90) => {
    const parts: string[] = [];
    text.split(/\s+/).reduce((line, word) => {
      const next = line ? `${line} ${word}` : word;
      if (next.length > max) { parts.push(line); return word; }
      return next;
    }, "");
    // @ts-ignore
    if (RegExp.$_) {}
    return parts;
  };
  for (const li of data.legal) {
    for (const line of wrap(`• ${li}`, 95)) {
      page.drawText(line, { x: margin, y, size: 9, font, color: rgb(0.25,0.25,0.25) }); y -= 12;
      if (y < 110) { y = 700; }
    }
  }
  y -= 14;

  // Signature
  page.drawText("Signature du client", { x: margin, y, size: 11, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 12;
  if (data.signatureDataUrl) {
    const bytes = parseDataUrlImage(data.signatureDataUrl);
    if (bytes) {
      // On tente PNG puis JPEG
      try {
        const img = await pdf.embedPng(bytes);
        page.drawImage(img, { x: margin, y: y-50, width: 220, height: 80 });
      } catch {
        const img = await pdf.embedJpg(bytes);
        page.drawImage(img, { x: margin, y: y-50, width: 220, height: 80 });
      }
    } else {
      page.drawLine({ start: { x: margin, y: y-8 }, end: { x: margin+220, y: y-8 }, thickness: 1, color: rgb(0,0,0) });
    }
  } else {
    page.drawLine({ start: { x: margin, y: y-8 }, end: { x: margin+220, y: y-8 }, thickness: 1, color: rgb(0,0,0) });
  }
  page.drawText(`Fait le ${new Date(data.dateISO).toLocaleString("fr-BE")}`, { x: margin, y: y-64, size: 9, font, color: rgb(0.3,0.3,0.3) });

  const bytes = await pdf.save();
  return bytes;
}
