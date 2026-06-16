import { getSiteSettings } from "@/modules/site/ui/site-settings";
import { join } from "path";
import { readFile } from "fs/promises";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const settings = await getSiteSettings();

    if (settings.faviconUrl) {
        try {
            // faviconUrl may be a relative path (e.g. /api/media/proxy?url=...)
            // so we resolve it against the request origin to get an absolute URL
            const faviconAbsoluteUrl = settings.faviconUrl.startsWith("http")
                ? settings.faviconUrl
                : new URL(settings.faviconUrl, new URL(request.url).origin).toString();
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
