import { getApiContext, apiError } from "@/lib/api/utils";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/modules/shared/core/db";

const ALLOWED_HOSTNAMES = new Set([
    "localhost",
    "127.0.0.1",
]);

async function isAllowedTarget(hostname: string, rootDomain: string): Promise<boolean> {
    if (ALLOWED_HOSTNAMES.has(hostname)) return true;
    if (hostname === rootDomain) return true;
    if (hostname.endsWith(`.${rootDomain}`)) return true;

    // Periksa database untuk custom domain yang terverifikasi
    const site = await db.site.findUnique({
        where: {
            customDomain: hostname,
        },
        select: {
            customDomainVerified: true,
        },
    });

    return !!site?.customDomainVerified;
}

export async function GET(req: NextRequest) {
    const { session, error: authError, status: authStatus } = await getApiContext(undefined, { requireSite: false });

    if (authError || !session?.user?.id) {
        const host = req.headers.get("host") || "localhost:3000";
        const protocol = req.headers.get("x-forwarded-proto") === "https" ? "https" : "http";
        return NextResponse.redirect(new URL("/login", `${protocol}://${host}`));
    }

    const target = req.nextUrl.searchParams.get("target");
    if (!target) {
        return apiError("Missing target parameter", 400);
    }

    let targetUrl: URL;
    try {
        targetUrl = new URL(target);
    } catch {
        return apiError("Invalid target URL", 400);
    }

    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "situsbisnis.com")
        .replace(/^https?:\/\//, "").split(":")[0];
    const targetHost = targetUrl.hostname;

    if (!isAllowedTarget(targetHost, rootDomain)) {
        return apiError("Invalid target domain", 400);
    }

    const secret = process.env.NEXTAUTH_SECRET!;
    const payload = JSON.stringify({
        userId: session.user.id,
        exp: Date.now() + 5 * 60 * 1000,
    });

    const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const bridgeToken = Buffer.from(payload).toString("base64url") + "." + signature;

    const acceptUrl = new URL("/api/auth/bridge/accept", targetUrl.origin);
    acceptUrl.searchParams.set("token", bridgeToken);
    acceptUrl.searchParams.set("redirect", targetUrl.pathname + targetUrl.search);

    return NextResponse.redirect(acceptUrl.toString());
}

