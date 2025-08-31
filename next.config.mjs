/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',                 // <- indispensable pour packager les deps
  eslint: { ignoreDuringBuilds: true }, // ok en prod
  reactStrictMode: true,
};
export default nextConfig;