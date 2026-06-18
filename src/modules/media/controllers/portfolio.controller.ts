import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { AppError } from "@/modules/shared/utils/api/errors";
import { z } from "zod";
import * as portfolioService from "../services/portfolio.service";

const portfolioItemSchema = z.object({
    title: z.string().min(1, "Title is required"),
    category: z.string().min(1, "Category is required"),
    imageUrl: z.string().min(1, "Image URL is required"),
    link: z.string().optional().or(z.literal("")),
    description: z.string().optional(),
    id: z.string().optional(),
});

export async function portfolioGetApi(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(undefined, { isPublic: true });
        if (error) return apiError(error, status);

        const { searchParams } = new URL(req.url);
        const items = await portfolioService.listPortfolioItems(siteId, searchParams);
        return apiResponse(items);
    } catch (error) {
        if (error instanceof AppError) return apiError(error.message, error.statusCode);
        console.error("Portfolio Get Error:", error);
        return apiError("Internal Error");
    }
}

export async function portfolioPostApi(req: Request) {
    try {
        const { siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError("Situs Anda sedang tidak aktif. Silakan perbarui langganan.", 403);
        }

        const { data, error: vError, details, status: vStatus } = await validateBody(req, portfolioItemSchema);
        if (vError) return apiError(vError, vStatus, details);

        const item = await portfolioService.createPortfolioItem(siteId, data);
        return apiResponse({ success: true, item });
    } catch (error) {
        if (error instanceof AppError) return apiError(error.message, error.statusCode);
        console.error("Portfolio Post Error:", error);
        return apiError("Internal Error");
    }
}

export async function portfolioGetDetailApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(undefined, { isPublic: true });
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const item = await portfolioService.getPortfolioItemDetail(id, siteId);
        return apiResponse(item);
    } catch (error) {
        if (error instanceof AppError) return apiError(error.message, error.statusCode);
        console.error("Portfolio Get Detail Error:", error);
        return apiError("Internal Error");
    }
}

export async function portfolioPatchApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const body = await req.json() as { isArchived?: boolean };
        const existing = await portfolioService.getPortfolioItemDetail(id, siteId);
        const updated = await portfolioService.updatePortfolioItem(id, siteId, { ...existing, ...body });
        return apiResponse({ success: true, item: updated });
    } catch (error) {
        if (error instanceof AppError) return apiError(error.message, error.statusCode);
        console.error("Portfolio Patch Error:", error);
        return apiError("Internal Error");
    }
}

export async function portfolioPutApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError("Situs Anda sedang tidak aktif. Silakan perbarui langganan.", 403);
        }

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, portfolioItemSchema);
        if (vError) return apiError(vError, vStatus, details);

        const item = await portfolioService.updatePortfolioItem(id, siteId, data);
        return apiResponse({ success: true, item });
    } catch (error) {
        if (error instanceof AppError) return apiError(error.message, error.statusCode);
        console.error("Portfolio Put Error:", error);
        return apiError("Internal Error");
    }
}

export async function portfolioDeleteApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError("Situs Anda sedang tidak aktif. Silakan perbarui langganan.", 403);
        }

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        await portfolioService.deletePortfolioItem(id, siteId);
        return apiResponse({ success: true });
    } catch (error) {
        if (error instanceof AppError) return apiError(error.message, error.statusCode);
        console.error("Portfolio Delete Error:", error);
        return apiError("Internal Error");
    }
}
