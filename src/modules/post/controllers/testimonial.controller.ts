import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { PostClient } from "../index";
import { z } from "zod";

export const testimonialSchema = z.object({
    id: z.string().optional(),
    quote: z.string().min(1, "Quote is required"),
    author: z.string().min(1, "Author is required"),
    role: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
    isApproved: z.boolean().optional(),
    avatarUrl: z.string().optional(),
});

export async function testimonialGetApi(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(undefined, { isPublic: true });
        if (error) return apiError(error, status);

        const { searchParams } = new URL(req.url);
        const result = await PostClient.listTestimonials(siteId, searchParams);
        return apiResponse(result);
    } catch (error) {
        console.error("Get Testimonials Error:", error);
        return apiError("Failed to fetch testimonials");
    }
}

export async function testimonialPostApi(req: Request) {
    try {
        const { session, siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError(`Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk menambah data.`, 403);
        }

        const { data, error: vError, details, status: vStatus } = await validateBody(req, testimonialSchema);
        if (vError) return apiError(vError, vStatus, details);

        const result = await PostClient.createTestimonial(siteId, data, session);
        return apiResponse(result);
    } catch (error) {
        console.error("Create Testimonial Error:", error);
        return apiError("Failed to create testimonial");
    }
}

export async function testimonialGetDetailApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(undefined, { isPublic: true });
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const testimonial = await PostClient.getTestimonialDetail(id, siteId);
        return apiResponse(testimonial);
    } catch (error) {
        console.error("Get Testimonial Detail Error:", error);
        return apiError("Failed to fetch testimonial");
    }
}

export async function testimonialPatchApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const body = await req.json() as { isArchived?: boolean };
        const { isArchived } = body;

        const updated = await PostClient.archiveTestimonial(id, siteId, isArchived);
        return apiResponse({ success: true, item: updated });
    } catch (error) {
        console.error("Archive Testimonial Error:", error);
        return apiError("Failed to archive testimonial");
    }
}

export async function testimonialPutApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { session, siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError(`Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk mengubah data.`, 403);
        }

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, testimonialSchema);
        if (vError) return apiError(vError, vStatus, details);

        const result = await PostClient.updateTestimonial(id, siteId, data, session);
        return apiResponse(result);
    } catch (error) {
        console.error("Update Testimonial Error:", error);
        return apiError("Failed to update testimonial");
    }
}

export async function testimonialDeleteApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError(`Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk menghapus data.`, 403);
        }

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const result = await PostClient.deleteTestimonial(id, siteId);
        return apiResponse(result);
    } catch (error) {
        console.error("Delete Testimonial Error:", error);
        if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2003') {
            return apiError("Cannot delete because it is part of an existing record.", 400);
        }
        return apiError("Failed to delete testimonial");
    }
}
