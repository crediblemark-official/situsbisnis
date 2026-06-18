import { NextResponse } from "next/server";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { PostClient } from "../index";
import { z } from "zod";

const termSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().optional(),
});

const termUpdateSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    slug: z.string().optional(),
});

export async function getTermsApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id: taxonomyId } = await params;
        const terms = await PostClient.getTerms(taxonomyId, siteId);
        return apiResponse(terms);
    } catch (error) {
        console.error("Get Terms Error:", error);
        return apiError("Failed to fetch terms");
    }
}

export async function createTermApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id: taxonomyId } = await params;
        const { data, error: vError, details, status: vStatus } = await validateBody(req, termSchema);
        if (vError) return apiError(vError, vStatus, details);

        const term = await PostClient.createTerm(taxonomyId, siteId, data);
        return apiResponse(term);
    } catch (error) {
        console.error("Create Term Error:", error);
        return apiError("Failed to create term");
    }
}

export async function updateTermApi(req: Request, { params }: { params: Promise<{ id: string; termId: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { termId } = await params;
        const { data, error: vError, details, status: vStatus } = await validateBody(req, termUpdateSchema);
        if (vError) return apiError(vError, vStatus, details);

        const term = await PostClient.updateTerm(termId, siteId, data);
        return apiResponse(term);
    } catch (error) {
        console.error("Update Term Error:", error);
        return apiError("Failed to update term");
    }
}

export async function deleteTermApi(_req: Request, { params }: { params: Promise<{ id: string; termId: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { termId } = await params;
        await PostClient.deleteTerm(termId, siteId);
        return apiResponse({ success: true });
    } catch (error) {
        console.error("Delete Term Error:", error);
        return apiError("Failed to delete term");
    }
}
