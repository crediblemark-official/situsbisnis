import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { PostClient } from "../index";
import { z } from "zod";

export const taxonomySchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
});

export async function taxonomyGetApi(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { searchParams } = new URL(req.url);
        const result = await PostClient.listTaxonomies(siteId, searchParams);
        return apiResponse(result);
    } catch (error) {
        console.error("Get Taxonomies Error:", error);
        return apiError("Failed to fetch taxonomies");
    }
}

export async function taxonomyPostApi(req: Request) {
    try {
        const { siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError(`Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk menambah data.`, 403);
        }

        const { data, error: vError, details, status: vStatus } = await validateBody(req, taxonomySchema);
        if (vError) return apiError(vError, vStatus, details);

        const result = await PostClient.createTaxonomy(siteId, data);
        return apiResponse(result);
    } catch (error) {
        console.error("Create Taxonomy Error:", error);
        return apiError("Failed to create taxonomy");
    }
}

export async function taxonomyGetDetailApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const taxonomy = await PostClient.getTaxonomyDetail(id, siteId);
        return apiResponse(taxonomy);
    } catch (error) {
        console.error("Get Taxonomy Detail Error:", error);
        return apiError("Failed to fetch taxonomy");
    }
}

export async function taxonomyPatchApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const body = await req.json() as { isArchived?: boolean };
        const { isArchived } = body;

        const updated = await PostClient.archiveTaxonomy(id, siteId, isArchived);
        return apiResponse({ success: true, item: updated });
    } catch (error) {
        console.error("Archive Taxonomy Error:", error);
        return apiError("Failed to archive taxonomy");
    }
}

export async function taxonomyPutApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError(`Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk mengubah data.`, 403);
        }

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, taxonomySchema);
        if (vError) return apiError(vError, vStatus, details);

        const result = await PostClient.updateTaxonomy(id, siteId, data);
        return apiResponse(result);
    } catch (error) {
        console.error("Update Taxonomy Error:", error);
        return apiError("Failed to update taxonomy");
    }
}

export async function taxonomyDeleteApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError(`Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk menghapus data.`, 403);
        }

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const result = await PostClient.deleteTaxonomy(id, siteId);
        return apiResponse(result);
    } catch (error) {
        console.error("Delete Taxonomy Error:", error);
        if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2003') {
            return apiError("Cannot delete because it is part of an existing record.", 400);
        }
        return apiError("Failed to delete taxonomy");
    }
}
