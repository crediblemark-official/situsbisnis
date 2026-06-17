import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSiteId, getSiteAccessStatus } from "@/lib/domains/tenant";
import { NextResponse } from "next/server";
import { ZodType } from "zod";
import { Role } from "@prisma/client";
import { createLogger } from "@/lib/core/logger";
import { db } from "@/lib/core/db";
import { unstable_cache } from "next/cache";
import crypto from "crypto";

const apiLogger = createLogger("api");

export async function getApiContext(requiredRoles?: Role[], options: { isPublic?: boolean; requireSite?: boolean } = {}) {
    const { isPublic = false, requireSite = true } = options;
    const session = await getServerSession(authOptions);
    
    if (!session && !isPublic) {
        apiLogger.warn({ path: "API" }, "Unauthorized API request");
        return { error: "Unauthorized", status: 401 };
    }

    if (requiredRoles && (!session?.user || !requiredRoles.includes((session?.user as any).role as Role))) {
        apiLogger.warn({ 
            userId: (session?.user as any)?.id, 
            role: (session?.user as any)?.role,
            requiredRoles 
        }, "Forbidden: Insufficient permissions");
        return { error: "Forbidden: Insufficient permissions", status: 403 };
    }

    const siteId = await getSiteId();
    const status = await getSiteAccessStatus();
    
    if (!siteId && requireSite && (session?.user as any)?.role !== "admin") {
        apiLogger.debug({ userId: (session?.user as any)?.id }, "Access denied: Site context required but missing");
        return { error: "Site context required", status: 400 };
    }

    // Non-admin access checks
    if (siteId && session && (session.user as any).role !== "admin" && !isPublic) {
        // Enforce subscription status
        if (status === "expired") {
            apiLogger.warn({ siteId, status }, "Access denied: Site subscription expired");
            return { error: "Langganan Anda telah berakhir. Silakan perbarui langganan untuk melanjutkan.", status: 403 };
        }

        // Verifikasi user milik situs ini — di-cache 5 menit per pasangan user-site
        const userId = (session.user as any).id as string;
        const isUserLinkedToSite = await unstable_cache(
            async () => db.siteUser.count({
                where: {
                    siteId,
                    userId
                }
            }),
            [`site-user-link-${siteId}-${userId}`],
            { revalidate: 300, tags: [`site-${siteId}`] }
        )();

        if (isUserLinkedToSite === 0) {
            apiLogger.warn({
                userId,
                siteId
            }, "Access denied: User does not belong to this site");
            return { error: "Forbidden: Anda tidak memiliki akses ke situs ini", status: 403 };
        }
    }

    return { session, siteId: siteId || undefined, siteStatus: status };
}

export function apiResponse(data: unknown, status = 200) {
    return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 500, details?: unknown) {
    if (status >= 500) {
        apiLogger.error({ message, details, statusCode: status }, "API Error");
    }
    return NextResponse.json({ 
        error: message,
        details 
    }, { status });
}

export async function validateBody<T>(req: Request, schema: ZodType<T>) {
    try {
        const body = await req.json();
        const validation = schema.safeParse(body);
        
        if (!validation.success) {
            apiLogger.debug({ errors: validation.error.format() }, "Validation failed");
            return { error: "Validation failed", details: validation.error.format(), status: 400 };
        }
        
        return { data: validation.data };
    } catch {
        apiLogger.debug("Invalid JSON body");
        return { error: "Invalid JSON body", status: 400 };
    }
}

export function generateBridgeToken(userId: string): string {
    const secret = process.env.NEXTAUTH_SECRET || "";
    const payload = JSON.stringify({
        userId,
        exp: Date.now() + 5 * 60 * 1000, // 5 minutes
    });
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return Buffer.from(payload).toString("base64url") + "." + signature;
}
