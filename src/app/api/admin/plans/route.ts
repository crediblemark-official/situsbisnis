import { SubscriptionClient } from "@/modules/subscription";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { Role } from "@prisma/client";

export async function GET() {
    const { error, status } = await getApiContext([Role.admin]);
    if (error) return apiError(error, status);

    try {
        const plans = await SubscriptionClient.getAllPlans();
        return apiResponse(plans);
    } catch (err) {
        console.error("Fetch Plans Error:", err);
        return apiError("Internal server error");
    }
}

