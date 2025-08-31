// src/app/api/admin/storage/files/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { listFilesUnder } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientParam = searchParams.get("client");
  if (!clientParam) {
    return NextResponse.json({ ok: false, error: "MISSING_CLIENT" }, { status: 400 });
  }
  const client: string = clientParam;
  try {
    console.log("[storage/files] listing for client:", client);
    const files = await listFilesUnder(client);
    // Optionnel: ignorer fichiers cachés
    const visible = files.filter(f => !f.name.startsWith("."));
    return NextResponse.json({ ok: true, data: visible });
  } catch (e) {
    console.error("[storage/files]", e);
    return NextResponse.json({ ok: false, error: "STORAGE_ERROR" }, { status: 500 });
  }
}
