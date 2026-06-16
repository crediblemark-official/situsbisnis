import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { ContentClient } from "@/modules/content";

export const dynamic = 'force-dynamic';

/**
 * GET /api/media
 * Mengambil daftar media items beserta informasi kuota penyimpanan.
 */
export async function GET(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext();
        if (error) return apiError(error, status);

        const { searchParams } = new URL(req.url);
        const folderId = searchParams.get("folderId") || null;
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50")));

        const result = await ContentClient.getMediaList(siteId, folderId, page, limit);
        return apiResponse(result);
    } catch (error) {
        console.error("GET Media Error:", error);
        return apiError("Internal Error");
    }
}

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
            const mediaItem = await ContentClient.uploadMedia(siteId, file, folderId);
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
