/** @type {import('next').NextConfig} */
const API_PROXY_URL = process.env.API_PROXY_URL || 'http://localhost:5000';

const nextConfig = {
  reactStrictMode: true,
  // Self-contained output for Docker deploys; harmless on Vercel.
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // Images come from user uploads / remote CDNs with unpredictable hosts.
    // Served as-is; no optimizer network calls needed.
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_PROXY_URL}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${API_PROXY_URL}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
