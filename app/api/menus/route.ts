import { getMenu } from "@/lib/content/menus";
import { apiResponse, apiError } from "@/lib/api/utils";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || "main";

    try {
        const menu = await getMenu(slug);
        return apiResponse(menu);
    } catch (error) {
        console.error("Error fetching menu:", error);
        return apiError("Failed to fetch menu");
    }
}
