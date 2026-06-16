import { ContentClient } from "@/modules/content";
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

        try {
            await ContentClient.deleteTerm(termId, siteId);
            return apiResponse({ success: true });
        } catch (err: any) {
            if (err.message === "Term not found") {
                return apiError("Term not found", 404);
            }
            throw err;
        }
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

        const { data, error: vError, details, status: vStatus } = await validateBody(req, termUpdateSchema);
        if (vError) return apiError(vError, vStatus, details);

        try {
            const updated = await ContentClient.updateTerm(termId, siteId, data);
            return apiResponse(updated);
        } catch (err: any) {
            if (err.message === "Term not found") {
                return apiError("Term not found", 404);
            }
            if (err.code === 'P2002') {
                return apiError("Term with this slug already exists", 409);
            }
            throw err;
        }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return apiError("Term with this slug already exists", 409);
        }
        console.error("PUT Term Error:", error);
        return apiError("Internal Error");
    }
}

