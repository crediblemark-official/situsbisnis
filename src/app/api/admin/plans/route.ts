import { BillingClient } from "@/modules/billing";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { Role } from "@prisma/client";

export async function GET() {
    const { error, status } = await getApiContext([Role.admin]);
    if (error) return apiError(error, status);

    try {
        const plans = await BillingClient.getAllPlans();
        return apiResponse(plans);
    } catch (err) {
        console.error("Fetch Plans Error:", err);
        return apiError("Internal server error");
    }
}

