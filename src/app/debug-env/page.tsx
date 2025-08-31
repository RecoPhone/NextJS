import { NextResponse } from 'next/server';

export async function GET() {
  const keys = [
    'NEXT_PUBLIC_SITE_URL',
    'FONEDAY_API_URL',
    'FONEDAY_API_TOKEN',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];
  const out: Record<string, string | null> = {};
  for (const k of keys) {
    const v = process.env[k];
    out[k] = v ? (k.startsWith('NEXT_PUBLIC_') ? v : '***') : null;
  }
  return NextResponse.json(out);
}
