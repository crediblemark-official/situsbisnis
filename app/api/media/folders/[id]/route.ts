import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor"]);
        if (error) return apiError(error, status);

        const { id } = await params;

        if (!id) return apiError("ID is required", 400);

        const folder = await db.mediaFolder.findFirst({
            where: { id, siteId }
        });

        if (!folder) {
            return apiError("Folder not found", 404);
        }

        const withCounts = await db.mediaFolder.findUnique({
            where: { id },
            include: { _count: { select: { items: true, children: true } } }
        });

        if (withCounts && (withCounts._count.items > 0 || withCounts._count.children > 0)) {
            return apiError("Cannot delete non-empty folder", 400);
        }

        await db.mediaFolder.delete({ where: { id } });

        return apiResponse({ success: true });
    } catch (_error) {
        return apiError("Failed to delete folder");
    }
}
