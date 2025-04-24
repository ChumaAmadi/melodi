/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'wrapped-images.spotifycdn.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent-lhr6-1.xx.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'scontent-lhr6-2.xx.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: '**.xx.fbcdn.net',
      },
    ],
    domains: [
      'i.scdn.co', 
      'mosaic.scdn.co', 
      'platform-lookaside.fbsbx.com', 
      'i.discogs.com',
      'scontent-lhr6-1.xx.fbcdn.net',
      'scontent-lhr6-2.xx.fbcdn.net'
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        module: false,
        os: false,
      };
    }
    return config;
  },
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000',
  },
};

module.exports = nextConfig; 