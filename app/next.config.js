/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Configure other settings as needed
  reactStrictMode: true,
  webpack: (config) => {
    // This is needed for WalletConnect compatibility
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  }
};

module.exports = nextConfig;
