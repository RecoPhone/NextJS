// src/app/api/admin/storage/download/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { readFileBinary } from "@/lib/storage";
import path from "path";

function guessType(p: string) {
  const ext = path.extname(p).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".json") return "application/json";
  if (ext === ".txt") return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const relPathParam = searchParams.get("path");
  const asAttachment = searchParams.get("download") === "1";

  if (!relPathParam) {
    return NextResponse.json({ ok: false, error: "MISSING_PATH" }, { status: 400 });
  }
  const relPath: string = relPathParam;

  try {
    const body: ArrayBuffer = await readFileBinary(relPath);
    const filename = path.basename(relPath);
    const contentType = guessType(filename);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `${asAttachment ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(
          filename
        )}`,
      },
    });
  } catch (e) {
    console.error("[storage/download]", e);
    return NextResponse.json({ ok: false, error: "STORAGE_ERROR" }, { status: 500 });
  }
}
