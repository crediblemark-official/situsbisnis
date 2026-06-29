import { getSiteSettings } from "@/modules/site/ui/site-settings";
import { join } from "path";
import { readFile } from "fs/promises";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const settings = await getSiteSettings();
    if (settings.faviconUrl) {
        try {
            let faviconAbsoluteUrl = settings.faviconUrl;

            if (!faviconAbsoluteUrl.startsWith("http")) {
                // Jika URL menggunakan media proxy, ekstrak URL target aslinya agar di-fetch langsung ke upstream
                if (faviconAbsoluteUrl.startsWith("/api/media/proxy")) {
                    try {
                        const urlObj = new URL(faviconAbsoluteUrl, "http://localhost");
                        const targetUrl = urlObj.searchParams.get("url");
                        if (targetUrl && targetUrl.startsWith("http")) {
                            faviconAbsoluteUrl = targetUrl;
                        }
                    } catch (e) {
                        console.error("[Favicon Route] Gagal mengurai URL media proxy:", e);
                    }
                }
            }

            // Jika masih berupa path relatif, gunakan Host/Forwarded header tepercaya untuk resolusi origin (menghindari 0.0.0.0)
            if (!faviconAbsoluteUrl.startsWith("http")) {
                const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
                const proto = request.headers.get("x-forwarded-proto") || "http";
                const origin = `${proto}://${host}`;
                faviconAbsoluteUrl = new URL(faviconAbsoluteUrl, origin).toString();
            }

            const res = await fetch(faviconAbsoluteUrl);
            if (res.ok) {
                const blob = await res.blob();
                const contentType = res.headers.get("Content-Type") || "image/vnd.microsoft.icon";
                return new Response(blob, {
                    headers: {
                        "Content-Type": contentType,
                        "Cache-Control": "public, max-age=86400",
                    },
                });
            }
        } catch (error) {
            console.error("[Favicon Route] Failed to fetch external favicon:", error);
        }
    }

    // Serve default favicon.ico from filesystem as fallback
    try {
        const filePath = join(process.cwd(), "public/favicon-default.ico");
        const buffer = await readFile(filePath);
        return new Response(buffer, {
            headers: {
                "Content-Type": "image/x-icon",
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch (error) {
        console.error("[Favicon Route] Failed to read fallback favicon:", error);
        return new Response("Not Found", { status: 404 });
    }
}
