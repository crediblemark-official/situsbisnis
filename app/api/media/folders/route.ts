import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";

export async function GET(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext();
        if (error) return apiError(error, status);

        const { searchParams } = new URL(req.url);
        const parentId = searchParams.get("parentId") || null;

        const folders = await db.mediaFolder.findMany({
            where: {
                siteId,
                parentId: parentId
            },
            select: {
                id: true,
                name: true,
                parentId: true,
                _count: {
                    select: { items: true, children: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return apiResponse(folders);
    } catch (_error) {
        return apiError("Failed to fetch folders");
    }
}

export async function POST(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor"]);
        if (error) return apiError(error, status);

        const body = await req.json();
        const { name, parentId } = body;

        if (!name) return apiError("Name is required", 400);

        const folder = await db.mediaFolder.create({
            data: {
                name,
                siteId,
                parentId: parentId || null
            }
        });

        return apiResponse(folder);
    } catch (_error) {
        return apiError("Failed to create folder");
    }
}
