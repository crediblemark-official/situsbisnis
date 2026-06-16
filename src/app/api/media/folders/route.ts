import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { MediaClient } from "@/modules/media";

/**
 * GET /api/media/folders
 * Mengambil daftar folder media berdasarkan parentId.
 */
export async function GET(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext();
        if (error) return apiError(error, status);

        const { searchParams } = new URL(req.url);
        const parentId = searchParams.get("parentId") || null;

        const folders = await MediaClient.getMediaFolders(siteId, parentId);
        return apiResponse(folders);
    } catch (_error) {
        return apiError("Failed to fetch folders");
    }
}

/**
 * POST /api/media/folders
 * Membuat folder media baru.
 */
export async function POST(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor"]);
        if (error) return apiError(error, status);

        const body = await req.json();
        const { name, parentId } = body;

        try {
            const folder = await MediaClient.createMediaFolder(siteId, name, parentId || null);
            return apiResponse(folder);
        } catch (serviceError: any) {
            const msg = serviceError?.message || "";
            if (msg === "NAME_REQUIRED") return apiError("Name is required", 400);
            throw serviceError;
        }
    } catch (_error) {
        return apiError("Failed to create folder");
    }
}
