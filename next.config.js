import { withSentryConfig } from "@sentry/nextjs";
import path from "path";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const appHostname = new URL(appUrl).hostname;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Webhook Pembayaran Duitku (Tetap Dipertahankan)
      { source: '/api/billing/webhook/duitku', destination: '/api/payment/billing/webhook/duitku' },
      
      // Order routes (Public Visitor Checkout)
      { source: '/api/orders/:path*', destination: '/api/order/orders/:path*' },
      
      // Post routes (Public Visitor Testimonials & Search)
      { source: '/api/testimonials/:path*', destination: '/api/post/testimonials/:path*' },
      { source: '/api/search/:path*', destination: '/api/post/search/:path*' },
      
      // Shared / Utility routes
      { source: '/api/openapi/:path*', destination: '/api/shared/openapi/:path*' },
      
      // Site routes (Public Health Check & Contact)
      { source: '/api/contact/:path*', destination: '/api/site/contact/:path*' },
      { source: '/api/health/:path*', destination: '/api/site/health/:path*' },
      
      // Subscription cron check route
      { source: '/api/cron/:path*', destination: '/api/subscription/cron/:path*' },
      
      // Page editor helper routes
      { source: '/api/credbuild/:path*', destination: '/api/page/credbuild/:path*' },
      { source: '/api/ai/:path*', destination: '/api/page/ai/:path*' },
    ];
  },
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ["lucide-react", "@crediblemark/build-ui", "@crediblemark/buayar", "@crediblemark/build-ai", "@crediblemark/starsender"],
  typescript: {
    // Type checking is enforced in production builds
  },
  images: {
    // Aktifkan optimasi — sharp sudah terinstall di package.json
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    localPatterns: [
      {
        pathname: '/**',
      },
    ],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "cdn.univedpress.id",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "http",
        hostname: appHostname,
      },
      {
        protocol: "https",
        hostname: "file.situsbisnis.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: appHostname,
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  productionBrowserSourceMaps: false,
  serverExternalPackages: ["@prisma/client", "ioredis"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@crediblemark/build",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@aws-sdk/client-s3",
      "zod",
      "clsx",
      "tailwind-merge",
      "react-hot-toast"
    ],
    // Naikkan stale time agar browser tidak terlalu sering re-fetch
    staleTimes: { dynamic: 300, static: 3600 },
    webpackMemoryOptimizations: true,
    serverSourceMaps: false
  },
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      "lucide-react/dynamicIconImports": "lucide-react/dynamicIconImports.mjs",
    },
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ignored: ["**/node_modules", "**/public", "**/.git", "**/.next"],
    };

    config.resolve.alias = {
      ...config.resolve.alias,
      '@crediblemark/build': path.resolve('./node_modules/@crediblemark/build'),
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
      config.resolve.alias['react'] = path.resolve('./node_modules/react');
      config.resolve.alias['react-dom'] = path.resolve('./node_modules/react-dom');
    }

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "",
  project: process.env.SENTRY_PROJECT || "",
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
});