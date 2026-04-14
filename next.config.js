/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'jszip', 'jsonrepair'],
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
};

module.exports = nextConfig;
