/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // PWA Support
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },

  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Image optimization
  images: {
    domains: [
      'supabase.co',
      'your-cdn-domain.com'
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Rewrites for multi-tenant subdomains
  async rewrites() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: '(?<tenant>.*).yourplatform.com',
          },
        ],
        destination: '/tenant/:tenant/:path*',
      },
    ];
  },

  // API routes config
  async redirects() {
    return [];
  },
}

module.exports = nextConfig;
