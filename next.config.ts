/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',                 // minimise les deps en prod
  images: { unoptimized: true },        // évite sharp sur mutualisé
  experimental: {
    outputFileTracingIncludes: {
      '/**/*': ['./public/**/*']
    }
  }
};
module.exports = nextConfig;