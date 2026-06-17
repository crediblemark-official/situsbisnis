import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { MediaClient } from "@/modules/media";

export const dynamic = 'force-dynamic';


/**
 * POST /api/media
 * Mengunggah file media baru dengan optimasi otomatis (konversi ke WebP untuk gambar).
 */
export async function POST(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const folderId = formData.get("folderId") as string | null;

        if (!file) return apiError("File required", 400);

        try {
            const mediaItem = await MediaClient.uploadMedia(siteId, file, folderId);
            return apiResponse(mediaItem);
        } catch (serviceError: any) {
            const msg = serviceError?.message || "";
            if (msg === "FILE_REQUIRED") return apiError("File required", 400);
            if (msg === "QUOTA_FULL") return apiError("Quota full", 403);
            if (msg === "UPLOAD_FAILED") return apiError("Upload failed", 500);
            throw serviceError;
        }
    } catch (error) {
        console.error("Upload Error:", error);
        return apiError("Internal Error");
    }
}
