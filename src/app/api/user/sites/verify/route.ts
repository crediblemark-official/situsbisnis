import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import { apiResponse, apiError } from "@/lib/api/utils";
import { DomainService } from "@/lib/services/domain.service";
import { z } from "zod";

const verifySchema = z.object({
    siteId: z.string().min(1, "Site ID is required"),
    domain: z.string().min(1, "Domain is required"),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return apiError("Unauthorized", 401);
        }
        const userId = (session.user as any).id;

        const body = await req.json();
        const parsed = verifySchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message, 400);
        }

        const { siteId, domain } = parsed.data;

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

        // Verify plan allows custom domain
        const subscription = await db.subscription.findFirst({
            where: { siteId, status: "active" },
            include: { plan: true }
        });
        const planName = subscription?.plan?.name || "Free";
        const planFeatures = (subscription?.plan?.features as any) || {};
        
        const { isFeatureEnabled } = await import("@/lib/billing/features");
        if (!isFeatureEnabled(planName, planFeatures, "hasCustomDomain")) {
            return apiError("Paket Anda tidak mendukung domain kustom.", 403);
        }

        const result = await DomainService.verifyDomain(siteId, domain);
        if (result.status === "error") {
            return apiError(result.message, 400, result.details);
        }

        return apiResponse(result);
    } catch (error) {
        console.error("[USER_SITES_VERIFY_POST]", error);
        return apiError("Internal Server Error");
    }
}
