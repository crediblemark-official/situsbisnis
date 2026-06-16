import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { MediaClient } from "@/modules/media";

/**
 * DELETE /api/media/[id]
 * Menghapus file media dari database dan Cloudflare R2 storage.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;

        try {
            const result = await MediaClient.deleteMedia(siteId, id);
            return apiResponse(result);
        } catch (serviceError: any) {
            const msg = serviceError?.message || "";
            if (msg === "ID_REQUIRED") return apiError("ID required", 400);
            if (msg === "NOT_FOUND") return apiError("Item not found", 404);
            throw serviceError;
        }
    } catch (error) {
        console.error("Delete Media Error:", error);
        return apiError("Internal Error");
    }
}
