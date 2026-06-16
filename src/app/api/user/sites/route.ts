import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import { apiResponse, apiError } from "@/lib/api/utils";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return apiError("Unauthorized", 401);

        const siteUserLinks = await db.siteUser.findMany({
            where: { userId: session.user.id },
            select: {
                site: {
                    select: {
                        id: true,
                        name: true,
                        subdomain: true,
                        customDomain: true,
                    }
                }
            }
        });

        const sites = siteUserLinks.map(link => link.site);
        return apiResponse({ sites: sites || [] });
    } catch (error) {
        console.error("[USER_SITES_GET]", error);
        return apiError("Internal Server Error");
    }
}

import { z } from "zod";

const updateSiteSchema = z.object({
    siteId: z.string().min(1, "Site ID is required"),
    customDomain: z.string().optional().nullable(),
});

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) return apiError("Unauthorized", 401);
        const userId = (session.user as any).id;

        const body = await req.json();
        const parsed = updateSiteSchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message, 400);
        }

        const { siteId, customDomain } = parsed.data;

        // Verify the user owns this site
        const siteUserLink = await db.siteUser.findFirst({
            where: {
                siteId,
                userId,
                role: "owner"
            }
        });
 
        if (!siteUserLink) {
            return apiError("Site not found or access denied", 404);
        }

        const siteOwner = await db.site.findUnique({
            where: { id: siteId }
        });

        const newDomain = customDomain?.trim().toLowerCase() || null;
        
        if (newDomain) {
            const subscription = await db.subscription.findFirst({
                where: { siteId, status: "active" },
                include: { plan: true }
            });
            const planName = subscription?.plan?.name || "Free";
            const planFeatures = (subscription?.plan?.features as any) || {};
            
            const { isFeatureEnabled } = await import("@/lib/billing/features");
            if (!isFeatureEnabled(planName, planFeatures, "hasCustomDomain")) {
                return apiError("Paket Anda tidak mendukung domain kustom. Silakan upgrade terlebih dahulu.", 403);
            }
        }

        const { DomainService } = await import("@/lib/services/domain.service");
        const oldDomain = siteOwner.customDomain;

        if (newDomain && newDomain !== oldDomain) {
            if (oldDomain) {
                await DomainService.removeDomain(siteId, oldDomain);
            }
            const regResult = await DomainService.registerDomain(siteId, newDomain);
            if (regResult.status === "error") {
                return apiError(regResult.message, 400, regResult.details);
            }
        } else if (!newDomain && oldDomain) {
            await DomainService.removeDomain(siteId, oldDomain);
        }

        return apiResponse({ success: true, customDomain: newDomain });
    } catch (error) {
        console.error("[USER_SITES_PATCH]", error);
        return apiError("Internal Server Error");
    }
}
