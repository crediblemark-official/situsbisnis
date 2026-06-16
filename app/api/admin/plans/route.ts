import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { Role } from "@prisma/client";

export async function GET() {
    const { error, status } = await getApiContext([Role.admin]);
    if (error) return apiError(error, status);

    try {
        const plans = await db.plan.findMany({
            orderBy: { price: 'asc' },
            select: {
                id: true,
                name: true,
                price: true,
                priceYearly: true,
                interval: true,
                trialDays: true,
                maxSites: true,
                maxPosts: true,
                maxProducts: true,
                addonSiteBilling: true,
                features: true
            }
        });
        return apiResponse(plans);
    } catch (err) {
        console.error("Fetch Plans Error:", err);
        return apiError("Internal server error");
    }
}
