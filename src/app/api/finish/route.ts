import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ——— Types identiques à avant ——— */
type QuoteItemMeta = { color?: string | null; partKind?: "back" | "frame" };
type QuoteItem = { label: string; price: number; qty?: number; meta?: QuoteItemMeta };
type QuoteDevice = { category?: string; model?: string; items: QuoteItem[] };
type CompanyInfo = { name: string; slogan?: string; email: string; phone: string; website?: string; address?: string; vat?: string; };
type ClientInfo = { firstName: string; lastName: string; email: string; phone: string; address?: string; };

type QuotePayload = { quoteNumber: string; dateISO: string; company: CompanyInfo; client: ClientInfo; devices: QuoteDevice[]; travelFee?: number; payInTwo?: boolean; signatureDataUrl?: string | null; };
type ContractPayload = { contractNumber: string; dateISO: string; quoteRef: string; company: CompanyInfo; client: ClientInfo; amountTotal: number; schedule: { label: string; due: string; amountPct: number }[]; legal: string[]; signatureDataUrl?: string | null; };

/* ——— Utils ——— */
const noAccentsUpper = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " "); 

const compactRef = (ref: string) => (ref || "").replace(/[^A-Za-z0-9]+/g, ""); // enlève tirets etc.
const euro = (n: number) => new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(n);

async function loadPublicPng(path = "/images/contents/logo_recophone.png"): Promise<Uint8Array | null> {
  try { const p = `${process.cwd()}/public${path}`; const buf = await fs.readFile(p); return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength); } catch { return null; }
}
function parseDataUrlImage(dataUrl?: string | null): Uint8Array | null {
  if (!dataUrl || !dataUrl.startsWith("data:image")) return null;
  try { const b64 = dataUrl.split(",", 2)[1]; return Uint8Array.from(Buffer.from(b64, "base64")); } catch { return null; }
}

/* ——— Header & Builders PDF (inchangés de ta version précédente) ——— */
async function drawHeader(pdf: PDFDocument, page: any, company: CompanyInfo, title: string) {
  const margin = 36, yTop = page.getHeight() - margin;
  const logoBytes = await loadPublicPng();
  if (logoBytes) { const png = await pdf.embedPng(logoBytes); const logoW = 90, ratio = png.height/png.width;
    page.drawImage(png, { x: margin, y: yTop - logoW*ratio, width: logoW, height: logoW*ratio }); }
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const tw = bold.widthOfTextAtSize(title, 16);
  page.drawText(title, { x: page.getWidth()-margin-tw, y: yTop-10, size: 16, font: bold, color: rgb(0.15,0.15,0.15) });
  page.drawText(company.name, { x: margin+105, y: yTop-8, size: 14, font: bold, color: rgb(0.1,0.1,0.1) });
  if (company.slogan) page.drawText(company.slogan, { x: margin+105, y: yTop-28, size: 10, font: reg, color: rgb(0.35,0.35,0.35) });
  let y = yTop-46;
  for (const line of [company.address||"", `Tél: ${company.phone}`, `Email: ${company.email}`, company.website?`Site: ${company.website}`:"", company.vat?`TVA: ${company.vat}`:""].filter(Boolean)) {
    page.drawText(line, { x: margin+105, y, size: 9, font: reg, color: rgb(0.3,0.3,0.3) }); y -= 14;
  }
  page.drawLine({ start:{x:margin,y:y-8}, end:{x:page.getWidth()-margin,y:y-8}, thickness:1, color: rgb(0.9,0.9,0.9) });
  return y-16;
}

