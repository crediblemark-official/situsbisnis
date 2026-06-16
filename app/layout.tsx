import "./styles.css";
import { Providers } from "./providers";
import { Metadata } from "next";
import Script from "next/script";
import { getSiteSettings } from "@/lib/settings/site";
import { getTenant } from "@/lib/domains/tenant";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { getBaseUrl } from "@/lib/domains/utils";
import PixelTracker from "@/components/analytics/PixelTracker";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

export const dynamic = "force-dynamic";

// Base platform font
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap"
});

export async function generateMetadata(): Promise<Metadata> {
  const [settings, headersList] = await Promise.all([
    getSiteSettings(),
    headers()
  ]);

  const host = headersList.get("host");
  const baseUrl = getBaseUrl(host);

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: settings.siteName || "Builder",
      template: settings.seoTitle || `%s - ${settings.siteName || "Builder"}`,
    },
    description: settings.description || "Built with Builder",
    keywords: settings.seoKeywords ? settings.seoKeywords.split(",") : [],
    icons: settings.faviconUrl ? [{ rel: "icon", url: settings.faviconUrl }] : undefined,
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: baseUrl,
      siteName: settings.siteName || "Builder",
      images: settings.seoImage ? [{ url: settings.seoImage }] : undefined,
    },
    verification: {
      google: settings.googleSiteVerificationId || undefined,
    }
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, subdomain, headersList] = await Promise.all([
    getSiteSettings(),
    getTenant(),
    headers()
  ]);

  const host = headersList.get("host");
  const baseUrl = getBaseUrl(host);

  // Determine active font
  const primaryFontName = settings.brandFontPrimary || "Inter";
  const isPlatform = !subdomain || subdomain === "www" || subdomain === "admin";

  const metaPixelId = (settings.metaPixelId || "").trim();
  const isMetaPixelValid = /^[0-9]{13,17}$/.test(metaPixelId);

  const googleAnalyticsId = (settings.googleAnalyticsId || "").trim();
  const isGoogleAnalyticsValid = /^G-[a-zA-Z0-9]{10}$/.test(googleAnalyticsId);

  const googleTagManagerId = (settings.googleTagManagerId || "").trim();
  const isGoogleTagManagerValid = /^GTM-[A-Z0-9]{4,8}$/.test(googleTagManagerId);

  const tiktokPixelId = (settings.tiktokPixelId || "").trim();
  const isTiktokPixelValid = /^[a-zA-Z0-9]{10,25}$/.test(tiktokPixelId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": settings.siteName || "Builder",
    "alternateName": settings.tagline || undefined,
    "url": baseUrl,
    "description": settings.description,
    "publisher": {
      "@type": "Organization",
      "name": settings.siteName || "Builder",
      "logo": {
        "@type": "ImageObject",
        "url": settings.logoUrl || `${baseUrl}/logo.svg`
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="id" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* Preconnect to Font Servers to reduce Latency */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />


        {/* Dynamic Google Font Loading - ONLY loads the needed font for tenants */}
        {!isPlatform && primaryFontName !== "Inter" && (
          <link
            href={`https://fonts.googleapis.com/css2?family=${primaryFontName.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`}
            rel="stylesheet"
          />
        )}
      </head>
      <body className="min-h-screen bg-background font-sans antialiased transition-colors duration-300">
        <Script id="affiliate-tracking" strategy="afterInteractive">
          {`
            // Affiliate tracking
            const urlParams = new URLSearchParams(window.location.search);
            const ref = urlParams.get('ref');
            if (ref) {
              document.cookie = "affiliate_ref=" + ref + "; path=/; max-age=2592000"; // 30 days
            }

            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                if (registrations.length > 0) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                }
              });
            }
          `}
        </Script>
        <Script
          id="ld-json"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          strategy="afterInteractive"
        />

        {/* Apply dynamic CSS variables for branding */}
        <style precedence="default" dangerouslySetInnerHTML={{
          __html: `
            :root {
              --primary: ${settings.brandPrimaryColor || '#0369a1'};
              --font-active: '${primaryFontName}', sans-serif;
            }
            body {
              font-family: var(--font-active), var(--font-inter), sans-serif;
            }
          `
        }} />

        {isGoogleAnalyticsValid && (
          <GoogleAnalytics gaId={googleAnalyticsId} />
        )}

        {isGoogleTagManagerValid && (
          <GoogleTagManager gtmId={googleTagManagerId} />
        )}

        {isMetaPixelValid && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${metaPixelId}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript dangerouslySetInnerHTML={{ 
              __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1" alt="" />` 
            }} />
          </>
        )}

        {isTiktokPixelValid && (
          <Script id="tiktok-pixel" strategy="afterInteractive">
            {`
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                ttq.load('${tiktokPixelId}');
                ttq.page();
              }(window, document, 'ttq');
            `}
          </Script>
        )}

        <Providers>
          {(isMetaPixelValid || isTiktokPixelValid) && (
            <PixelTracker
              metaPixelId={isMetaPixelValid ? metaPixelId : null}
              tiktokPixelId={isTiktokPixelValid ? tiktokPixelId : null}
            />
          )}
          {children}
        </Providers>
      </body>
    </html>
  );
}
