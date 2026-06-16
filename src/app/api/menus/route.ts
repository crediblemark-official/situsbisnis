import { ContentClient } from "@/modules/content";
import { getSiteId } from "@/lib/domains/tenant";
import { apiResponse, apiError } from "@/lib/api/utils";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || "main";

    try {
        const siteId = await getSiteId();
        if (!siteId) return apiError("Site ID not found", 400);

        const menu = await ContentClient.getMenu(slug, siteId);
        return apiResponse(menu);
    } catch (error) {
        console.error("Error fetching menu:", error);
        return apiError("Failed to fetch menu");
    }
}
