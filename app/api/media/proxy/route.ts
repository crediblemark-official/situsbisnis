import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { getR2Settings } from "@/lib/media/r2";

export const dynamic = "force-dynamic";

// Simple file-based cache for proxy to fix slow upstream LCP
const getCacheDir = () => {
    return path.join(process.cwd(), ".next", "cache", "proxy");
};

const CACHE_DIR = getCacheDir();

let _canCache: boolean | null = null;
function checkCacheSupport() {
    if (_canCache !== null) return _canCache;
    try {
        if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
        const testFile = path.join(CACHE_DIR, ".test-write");
        fs.writeFileSync(testFile, "test");
        fs.unlinkSync(testFile);
        _canCache = true;
    } catch (e) {
        console.warn("Proxy cache disabled: Directory not writable", CACHE_DIR, e);
        _canCache = false;
    }
    return _canCache;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const width = searchParams.get("w") ? parseInt(searchParams.get("w")!) : null;
    const height = searchParams.get("h") ? parseInt(searchParams.get("h")!) : null;
    const quality = searchParams.get("q") ? parseInt(searchParams.get("q")!) : 75;

    if (!url) return new NextResponse("Missing URL", { status: 400 });

    // 0. Security Check
    const settings = await getR2Settings();
    const allowedDomains = ["file.situsbisnis.com"];
    if (settings.publicDomain) {
        const domainOnly = settings.publicDomain.replace(/^https?:\/\//, "").split("/")[0];
        if (domainOnly) {
            allowedDomains.push(domainOnly);
        }
    }

    const targetUrl = url.replace(/^https?:\/\//, "");
    const isAllowed = allowedDomains.some((domain) => targetUrl.startsWith(domain));

    if (!isAllowed) {
        console.warn(`Blocked unauthorized proxy request for: ${url}`);
        return new NextResponse("Unauthorized proxy source", { status: 403 });
    }

    // 1. Check Cache (Include transformation params in hash)
    const isCacheEnabled = checkCacheSupport();
    const cacheKey = `${url}|w=${width}|h=${height}|q=${quality}`;
    const urlHash = crypto.createHash("sha1").update(cacheKey).digest("hex");
    const cachePath = path.join(CACHE_DIR, urlHash);
    const metaPath = cachePath + ".json";

    if (isCacheEnabled && fs.existsSync(cachePath) && fs.existsSync(metaPath)) {
        try {
            const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
            const fileBuffer = fs.readFileSync(cachePath);
            const headers = new Headers();
            headers.set("Content-Type", meta.contentType || "image/webp");
            headers.set("Content-Length", fileBuffer.length.toString());
            headers.set("Cache-Control", "public, max-age=31536000, immutable");
            headers.set("X-Proxy-Cache", "HIT");
            headers.set("X-Proxy-Transformed", (width || height) ? "TRUE" : "FALSE");
            return new NextResponse(fileBuffer, { headers });
        } catch (_e) {
            console.error("Cache read error:", _e);
        }
    }

    try {
        const response = await fetch(url, { headers: { "User-Agent": "NEXT-CMS-Proxy/1.0" } });
        if (!response.ok) {
            // Graceful fallback for missing favicons to keep developer consoles clean
            if (response.status === 404 && (url.toLowerCase().includes("favicon") || url.toLowerCase().endsWith(".ico"))) {
                const host = req.headers.get("host") || "localhost:3000";
                const protocol = req.headers.get("x-forwarded-proto") === "https" ? "https" : "http";
                return NextResponse.redirect(new URL("/favicon.ico", `${protocol}://${host}`));
            }
            return new NextResponse(`Failed to fetch upstream: ${response.status}`, { status: response.status });
        }

        const contentType = response.headers.get("content-type");
        const arrayBuffer = await response.arrayBuffer();
        let buffer: any = Buffer.from(arrayBuffer);
        let finalContentType = contentType || "application/octet-stream";

        // 2. Transform with Sharp if it's an image
        if (contentType?.startsWith("image/") && (width || height || quality < 100)) {
            try {
                let transformer = sharp(buffer);
                
                // Auto-rotate based on EXIF
                transformer = transformer.rotate();

                if (width || height) {
                    transformer = transformer.resize(width, height, {
                        fit: "cover",
                        withoutEnlargement: true
                    });
                }

                // Default to WebP for better compression
                if (contentType !== "image/gif") {
                    transformer = transformer.webp({ quality });
                    finalContentType = "image/webp";
                }

                buffer = (await transformer.toBuffer()) as any;
            } catch (sharpError) {
                console.error("Sharp transformation failed, serving original:", sharpError);
            }
        }

        // 3. Save to cache
        if (isCacheEnabled) {
            fs.writeFile(cachePath, buffer, (err) => {
                if (!err) fs.writeFile(metaPath, JSON.stringify({ contentType: finalContentType }), () => {});
            });
        }

        const headers = new Headers();
        headers.set("Content-Type", finalContentType);
        headers.set("Content-Length", buffer.length.toString());
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("X-Proxy-Cache", "MISS");
        
        return new NextResponse(buffer, { status: 200, headers });
    } catch (error: any) {
        console.error(`Proxy error for ${url}:`, error.message);
        return new NextResponse(`Proxy error: ${error.message}`, { status: 500 });
    }
}
