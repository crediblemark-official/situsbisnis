import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Auth Bridge - Step 1: Generate Token & Redirect
 * 
 * Usage: /api/auth/bridge?target=http://tokokue.localhost:3000/dashboard
 * 
 * Flow:
 * 1. Admin clicks "Manage Site" in admin panel
 * 2. Link points to /api/auth/bridge?target=<subdomain-url>
 * 3. This endpoint verifies the admin is logged in
 * 4. Creates a short-lived HMAC-signed bridge token
 * 5. Redirects to the subdomain's /api/auth/bridge/accept endpoint
 */
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        const host = req.headers.get("host") || "localhost:3000";
        const protocol = req.headers.get("x-forwarded-proto") === "https" ? "https" : "http";
        return NextResponse.redirect(new URL("/login", `${protocol}://${host}`));
    }

    const target = req.nextUrl.searchParams.get("target");
    if (!target) {
        return NextResponse.json({ error: "Missing target parameter" }, { status: 400 });
    }

    // Validate target URL
    let targetUrl: URL;
    try {
        targetUrl = new URL(target);
    } catch {
        return NextResponse.json({ error: "Invalid target URL" }, { status: 400 });
    }

    // Create a short-lived bridge token (5 min expiry)
    const secret = process.env.NEXTAUTH_SECRET!;
    const payload = JSON.stringify({
        userId: session.user.id,
        exp: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const bridgeToken = Buffer.from(payload).toString("base64url") + "." + signature;

    // Build the accept URL on the target subdomain
    const acceptUrl = new URL("/api/auth/bridge/accept", targetUrl.origin);
    acceptUrl.searchParams.set("token", bridgeToken);
    acceptUrl.searchParams.set("redirect", targetUrl.pathname + targetUrl.search);

    return NextResponse.redirect(acceptUrl.toString());
}
