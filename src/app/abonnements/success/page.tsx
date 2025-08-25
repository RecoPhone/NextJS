// src/app/abonnements/success/page.tsx
export const dynamic = "force-dynamic";

import SuccessClient from "../SuccessClient";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const raw = sp["session_id"] ?? sp["sessionId"];
  const sessionId =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";

  return <SuccessClient sessionId={sessionId} />;
}
