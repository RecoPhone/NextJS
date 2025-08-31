// scripts/check-env.cjs — bloque le build si des NEXT_PUBLIC_* manquent
const fs = require('fs');
const path = require('path');

const envPath = fs.existsSync(path.join(__dirname, '..', '.env.production'))
  ? path.join(__dirname, '..', '.env.production')
  : path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) require('dotenv').config({ path: envPath });

const REQUIRED_AT_BUILD = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_BRAND_NAME',
  'NEXT_PUBLIC_SUPPORT_EMAIL',
  'NEXT_PUBLIC_SUPPORT_PHONE',
  'NEXT_PUBLIC_DOWNLOAD_BASE_URL',
];

const missing = REQUIRED_AT_BUILD.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
if (missing.length) {
  console.error('❌ Variables manquantes pour le BUILD :', missing.join(', '));
  process.exit(1);
} else {
  console.log('✅ Env OK pour build.');
}
