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
    serverComponentsExternalPackages: ['better-sqlite3', 'pdf-parse', 'jszip', 'jsonrepair'],
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent pdfjs-dist from being bundled server-side (it's browser-only)
      config.externals = config.externals || [];
      config.externals.push('pdfjs-dist');
    }
    return config;
  },
};

module.exports = nextConfig;
