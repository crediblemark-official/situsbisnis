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

    const userId = (session?.user as any)?.id as string;
    const globalRole = (session?.user as any)?.role as Role;

    const siteId = await getSiteId();
    const status = await getSiteAccessStatus();
    
    if (!siteId && requireSite && globalRole !== "admin") {
        apiLogger.debug({ userId }, "Access denied: Site context required but missing");
        return { error: "Site context required", status: 400 };
    }

    // Tentukan role efektif untuk request ini (default ke role global)
    let effectiveRole: Role = globalRole;

    if (siteId && session && globalRole !== "admin" && !isPublic) {
        // Ambil link SiteUser (di-cache 5 menit untuk performa)
        const siteUserLink = await unstable_cache(
            async () => db.siteUser.findUnique({
                where: {
                    siteId_userId: {
                        siteId,
                        userId
                    }
                },
                select: {
                    role: true
                }
            }),
            [`site-user-link-${siteId}-${userId}`],
            { revalidate: 300, tags: [`site-${siteId}`] }
        )();

        if (!siteUserLink) {
            apiLogger.warn({ userId, siteId }, "Access denied: User does not belong to this site");
            return { error: "Forbidden: Anda tidak memiliki akses ke situs ini", status: 403 };
        }

        // Set role efektif sesuai dengan role di situs ini
        effectiveRole = siteUserLink.role as Role;

        // Enforce subscription status
        if (status === "expired") {
            apiLogger.warn({ siteId, status }, "Access denied: Site subscription expired");
            return { error: "Langganan Anda telah berakhir. Silakan perbarui langganan untuk melanjutkan.", status: 403 };
        }
    }

    // Validasi permission berdasarkan role efektif
    if (requiredRoles && !isPublic) {
        if (!session?.user || !requiredRoles.includes(effectiveRole)) {
            apiLogger.warn({ 
                userId, 
                role: effectiveRole,
                requiredRoles 
            }, "Forbidden: Insufficient permissions");
            return { error: "Forbidden: Insufficient permissions", status: 403 };
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
