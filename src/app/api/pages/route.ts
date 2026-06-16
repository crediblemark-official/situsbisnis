import { ContentClient } from "@/modules/content";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";

export async function GET() {
    const { siteId, error, status } = await getApiContext(["admin", "owner", "editor"]);
    if (error) return apiError(error, status);

    try {
        const pages = await ContentClient.getPages(siteId);
        return apiResponse(pages);
    } catch (error) {
        console.error("Error fetching pages:", error);
        return apiError("Failed to fetch pages");
    }
}

export async function POST(req: Request) {
    const { siteId, error, status } = await getApiContext(["admin", "owner", "editor"]);
    if (error) return apiError(error, status);

    try {
        const body = await req.json();
        const { path } = body;

        if (!path) return apiError("Missing path", 400);

        try {
            await ContentClient.savePage(siteId, body);
            return apiResponse({ success: true });
        } catch (err: any) {
            const message = err.message;
            if (message === "Unauthorized") {
                return apiError("Unauthorized", 403);
            }
            if (message === "Path already exists") {
                return apiError("Path already exists for this site", 409);
            }
            throw err;
        }
    } catch (error) {
        console.error("Error saving page:", error);
        return apiError("Failed to save");
    }
}

