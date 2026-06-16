import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { z } from "zod";

const termUpdateSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    slug: z.string().min(1, "Slug is required").optional(),
    description: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
});

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string; termId: string }> }
) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { termId } = await params;
        if (!termId) return apiError("Term ID required", 400);

        const term = await db.term.findFirst({
            where: { id: termId },
            include: { taxonomy: true }
        });
        if (!term || term.taxonomy.siteId !== siteId) return apiError("Term not found", 404);

        await db.term.delete({ where: { id: termId } });
        return apiResponse({ success: true });
    } catch (error) {
        console.error("DELETE Term Error:", error);
        return apiError("Internal Error");
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string; termId: string }> }
) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { termId } = await params;
        if (!termId) return apiError("Term ID required", 400);

        const term = await db.term.findFirst({
            where: { id: termId },
            include: { taxonomy: true }
        });
        if (!term || term.taxonomy.siteId !== siteId) return apiError("Term not found", 404);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, termUpdateSchema);
        if (vError) return apiError(vError, vStatus, details);

        const updated = await db.term.update({
            where: { id: termId },
            data
        });

        return apiResponse(updated);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return apiError("Term with this slug already exists", 409);
        }
        console.error("PUT Term Error:", error);
        return apiError("Internal Error");
    }
}
