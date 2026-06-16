import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { provisionSite } from "@/lib/services/provisioning";
import { apiResponse, apiError } from "@/lib/api/utils";
import { TenantClient } from "@/modules/tenant";
import { BillingClient } from "@/modules/billing";
import { z } from "zod";

const onboardingSchema = z.object({
    siteName: z.string().min(1, "Site name is required"),
    subdomain: z.string().min(1, "Subdomain is required"),
});

/**
 * POST /api/onboarding
 * Membuat situs baru untuk pengguna yang baru login, dengan validasi limit paket.
 */
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

        // 1. Cek ketersediaan subdomain
        try {
            await TenantClient.checkSubdomainAvailability(normalizedSubdomain);
        } catch (err: any) {
            if (err?.message === "SUBDOMAIN_TAKEN") {
                return apiError("Subdomain already taken", 400);
            }
            throw err;
        }

        // 2. Ambil jumlah site milik user
        const { siteIds, count: userSitesCount } = await TenantClient.getUserSiteCount(session.user.id);

        // 3. Validasi limit jumlah situs dari paket langganan
        const limitCheck = await BillingClient.checkUserSitesLimit(siteIds, userSitesCount);
        if (!limitCheck.allowed) {
            return apiError(limitCheck.message || "Batas situs tercapai", 403);
        }

        // 4. Provision site baru
        const site = await provisionSite(session.user.id, siteName, normalizedSubdomain);

        return apiResponse({ success: true, site });

    } catch (error) {
        console.error("[ONBOARDING_API] Error:", error);
        return apiError("Failed to create site");
    }
}
