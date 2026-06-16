import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { BillingClient } from "@/modules/billing";

export async function POST(req: Request) {
    try {
        const { session, error, status } = await getApiContext(["owner", "admin"]);
        if (error) return apiError(error, status);

        const body = await req.json();
        const { siteId } = body;

        if (!siteId) return apiError("Site ID required", 400);

        const result = await BillingClient.extendTrial(
            (session as any).user.id,
            (session as any).user.role,
            siteId
        );

        return apiResponse(result);
    } catch (e: any) {
        console.error("Extend Trial Error:", e);
        if (e.message === "Forbidden") {
            return apiError("Forbidden", 403);
        }
        if (e.message === "Site not found" || e.message === "No subscription found") {
            return apiError(e.message, 404);
        }
        if (e.message === "Trial already extended" || e.message === "This is not a trial subscription") {
            return apiError(e.message, 400);
        }
        return apiError("Failed to extend trial");
    }
}

