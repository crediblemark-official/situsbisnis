import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { provisionSite } from "@/lib/services/provisioning";
import { db } from "@/lib/core/db";
import { apiResponse, apiError } from "@/lib/api/utils";
import { z } from "zod";

const onboardingSchema = z.object({
    siteName: z.string().min(1, "Site name is required"),
    subdomain: z.string().min(1, "Subdomain is required"),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return apiError("Unauthorized", 401);

        const body = await req.json();
        const validation = onboardingSchema.safeParse(body);
        
        if (!validation.success) {
            return apiError("Validation failed", 400, validation.error.format());
        }

        const { siteName, subdomain } = validation.data;
        const normalizedSubdomain = subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

        // Check if subdomain is available
        const existingSite = await db.site.findUnique({
            where: { subdomain: normalizedSubdomain }
        });

        if (existingSite) return apiError("Subdomain already taken", 400);

        // --- ENFORCE RESOURCE LIMITS ---
        // 1. Get user's current site count
        const siteUserLinks = await db.siteUser.findMany({
            where: { userId: session.user.id },
            select: { siteId: true }
        });
        const siteIds = siteUserLinks.map(link => link.siteId);
        const userSitesCount = siteIds.length;

        // 2. Get user's active subscription and its limit
        // Since a user can have multiple sites, we check the limit of their "primary" or "most recent" active subscription
        // In a multi-tenant setup, we usually check the global user limit or the limit allowed by their plan.
        const subscription = await db.subscription.findFirst({
            where: { siteId: { in: siteIds }, status: "active" },
            include: { plan: true },
            orderBy: { createdAt: "desc" }
        });

        const planLimit = subscription?.plan?.maxSites ?? 1;
        const addonSlots = subscription?.addonSlots ?? 0;
        const maxSitesAllowed = planLimit === -1 ? -1 : planLimit + addonSlots;

        if (maxSitesAllowed !== -1 && userSitesCount >= maxSitesAllowed) {
            return apiError(
                `Limit paket tercapai. Paket Anda (${subscription?.plan?.name || "Free"}) hanya mengizinkan ${maxSitesAllowed} situs. Silakan upgrade atau hapus situs yang ada.`, 
                403
            );
        }
        // -------------------------------

        const site = await provisionSite(session.user.id, siteName, normalizedSubdomain);

        return apiResponse({ success: true, site });

    } catch (error) {
        console.error("[ONBOARDING_API] Error:", error);
        return apiError("Failed to create site");
    }
}
