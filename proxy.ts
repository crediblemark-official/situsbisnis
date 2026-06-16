import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getRootDomain, getProtocol } from "./lib/domains/utils";
import { getPremiumRedirectHtml } from "./lib/domains/templates";
import { rateLimitMiddleware } from "./lib/core/rate-limit";

export const config = {
  matcher: [
    // Kecualikan berkas statis dengan ekstensi (seperti .svg, .png, .jpg, dll.) di folder mana pun
    "/((?!_next/|_static/|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  let hostname = req.headers.get("host") || "";

  // Rate limiting untuk rute API
  const rateLimitResponse = await rateLimitMiddleware(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // 1. Paksa HTTPS di produksi (dengan Cloudflare & Traefik fail-safe untuk mencegah redirect loop)
  const isHttps = req.headers.get("x-forwarded-proto") === "https" || 
                  req.headers.get("cf-visitor")?.includes("https");

  // Jangan paksa HTTPS untuk request localhost/internal agar fetch lokal Next.js Image Optimizer tidak terganggu
  let isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");

  if (process.env.NODE_ENV === "production" && !isHttps && !isLocalhost) {
    return NextResponse.redirect(`https://${hostname}${req.nextUrl.pathname}`, 301);
  }


  // 2. Tenant Detection
  const rootDomain = getRootDomain(hostname);
  const protocol = getProtocol(hostname);
  
  // For comparison, we use rootDomain without port if it's NOT localhost
  const rootDomainOnly = rootDomain.includes("localhost") ? rootDomain : rootDomain.split(":")[0];
  const hostOnly = hostname.includes("localhost") ? hostname : hostname.split(":")[0];
  
  const subdomain = hostOnly.endsWith(`.${rootDomainOnly}`)
    ? hostOnly.replace(`.${rootDomainOnly}`, "")
    : null;

  // 3. Handle reserved subdomains and system routes
  const pathname = url.pathname;
  
  // Indonesian Aliases
  if (pathname === "/masuk") {
      return NextResponse.redirect(new URL("/login", req.url), { status: 301 });
  }
  if (pathname === "/daftar") {
      return NextResponse.redirect(new URL("/register", req.url), { status: 301 });
  }
  
  // Platform-level routes that MUST be on root domain
  const isPlatformRoute = (
      pathname.startsWith("/login") || 
      pathname.startsWith("/register") || 
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/admin")
  ) && !pathname.startsWith("/dashboard") && !pathname.startsWith("/credbuild");

  isLocalhost = isLocalhost || hostOnly.includes("localhost") || rootDomainOnly.includes("localhost");
  const isPlatformHost = hostOnly === rootDomainOnly || hostOnly === `www.${rootDomainOnly}` || hostOnly === `admin.${rootDomainOnly}`;

  // Force absolute root domain for platform-level routes if on tenant domain (subdomain or custom domain)
  if (!isPlatformHost && isPlatformRoute) {
      const targetUrl = `${protocol}://${rootDomain}${pathname}${url.search}`;
      
      // Prevent Next.js Dev Server from stripping localhost origin in redirects (causing loops)
      if (isLocalhost) {
          return new Response(
              getPremiumRedirectHtml(targetUrl, "Mengalihkan Akses", "Menuju Panel Utama..."),
              {
                  status: 200,
                  headers: {
                      "Content-Type": "text/html; charset=utf-8",
                  },
              }
          );
      }

      return new Response(null, {
          status: 308,
          headers: {
              Location: targetUrl,
          },
      });
  }

  // Handle /dashboard -> /dashboard/sites ONLY on root domain
  const isRootDomain = hostOnly === rootDomainOnly;
  if (isRootDomain && (pathname === "/dashboard" || pathname === "/dashboard/")) {
      return NextResponse.redirect(new URL("/dashboard/sites", req.url), { status: 308 });
  }

  if (subdomain === "admin") {
      const targetUrl = `${protocol}://${rootDomain}/admin`;
      
      // Prevent Next.js Dev Server from stripping localhost origin in redirects (causing loops)
      if (isLocalhost) {
          return new Response(
              getPremiumRedirectHtml(targetUrl, "Mengalihkan Admin", "Menuju Portal Administrasi..."),
              {
                  status: 200,
                  headers: {
                      "Content-Type": "text/html; charset=utf-8",
                  },
              }
          );
      }

      return new Response(null, {
          status: 308,
          headers: {
              Location: targetUrl,
          },
      });
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-url", req.nextUrl.pathname);

  let targetPath = pathname;
  let isRewrite = false;

  const isTenant = !isPlatformHost;

  if (isTenant) {
    // Jika ada subdomain (misal: tenant.situsbisnis.com), gunakan subdomain itu.
    // Jika menggunakan custom domain (misal: tokosaya.com), gunakan hostOnly sebagai pengenal tenant.
    const tenantIdentifier = (subdomain && subdomain !== "www" && subdomain !== "admin") ? subdomain : hostOnly;
    requestHeaders.set("x-tenant-subdomain", tenantIdentifier);
    
    // Tulis ulang rute privasi dan ketentuan secara internal agar diproses oleh catch-all tenant
    if (pathname === "/privacy") {
      targetPath = "/legal-privacy";
      isRewrite = true;
    } else if (pathname === "/terms") {
      targetPath = "/legal-terms";
      isRewrite = true;
    }
  }

  // 4. Buat Response dengan Header yang Dimodifikasi
  const response = isRewrite
    ? NextResponse.rewrite(new URL(targetPath, req.url), {
        request: {
          headers: requestHeaders,
        },
      })
    : NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

  // 5. Add Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  // 5b. Cache Control untuk Platform Landing Page (Root Domain '/')
  // Karena navbar menggunakan client-side session hydration (useSession), HTML yang di-render di server
  // adalah identik untuk semua user. Ini aman di-cache oleh CDN (seperti Cloudflare) untuk menyerap load traffic.
  if (isRootDomain && pathname === "/" && !url.searchParams.get("ref")) {
    response.headers.set("Cache-Control", "public, max-age=10, s-maxage=60, stale-while-revalidate=30");
  }

  // 6. Referral Tracking
  const ref = url.searchParams.get("ref");
  if (ref) {
      response.cookies.set("situsbisnis_ref_code", ref, {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: "/",
      });
  }

  return response;
}
