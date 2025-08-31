export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Client, type AccessOptions, type FileInfo } from "basic-ftp";

function join(base: string, rel: string) {
  return (base.replace(/\/+$/, "") + "/" + rel.replace(/^\/+/, "")).replace(/\/+/g, "/");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rel = searchParams.get("client");
    if (!rel) return NextResponse.json({ ok: false, error: "MISSING_CLIENT" }, { status: 400 });

    const host = process.env.FTP_HOST ?? "";
    const port = Number(process.env.FTP_PORT ?? 21);
    const user = process.env.FTP_USER ?? "";
    const password = process.env.FTP_PASS ?? "";
    const secure = String(process.env.FTP_SECURE ?? "true").toLowerCase() === "true";
    const base = process.env.FTP_BASE_DIR ?? "/";

    if (!host || !user || !password) {
      return NextResponse.json({ ok: false, error: "FTP config incomplète" }, { status: 500 });
    }

    const access: AccessOptions = { host, port, user, password, secure, secureOptions: { rejectUnauthorized: false } };
    const c = new Client(30_000);
    await c.access(access);

    const target = join(base, rel);

    let mode = "cd+list";
    let list: FileInfo[] = [];
    try {
      await c.cd(target);
      list = await c.list();
    } catch {
      mode = "list(path)";
      list = await c.list(target);
    }
    const entries = list.map((e) => ({
      name: e.name,
      rawType: e.type,
      isDirectory: (e as any).isDirectory ?? null,
      size: e.size ?? null,
      modifiedAt: (e as any).modifiedAt instanceof Date ? (e as any).modifiedAt.toISOString() : null,
    }));

    c.close();
    return NextResponse.json({ ok: true, target, mode, entries });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
