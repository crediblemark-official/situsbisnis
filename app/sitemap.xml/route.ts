import { db } from "@/lib/core/db";
import { getSiteId } from "@/lib/domains/tenant";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const siteId = await getSiteId();
        const headersList = await headers();
        const host = headersList.get("host");
        
        // Fallback to env URL if host is missing
        const protocol = host?.includes("localhost") ? "http" : "https";
        const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

        // Fetch published pages for the current site
        const pagesData = await db.credBuildPage.findMany({
            where: { 
                isPublished: true,
                ...(siteId ? { siteId } : {}) // Filter by site if we have a siteId
            },
            orderBy: { updatedAt: 'desc' },
            select: {
                path: true,
                updatedAt: true
            }
        });

        const sitemapEntries = [
            // Static routes
            {
                url: baseUrl,
                lastModified: new Date().toISOString(),
                changeFrequency: 'daily',
                priority: 1.0,
            },
            // Dynamic pages
            ...pagesData
                .filter((page) => page.path !== "/")
                .map((page) => ({
                    url: `${baseUrl}${page.path.startsWith("/") ? page.path : `/${page.path}`}`,
                    lastModified: page.updatedAt.toISOString(),
                    changeFrequency: 'weekly',
                    priority: 0.8,
                })),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
    .map(
        (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join("\n")}
</urlset>`;

        return new Response(xml, {
            headers: {
                "Content-Type": "application/xml",
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=5900",
            },
        });
    } catch (error) {
        console.error("[Sitemap] Error generating sitemap:", error);
        
        // Return a minimal sitemap on error instead of 500
        // This ensures the site remains crawlable even if the DB is temporarily down
        const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${fallbackUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
        
        return new Response(xml, {
            headers: {
                "Content-Type": "application/xml",
                "Cache-Control": "no-store",
            },
        });
    }
}
