import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { PostClient } from "@/modules/post";

/**
 * GET /api/search
 * Melakukan pencarian global lintas entitas: artikel, halaman, dan produk.
 */
export async function GET(req: Request) {
    const { siteId, error, status } = await getApiContext(["admin", "owner", "editor", "user"]);
    if (error) return apiError(error, status);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) return apiResponse([]);

    try {
        const results = await PostClient.searchAll(siteId, q);
        return apiResponse(results);
    } catch (error) {
        console.error("Search API Error:", error);
        return apiError("Search failed");
    }
}
