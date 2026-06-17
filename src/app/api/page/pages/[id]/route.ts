import { PageClient } from "@/modules/page";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { siteId, error, status } = await getApiContext(["admin", "owner", "editor"]);
    if (error) return apiError(error, status);

    try {
        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        try {
            const page = await PageClient.getPageDetail(id, siteId);
            return apiResponse(page);
        } catch (err: any) {
            if (err.message === "Page not found") {
                return apiError("Page not found", 404);
            }
            throw err;
        }
    } catch (error) {
        console.error("Error fetching page:", error);
        return apiError("Failed to fetch page");
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { siteId, error, status } = await getApiContext(["admin", "owner", "editor"]);
    if (error) return apiError(error, status);

    try {
        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        try {
            await PageClient.deletePage(id, siteId);
            return apiResponse({ success: true });
        } catch (err: any) {
            if (err.message === "Page not found") {
                return apiError("Page not found or unauthorized", 404);
            }
            throw err;
        }
    } catch (error) {
        console.error("Error deleting page:", error);
        return apiError("Failed to delete");
    }
}

