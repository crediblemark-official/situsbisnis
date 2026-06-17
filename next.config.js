import { withSentryConfig } from "@sentry/nextjs";
import path from "path";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const appHostname = new URL(appUrl).hostname;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Auth routes
      { source: '/api/user/:path*', destination: '/api/auth/user/:path*' },
      { source: '/api/users/:path*', destination: '/api/auth/users/:path*' },
      { source: '/api/profile/:path*', destination: '/api/auth/profile/:path*' },
      { source: '/api/affiliate/:path*', destination: '/api/auth/affiliate/:path*' },
      { source: '/api/onboarding/:path*', destination: '/api/auth/onboarding/:path*' },
      
      // Domain routes
      { source: '/api/domains/:path*', destination: '/api/domain/domains/:path*' },
      
      // Financial routes
      { source: '/api/admin/coupons/:path*', destination: '/api/financial/coupons/:path*' },
      { source: '/api/admin/withdrawals/:path*', destination: '/api/financial/withdrawals/:path*' },
      
      // Infrastructure routes
      { source: '/api/admin/backup/:path*', destination: '/api/infrastructure/backup/:path*' },
      { source: '/api/admin/sites/:path*', destination: '/api/infrastructure/sites/:path*' },
      
      // Media routes (DEPRECATED: Gunakan Server Actions untuk mutasi)
      { source: '/api/gallery/:path*', destination: '/api/media/gallery/:path*' },
      { source: '/api/portfolios/:path*', destination: '/api/media/portfolios/:path*' },
      
      // Order routes
      { source: '/api/orders/:path*', destination: '/api/order/orders/:path*' },
      
      // Page routes
      { source: '/api/pages/:path*', destination: '/api/page/pages/:path*' },
      { source: '/api/menus/:path*', destination: '/api/page/menus/:path*' },
      { source: '/api/credbuild/:path*', destination: '/api/page/credbuild/:path*' },
      { source: '/api/ai/:path*', destination: '/api/page/ai/:path*' },
      
      // Payment routes
      { source: '/api/billing/:path*', destination: '/api/payment/billing/:path*' },
      { source: '/api/admin/transactions/:path*', destination: '/api/payment/transactions/:path*' },
      
      // Post routes (DEPRECATED: Gunakan Server Actions untuk mutasi)
      { source: '/api/testimonials/:path*', destination: '/api/post/testimonials/:path*' },
      { source: '/api/search/:path*', destination: '/api/post/search/:path*' },
      
      // Shared routes
      { source: '/api/openapi/:path*', destination: '/api/shared/openapi/:path*' },
      
      // Site routes (DEPRECATED: Gunakan Server Actions untuk mutasi)
      { source: '/api/settings/:path*', destination: '/api/site/settings/:path*' },
      { source: '/api/analytics/:path*', destination: '/api/site/analytics/:path*' },
      { source: '/api/contact/:path*', destination: '/api/site/contact/:path*' },
      { source: '/api/health/:path*', destination: '/api/site/health/:path*' },
      
      // Subscription routes
      { source: '/api/admin/plans/:path*', destination: '/api/subscription/plans/:path*' },
      { source: '/api/admin/subscriptions/:path*', destination: '/api/subscription/subscriptions/:path*' },
      { source: '/api/admin/settings/:path*', destination: '/api/subscription/settings/:path*' },
      { source: '/api/cron/:path*', destination: '/api/subscription/cron/:path*' },
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