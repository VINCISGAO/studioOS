import type { NextConfig } from "next";

function marketingHeroVideoUpstream(): string | null {
  const raw = process.env.MARKETING_CDN_UPSTREAM?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/u, "");
}

const nextConfig: NextConfig = {
  // MVP deploy: don't block production on legacy strict-type gaps; run `npm run typecheck` locally to fix.
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "320mb"
    },
    // Avoid race where page-data collection starts before some app routes finish compiling
    // (PageNotFoundError: Cannot find module for page /admin/* during `next build`).
    webpackBuildWorker: false
  },
  images: {
    localPatterns: [
      { pathname: "/api/home-hero-studio" },
      { pathname: "/images/**" }
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "**.supabase.co"
      },
      {
        protocol: "https",
        hostname: "img.youtube.com"
      },
      {
        protocol: "https",
        hostname: "vumbnail.com"
      }
    ]
  },
  async rewrites() {
    const upstream = marketingHeroVideoUpstream();
    if (!upstream) return [];
    return [
      {
        source: "/videos/home/hero/:path*",
        destination: `${upstream}/videos/home/hero/:path*`
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      }
    ];
  },
  serverExternalPackages: ["@prisma/client", "bullmq", "ioredis"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false
      };
    }
    return config;
  }
};

export default nextConfig;
