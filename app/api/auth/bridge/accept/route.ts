import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/core/db";
import { encode } from "next-auth/jwt";
import crypto from "crypto";

/**
 * Auth Bridge - Step 2: Accept Token & Create Local Session
 * 
 * Flow:
 * 1. Receives the bridge token from the initiation endpoint
 * 2. Verifies the HMAC signature and expiry
 * 3. Looks up the user from the database
 * 4. Creates a NextAuth-compatible JWT session token
 * 5. Sets the session cookie for the current subdomain
 * 6. Redirects to the intended page
 */
export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");
    const redirect = req.nextUrl.searchParams.get("redirect") || "/dashboard";

    const host = req.headers.get("host") || req.nextUrl.host;
    const protocol = req.headers.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
    const loginRedirectUrl = new URL("/login", `${protocol}://${host}`);

    if (!token) {
        console.error("[BRIDGE] No token provided");
        return NextResponse.redirect(loginRedirectUrl);
    }

    try {
        const secret = process.env.NEXTAUTH_SECRET!;

        // Verify the bridge token
        const parts = token.split(".");
        if (parts.length !== 2) throw new Error("Malformed token");

        const [payloadB64, signature] = parts;
        const payload = Buffer.from(payloadB64, "base64url").toString("utf-8");
        const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");

        if (signature !== expectedSig) {
            throw new Error("Invalid signature");
        }

        const data = JSON.parse(payload);

        if (data.exp < Date.now()) {
            throw new Error("Token expired");
        }

        // Look up user from database
        const user = await db.user.findUnique({
            where: { id: data.userId },
            select: { id: true, name: true, email: true, role: true }
        });

        if (!user) {
            console.error("[BRIDGE] User not found:", data.userId);
            return NextResponse.redirect(loginRedirectUrl);
        }

        // Create a NextAuth-compatible JWT session token
        const sessionToken = await encode({
            token: {
                id: user.id,
                role: user.role,
                name: user.name,
                email: user.email,
                sub: user.id,
            },
            secret,
        });

        // Build redirect URL using the ORIGINAL request hostname (not req.url which may use internal server host)
        const host = req.headers.get("host") || req.nextUrl.host;
        const protocol = req.headers.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
        const redirectUrl = `${protocol}://${host}${redirect}`;

        // Set the session cookie on this subdomain and redirect
        const response = NextResponse.redirect(redirectUrl);
        
        const isProduction = process.env.NODE_ENV === "production";
        const cookieName = isProduction ? "__Secure-next-auth.session-token" : "next-auth.session-token";

        response.cookies.set(cookieName, sessionToken, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: isProduction,
            // No domain = scoped to current hostname (tokokue.localhost)
        });

        console.log("[BRIDGE] Session bridged for:", user.email, "->", host);
        return response;

    } catch (error: any) {
        console.error("[BRIDGE] Verification failed:", error.message);
        return NextResponse.redirect(loginRedirectUrl);
    }
}
