import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { getSubscription } from "@/lib/domains/tenant";
import { TenantClient } from "@/modules/tenant";
import { z } from "zod";

const domainSchema = z.object({
    domain: z.string().min(1, "Domain name is required"),
});

/**
 * Handles custom domain verification requests.
 */
export async function POST(req: Request) {
    try {
        const { siteId, error: authError, status: authStatus } = await getApiContext();
        if (authError || !siteId) return apiError(authError || "Unauthorized", authStatus);

        const subscription = await getSubscription();
        const planName = subscription?.plan?.name || "Free";
        const features = (subscription?.plan?.features as any) || {};
        
        const { isFeatureEnabled } = await import("@/lib/billing/features");
        if (!isFeatureEnabled(planName, features, "hasCustomDomain")) {
            return apiError("Custom domains are only available on Pro and Agency plans.", 403);
        }

        const { data, error: vError, details, status: vStatus } = await validateBody(req, domainSchema);
        if (vError) return apiError(vError, vStatus, details);

        const { domain } = data;

        // Panggil TenantClient
        const result = await TenantClient.verifyDomain(siteId, domain);

        if (result.status === "error") {
            return apiError(result.message, 400, result.details);
        }

        return apiResponse(result);

    } catch (error) {
        console.error("[DOMAIN_VERIFY_API] Error:", error);
        return apiError("Internal Verification Engine Failure");
    }
}
