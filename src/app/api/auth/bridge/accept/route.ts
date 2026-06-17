import { NextRequest, NextResponse } from "next/server";
import { IdentityClient } from "@/modules/auth";
import { encode } from "next-auth/jwt";

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

        // Verify the bridge token and look up user via service
        const user = await IdentityClient.verifyBridgeToken(token);

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

        // Build redirect URL using the ORIGINAL request hostname
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
            maxAge: 30 * 24 * 60 * 60, // 30 days
        });

        console.log("[BRIDGE] Session bridged for:", user.email, "->", host);
        return response;

    } catch (error: any) {
        console.error("[BRIDGE] Verification failed:", error.message);
        return NextResponse.redirect(loginRedirectUrl);
    }
}