async function buildQuotePdfBuffer(data: QuotePayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create(); const page = pdf.addPage([595.28, 841.89]);
  const reg = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 36;
  let y = await drawHeader(pdf, page, data.company, "DEVIS");
  page.drawText(`Devis n° ${data.quoteNumber} — ${new Date(data.dateISO).toLocaleString("fr-BE")}`, { x: margin, y, size:9, font: reg, color: rgb(0.3,0.3,0.3) }); y -= 24;
  page.drawText("Client", { x: margin, y, size: 11, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 16;
  for (const line of [`${data.client.firstName} ${data.client.lastName}`, data.client.email, data.client.phone, data.client.address||""].filter(Boolean)) {
    page.drawText(line, { x: margin, y, size:10, font: reg, color: rgb(0.2,0.2,0.2) }); y -= 14; }
  y -= 6;
  const colX = [margin, margin+210, margin+410, margin+480]; const headerY=y; const headerBg = rgb(0.95,0.98,0.93);
  page.drawRectangle({ x: margin-2, y: headerY-16, width: 523, height: 18, color: headerBg });
  [["Appareil",colX[0]],["Réparation",colX[1]],["Détails",colX[2]],["Prix",colX[3]]].forEach(([t,x]) => page.drawText(String(t), { x:Number(x), y: headerY-12, size:9, font:bold, color: rgb(0.1,0.1,0.1) })); y = headerY-24;
  let total = 0;
  const drawRow = (m: string, label: string, det: string, price: number) => {
    page.drawText(m, { x: colX[0], y, size:9, font: reg, color: rgb(0.15,0.15,0.15) });
    page.drawText(label, { x: colX[1], y, size:9, font: reg, color: rgb(0.15,0.15,0.15) });
    if (det) page.drawText(det, { x: colX[2], y, size:9, font: reg, color: rgb(0.35,0.35,0.35) });
    const s = euro(price); const w = reg.widthOfTextAtSize(s, 9); page.drawText(s, { x: colX[3]+42-w, y, size:9, font:bold, color: rgb(0.1,0.1,0.1) });
  };
  for (const d of data.devices) {
    const model = d.model || "";
    for (const it of d.items) {
      const det = it.meta && "color" in it.meta ? `${it.meta.partKind==="back"?"Face arrière":"Châssis"} : ${it.meta.color ?? "Je ne sais pas"}` : "";
      const price = it.price * (it.qty ?? 1); drawRow(model, it.label, det, price); total += price; y -= 14; if (y<80) y=700;
    }
  }
  if (data.travelFee && data.travelFee>0) { drawRow("—","Frais de déplacement","",data.travelFee); total += data.travelFee; y -= 14; }
  y -= 6; const tot = euro(total); const w = bold.widthOfTextAtSize(tot, 12);
  page.drawText("Total estimé", { x: colX[2], y, size:10, font: reg, color: rgb(0.2,0.2,0.2) });
  page.drawText(tot, { x: colX[3]+42-w, y, size:12, font: bold, color: rgb(0.1,0.1,0.1) });
  return await pdf.save();
}

async function buildContractPdfBuffer(data: ContractPayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create(); const page = pdf.addPage([595.28, 841.89]);
  const reg = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 36;
  let y = await drawHeader(pdf, page, data.company, "CONTRAT DE PAIEMENT EN DEUX FOIS");
  page.drawText(`Contrat n° ${data.contractNumber} — ${new Date(data.dateISO).toLocaleString("fr-BE")} | Réf. devis ${data.quoteRef}`, { x: margin, y, size:9, font: reg, color: rgb(0.3,0.3,0.3) }); y -= 24;
  page.drawText("Client", { x: margin, y, size: 11, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 16;
  for (const line of [`${data.client.firstName} ${data.client.lastName}`, data.client.email, data.client.phone, data.client.address||""].filter(Boolean)) {
    page.drawText(line, { x: margin, y, size:10, font: reg, color: rgb(0.2,0.2,0.2) }); y -= 14; }
  y -= 6; page.drawText("Échéancier", { x: margin, y, size: 11, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 18;
  const total = data.amountTotal; const colX = [margin, margin+220, margin+430];
  const rows = [["Échéance","Exigibilité","Montant"], ...data.schedule.map(s => [s.label, s.due, euro((s.amountPct/100)*total)])];
  rows.forEach((r,i)=>{ const f=i?reg:bold, c=i?rgb(0.2,0.2,0.2):rgb(0.1,0.1,0.1), bg=i?undefined:rgb(0.95,0.98,0.93);
    if (bg) page.drawRectangle({ x: margin-2, y: y-4, width: 523, height: 16, color: bg });
    page.drawText(String(r[0]), { x: colX[0], y, size:9, font:f, color:c });
    page.drawText(String(r[1]), { x: colX[1], y, size:9, font:f, color:c });
    const s=String(r[2]), w=f.widthOfTextAtSize(s,9); page.drawText(s,{ x: colX[2]+42 - w, y, size:9, font:f, color:c }); y -= 16; });
  const tot = euro(total), tw = bold.widthOfTextAtSize(tot, 12);
  page.drawText("Total", { x: colX[1], y: y-4, size:10, font: reg, color: rgb(0.2,0.2,0.2) });
  page.drawText(tot, { x: colX[2]+42 - tw, y: y-6, size:12, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 28;
  page.drawText("Conditions légales", { x: margin, y, size: 11, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 16;
  const wrap=(t:string,max=92)=>{const out:string[]=[];let l="";for(const w of t.split(/\s+/)){const n=l?`${l} ${w}`:w;if(n.length>max){out.push(l);l=w;}else l=n;} if(l) out.push(l); return out;};
  for(const li of data.legal){ for(const line of wrap(`• ${li}`)){ page.drawText(line,{x:margin,y,size:9,font:reg,color:rgb(0.25,0.25,0.25)}); y-=12; if(y<110) y=700; } } y -= 14;
  page.drawText("Signature du client", { x: margin, y, size: 11, font: bold, color: rgb(0.1,0.1,0.1) }); y -= 12;
  const sb = parseDataUrlImage(data.signatureDataUrl);
  if (sb) { try { const img = await pdf.embedPng(sb); page.drawImage(img,{x:margin,y:y-50,width:220,height:80}); }
    catch{ const img = await pdf.embedJpg(sb); page.drawImage(img,{x:margin,y:y-50,width:220,height:80}); } }
  else { page.drawLine({ start:{x:margin,y:y-8}, end:{x:margin+220,y:y-8}, thickness:1, color: rgb(0,0,0) }); }
  page.drawText(`Fait le ${new Date(data.dateISO).toLocaleString("fr-BE")}`, { x: margin, y: y-64, size:9, font: reg, color: rgb(0.3,0.3,0.3) });
  return await pdf.save();
}

/* ——— Upload vers o2switch (dossier + nom fichier personnalisés) ——— */
async function uploadToO2Switch(bytes: Uint8Array, outputName: string, folderName: string) {
  const endpoint = process.env.DOWNLOAD_ENDPOINT, token = process.env.DOWNLOAD_BEARER;
  if (!endpoint || !token) throw new Error("DOWNLOAD_ENDPOINT / DOWNLOAD_BEARER non configurés");

  const blob = new Blob([Buffer.from(bytes)], { type: "application/pdf" });

  const fd = new FormData();
  // On envoie folder_name + le fichier (avec outputName comme nom final)
  fd.append("folder_name", folderName);
  fd.append("file", blob, outputName);

  let res: Response;
  try {
    res = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
  } catch (err: any) {
    const cause = err?.cause?.code || err?.code || err?.message || "unknown";
    throw new Error(`fetch to ${endpoint} failed (cause: ${cause})`);
  }
  if (!res.ok) throw new Error(`upload failed: ${res.status} ${res.statusText} ${await res.text()}`);
  const json = (await res.json()) as { ok: boolean; download_url: string };
  if (!json.ok || !json.download_url) throw new Error("upload response invalid");
  return json.download_url; // ex: https://download.recophone.be/r/XXXX
}

/* ——— Email ——— */
async function sendConfirmationEmail(opts: {
  to: string; quoteNumber: string;
  quoteBytes: Uint8Array; contractBytes?: Uint8Array | null;
  quoteUrl: string; contractUrl?: string | null;
  company: CompanyInfo; client: ClientInfo;
}) {
  const host = process.env.SMTP_HOST!, port = Number(process.env.SMTP_PORT || "465");
  const secure = String(process.env.SMTP_SECURE || "true") === "true";
  const user = process.env.SMTP_USER!, pass = process.env.SMTP_PASS!;
  const from = process.env.MAIL_FROM || `RecoPhone <${user}>`;
  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

  const attachments = [
    { filename: `devis_${opts.quoteNumber}.pdf`, content: Buffer.from(opts.quoteBytes), contentType: "application/pdf" },
    ...(opts.contractBytes ? [{ filename: `contrat_${opts.quoteNumber}.pdf`, content: Buffer.from(opts.contractBytes), contentType: "application/pdf" }] : []),
  ];

  const subject = `Votre devis RecoPhone – ${opts.quoteNumber}`;
  const html = `
    <p>Bonjour ${opts.client.firstName},</p>
    <p>Merci pour votre demande. Vous trouverez ci-joint votre <strong>devis</strong>${opts.contractBytes ? " et le <strong>contrat</strong>" : ""}.</p>
    <p>Liens de téléchargement :</p>
    <ul>
      <li>Devis : <a href="${opts.quoteUrl}">${opts.quoteUrl}</a></li>
      ${opts.contractUrl ? `<li>Contrat : <a href="${opts.contractUrl}">${opts.contractUrl}</a></li>` : ""}
    </ul>
    <p>Nous restons à votre disposition.<br/>${opts.company.name}</p>
  `;
  const text =
`Bonjour ${opts.client.firstName},

Merci pour votre demande. Vous trouverez ci-joint votre devis${opts.contractBytes ? " et le contrat" : ""}.
Liens de téléchargement :
- Devis : ${opts.quoteUrl}
${opts.contractUrl ? `- Contrat : ${opts.contractUrl}\n` : ""}

Nous restons à votre disposition.
${opts.company.name}`;

  await transporter.sendMail({ from, to: opts.to, subject, html, text, attachments });
}

/* ——— Handler ——— */
export async function POST(req: NextRequest) {
  try {
    const { quote, contract, payInTwo } = (await req.json()) as { quote: QuotePayload; contract?: ContractPayload | null; payInTwo: boolean; };

    const lastUpper = noAccentsUpper(quote.client.lastName || "CLIENT").replace(/\s+/g, " ").trim(); // COLLIN
    const refCompact = compactRef(quote.quoteNumber); // Q202508201234...

    // Dossier & fichiers selon ta convention
    const folderName = `${lastUpper}_${refCompact} DEVIS`;
    const quoteOut = `${lastUpper}_DEVIS${refCompact}.pdf`;
    const contractOut = `${lastUpper}_CONTRAT${refCompact}.pdf`;

    // Génère
    const quoteBytes = await buildQuotePdfBuffer(quote);
    const contractBytes = payInTwo && contract ? await buildContractPdfBuffer(contract) : null;

    // Upload (URL courte renvoyée par o2switch)
    const quoteUrl = await uploadToO2Switch(quoteBytes, quoteOut, folderName);
    let contractUrl: string | null = null;
    if (contractBytes) {
      contractUrl = await uploadToO2Switch(contractBytes, contractOut, folderName);
    }

    // Email
    await sendConfirmationEmail({
      to: quote.client.email,
      quoteNumber: quote.quoteNumber,
      quoteBytes,
      contractBytes,
      quoteUrl,
      contractUrl,
      company: quote.company,
      client: quote.client,
    });

    return NextResponse.json({ ok: true, quoteUrl, contractUrl }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "finish failed" }, { status: 500 });
  }
}
