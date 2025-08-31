// src/app/api/admin/storage/clients/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { listClients } from "@/lib/storage";

export async function GET() {
  try {
    const data = (await listClients()).filter(c => !c.client.startsWith(".")); // masque .ftpquota
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("[storage/clients]", e);
    return NextResponse.json({ ok: false, error: "STORAGE_ERROR" }, { status: 500 });
  }
}
