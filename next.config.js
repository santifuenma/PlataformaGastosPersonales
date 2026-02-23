/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 14: mark server-only packages so webpack doesn't try to bundle them
  experimental: {
    serverComponentsExternalPackages: ['googleapis', 'google-auth-library'],
  },
};

module.exports = nextConfig;
