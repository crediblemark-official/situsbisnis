import { getSiteId } from "@/lib/domains/tenant";
import { apiResponse, apiError } from "@/lib/api/utils";
import { SiteClient } from "@/modules/site";

export async function GET() {
    try {
        const siteId = await getSiteId();
        if (!siteId) return apiResponse({ totalViews: 0, todayViews: 0 });

        // Panggil SiteClient untuk mendapatkan dan mencatat jumlah views secara asinkron/sinkron
        const stats = await SiteClient.getOrIncrementViews(siteId);

        return apiResponse(stats);
    } catch (error) {
        console.error("Analytics Route Error:", error);
        return apiError("Internal Error");
    }
}
