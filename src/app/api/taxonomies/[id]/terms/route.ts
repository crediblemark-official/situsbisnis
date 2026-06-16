import { ContentClient } from "@/modules/content";
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

        try {
            const terms = await ContentClient.getTerms(id, siteId);
            return apiResponse(terms);
        } catch (err: any) {
            if (err.message === "Taxonomy not found") {
                return apiError("Taxonomy not found", 404);
            }
            throw err;
        }
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

        const { data, error: vError, details, status: vStatus } = await validateBody(req, termSchema);
        if (vError) return apiError(vError, vStatus, details);

        try {
            const term = await ContentClient.createTerm(id, siteId, data);
            return apiResponse(term);
        } catch (err: any) {
            if (err.message === "Taxonomy not found") {
                return apiError("Taxonomy not found", 404);
            }
            if (err.code === 'P2002') {
                return apiError("Term with this slug already exists in this taxonomy", 409);
            }
            throw err;
        }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return apiError("Term with this slug already exists in this taxonomy", 409);
        }
        console.error("POST Term Error:", error);
        return apiError("Internal Error");
    }
}

