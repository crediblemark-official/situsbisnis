import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { AppError } from "@/modules/shared/utils/api/errors";
import { z } from "zod";
import * as galleryService from "../services/gallery.service";

const galleryItemSchema = z.object({
    title: z.string().optional(),
    url: z.string().url("Invalid image URL"),
    description: z.string().optional(),
    id: z.string().optional(),
});

export async function galleryGetApi(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(undefined, { isPublic: true });
        if (error) return apiError(error, status);

        const { searchParams } = new URL(req.url);
        const items = await galleryService.listGalleryItems(siteId, searchParams);
        return apiResponse(items);
    } catch (error) {
        if (error instanceof AppError) return apiError(error.message, error.statusCode);
        console.error("Gallery Get Error:", error);
        return apiError("Internal Error");
    }
}

export async function galleryPostApi(req: Request) {
    try {
        const { siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError("Situs Anda sedang tidak aktif. Silakan perbarui langganan.", 403);
        }

        const { data, error: vError, details, status: vStatus } = await validateBody(req, galleryItemSchema);
        if (vError) return apiError(vError, vStatus, details);

        const item = await galleryService.createGalleryItem(siteId, data);
        return apiResponse({ success: true, item });
    } catch (error) {
        if (error instanceof AppError) return apiError(error.message, error.statusCode);
        console.error("Gallery Post Error:", error);
        return apiError("Internal Error");
    }
}

export async function galleryGetDetailApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(undefined, { isPublic: true });
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const item = await galleryService.getGalleryItemDetail(id, siteId);
        return apiResponse(item);
    } catch (error) {
        if (error instanceof AppError) return apiError(error.message, error.statusCode);
        console.error("Gallery Get Detail Error:", error);
        return apiError("Internal Error");
    }
}

export async function galleryPatchApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const body = await req.json() as { isArchived?: boolean };
        const existing = await galleryService.getGalleryItemDetail(id, siteId);
        const updated = await galleryService.updateGalleryItem(id, siteId, { ...existing, ...body });
        return apiResponse({ success: true, item: updated });
    } catch (error) {
        if (error instanceof AppError) return apiError(error.message, error.statusCode);
        console.error("Gallery Patch Error:", error);
        return apiError("Internal Error");
    }
}

export async function galleryPutApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError("Situs Anda sedang tidak aktif. Silakan perbarui langganan.", 403);
        }

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, galleryItemSchema);
        if (vError) return apiError(vError, vStatus, details);

        const item = await galleryService.updateGalleryItem(id, siteId, data);
        return apiResponse({ success: true, item });
    } catch (error) {
        if (error instanceof AppError) return apiError(error.message, error.statusCode);
        console.error("Gallery Put Error:", error);
        return apiError("Internal Error");
    }
}

export async function galleryDeleteApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError("Situs Anda sedang tidak aktif. Silakan perbarui langganan.", 403);
        }

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        await galleryService.deleteGalleryItem(id, siteId);
        return apiResponse({ success: true });
    } catch (error) {
        if (error instanceof AppError) return apiError(error.message, error.statusCode);
        console.error("Gallery Delete Error:", error);
        return apiError("Internal Error");
    }
}
