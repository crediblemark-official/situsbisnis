import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { MediaClient } from "@/modules/media";

/**
 * DELETE /api/media/folders/[id]
 * Menghapus folder media (hanya jika kosong).
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor"]);
        if (error) return apiError(error, status);

        const { id } = await params;

        try {
            const result = await MediaClient.deleteMediaFolder(siteId, id);
            return apiResponse(result);
        } catch (serviceError: any) {
            const msg = serviceError?.message || "";
            if (msg === "ID_REQUIRED") return apiError("ID is required", 400);
            if (msg === "NOT_FOUND") return apiError("Folder not found", 404);
            if (msg === "FOLDER_NOT_EMPTY") return apiError("Cannot delete non-empty folder", 400);
            throw serviceError;
        }
    } catch (_error) {
        return apiError("Failed to delete folder");
    }
}
