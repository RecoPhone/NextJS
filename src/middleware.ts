// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminJWT, AUTH_COOKIE_NAME } from "@/lib/auth";

export const config = {
  matcher: ["/administrateur/:path*", "/api/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (pathname === "/administrateur/login" || pathname === "/administrateur/login/") {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/administrateur/login", url.origin));
  }

  try {
    await verifyAdminJWT(token);
    return NextResponse.next();
  } catch {
    const res = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/administrateur/login", url.origin));
    res.cookies.delete(AUTH_COOKIE_NAME);
    return res;
  }
}
