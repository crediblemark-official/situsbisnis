import { db } from "@/lib/core/db";
import { deleteFromR2 } from "@/lib/media/r2";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;

        if (!id) return apiError("ID required", 400);

        const item = await db.mediaItem.findFirst({
            where: { id, siteId }
        });

        if (!item) return apiError("Item not found", 404);

        await deleteFromR2(item.url);

        await db.mediaItem.delete({
            where: { id }
        });

        return apiResponse({ success: true });
    } catch (error) {
        console.error("Delete Error:", error);
        return apiError("Internal Error");
    }
}
