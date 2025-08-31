'use client';

export default function DebugEnvPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>Debug Env (client)</h1>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(
          {
            NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
            NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME ?? null,
            NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? null,
            NEXT_PUBLIC_SUPPORT_PHONE: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? null,
            NEXT_PUBLIC_DOWNLOAD_BASE_URL: process.env.NEXT_PUBLIC_DOWNLOAD_BASE_URL ?? null,
          },
          null,
          2
        )}
      </pre>
      <p style={{ marginTop: 12, opacity: 0.7 }}>
        Les variables secrètes n’apparaissent jamais côté client.
      </p>
    </main>
  );
}
