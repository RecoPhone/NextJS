// next.config.js — charge .env*.production au build et expose UNIQUEMENT les clés publiques
const fs = require('fs');
const path = require('path');

const prodEnvPath = path.join(__dirname, '.env.production');
const devEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(prodEnvPath)) {
  require('dotenv').config({ path: prodEnvPath });
} else if (fs.existsSync(devEnvPath)) {
  require('dotenv').config({ path: devEnvPath });
}

/** @type {import('next').NextConfig} */
module.exports = {
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,

  // ⚠️ Ici on N’EXPOSE QUE les variables publiques
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
    NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    NEXT_PUBLIC_SUPPORT_PHONE: process.env.NEXT_PUBLIC_SUPPORT_PHONE,
    NEXT_PUBLIC_DOWNLOAD_BASE_URL: process.env.NEXT_PUBLIC_DOWNLOAD_BASE_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },

  // Si sharp pose souci sur l'hébergeur :
  // images: { unoptimized: true },

  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};
