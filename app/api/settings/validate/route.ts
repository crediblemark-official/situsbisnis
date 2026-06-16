import { NextResponse } from "next/server";
import { getApiContext, apiError } from "@/lib/api/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        // Enforce security: require active authenticated session for admin/owner/editor
        const { error, status } = await getApiContext(["admin", "owner", "editor"], { requireSite: false });
        if (error) {
            return apiError(error, status);
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");
        const value = searchParams.get("value")?.trim();

        if (!type || !value) {
            return NextResponse.json({ valid: false, error: "Missing type or value parameter" }, { status: 400 });
        }

        if (type === "gtm") {
            // Regex sanity check first
            if (!/^GTM-[A-Z0-9]{4,8}$/.test(value)) {
                return NextResponse.json({ valid: false });
            }

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const res = await fetch(`https://www.googletagmanager.com/gtm.js?id=${value}`, {
                    method: "HEAD",
                    signal: controller.signal,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                    }
                });

                clearTimeout(timeoutId);

                // GTM returns 200 if container is valid and published, 404 if invalid/unpublished
                return NextResponse.json({ valid: res.status === 200 });
            } catch (err) {
                console.warn("[ValidateGTM:FetchError]", err);
                return NextResponse.json({ valid: false });
            }
        }

        return NextResponse.json({ valid: false, error: "Unsupported validation type" }, { status: 400 });
    } catch (err) {
        console.error("[ValidateRouteError]", err);
        return apiError("Internal server error", 500);
    }
}
