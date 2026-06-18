import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { DomainClient } from "../index";
import { z } from "zod";
import { SubscriptionClient } from "@/modules/subscription";

const domainSchema = z.object({
    domain: z.string().min(1, "Domain name is required"),
});

export async function verifyDomainApi(req: Request) {
    try {
        const { siteId, error: authError, status: authStatus } = await getApiContext();
        if (authError || !siteId) return apiError(authError || "Unauthorized", authStatus);

        const subscription = await SubscriptionClient.getActiveSubscription(siteId);
        const features = (subscription?.plan?.features as any) || {};

        if (!features.hasCustomDomain) {
            return apiError("Custom domains are only available on Pro and Agency plans.", 403);
        }

        const { data, error: vError, details, status: vStatus } = await validateBody(req, domainSchema);
        if (vError) return apiError(vError, vStatus, details);

        const result = await DomainClient.verifyDomain(siteId, data.domain);

        if (result?.status === "error") {
            return apiError(result.message, 400, result.details);
        }

        return apiResponse(result);
    } catch (error) {
        console.error("[DOMAIN_VERIFY_API] Error:", error);
        return apiError("Internal Verification Engine Failure");
    }
}
