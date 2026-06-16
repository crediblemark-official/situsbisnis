import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { siteId, error, status } = await getApiContext(["admin", "owner", "editor"]);
    if (error) return apiError(error, status);

    try {
        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const page = await db.credBuildPage.findUnique({
            where: { id },
            include: {
                metaData: true,
                seoMeta: true,
            }
        });

        if (!page || page.siteId !== siteId) {
            return apiError("Page not found", 404);
        }

        return apiResponse(page);
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

        const existing = await db.credBuildPage.findUnique({
            where: { id }
        });

        if (!existing || existing.siteId !== siteId) {
            return apiError("Page not found or unauthorized", 404);
        }

        await db.credBuildPage.delete({
            where: { id }
        });

        return apiResponse({ success: true });
    } catch (error) {
        console.error("Error deleting page:", error);
        return apiError("Failed to delete");
    }
}
