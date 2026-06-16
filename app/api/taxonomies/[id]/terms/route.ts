import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { z } from "zod";

const termSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
});

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { siteId, error, status } = await getApiContext();
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("Taxonomy ID required", 400);

        const taxonomy = await db.taxonomy.findFirst({
            where: { id, siteId }
        });
        if (!taxonomy) return apiError("Taxonomy not found", 404);

        const terms = await db.term.findMany({
            where: { taxonomyId: id },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                parentId: true
            }
        });
        return apiResponse(terms);
    } catch (error) {
        console.error("GET Terms Error:", error);
        return apiError("Internal Error");
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("Taxonomy ID required", 400);

        const taxonomy = await db.taxonomy.findFirst({
            where: { id, siteId }
        });
        if (!taxonomy) return apiError("Taxonomy not found", 404);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, termSchema);
        if (vError) return apiError(vError, vStatus, details);

        const term = await db.term.create({
            data: {
                ...data,
                taxonomyId: id,
            }
        });

        return apiResponse(term);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return apiError("Term with this slug already exists in this taxonomy", 409);
        }
        console.error("POST Term Error:", error);
        return apiError("Internal Error");
    }
}
