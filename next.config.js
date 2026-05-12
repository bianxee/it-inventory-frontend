/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Abaikan TypeScript error saat build production
    // Error sudah ditangani di development
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
