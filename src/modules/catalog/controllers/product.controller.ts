import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { Role } from "@prisma/client";
import { AppError } from "@/modules/shared/utils/api/errors";
import { createLogger } from "@/modules/shared/core/logger";
import * as productService from "../services/product.service";

const logger = createLogger("controller:product");

function isErrorResult(result: any): result is { success: false; error: string; status?: number; details?: unknown } {
    return result && result.success === false && result.error;
}

async function handleServiceCall<T>(fn: () => Promise<T>): Promise<Response> {
    try {
        const result = await fn();
        if (isErrorResult(result)) {
            return apiError(result.error, result.status || 400, result.details);
        }
        return apiResponse(result);
    } catch (error: unknown) {
        if (error instanceof AppError) return apiError(error.message, error.statusCode, error.details);
        logger.error({ error }, "Product controller error");
        return apiError("Internal Error");
    }
}

export async function productGetApi(req: Request) {
    return handleServiceCall(async () => {
        const { siteId, error, status } = await getApiContext(undefined, { isPublic: true });
        if (error) return { success: false, error, status };

        const { searchParams } = new URL(req.url);
        return productService.listProducts(siteId!, searchParams, true);
    });
}

export async function productPostApi(req: Request) {
    return handleServiceCall(async () => {
        const roles: Role[] = ["admin", "editor", "owner"];
        const { session, siteId, siteStatus, error, status } = await getApiContext(roles);
        if (error) return { success: false, error, status };

        if (siteStatus !== "active") {
            return { success: false, error: `Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk menambah data.`, status: 403 };
        }

        return productService.createProduct(siteId!, await req.json(), session);
    });
}

export async function productGetDetailApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    return handleServiceCall(async () => {
        const { siteId, error, status } = await getApiContext(undefined, { isPublic: true });
        if (error) return { success: false, error, status };

        const { id } = await params;
        if (!id) return { success: false, error: "ID required", status: 400 };

        return productService.getProductDetail(id, siteId!);
    });
}

export async function productPatchApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    return handleServiceCall(async () => {
        const roles: Role[] = ["admin", "editor", "owner"];
        const { siteId, siteStatus, error, status } = await getApiContext(roles);
        if (error) return { success: false, error, status };

        if (siteStatus !== "active") {
            return { success: false, error: `Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk mengubah data.`, status: 403 };
        }

        const { id } = await params;
        if (!id) return { success: false, error: "ID required", status: 400 };

        const body = await req.json() as { isArchived?: boolean };
        return productService.archiveProduct(id, siteId!, body.isArchived ?? false);
    });
}

export async function productPutApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    return handleServiceCall(async () => {
        const roles: Role[] = ["admin", "editor", "owner"];
        const { session, siteId, siteStatus, error, status } = await getApiContext(roles);
        if (error) return { success: false, error, status };

        if (siteStatus !== "active") {
            return { success: false, error: `Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk mengubah data.`, status: 403 };
        }

        const { id } = await params;
        if (!id) return { success: false, error: "ID required", status: 400 };

        return productService.updateProduct(id, siteId!, await req.json(), session);
    });
}

export async function productDeleteApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    return handleServiceCall(async () => {
        const roles: Role[] = ["admin", "editor", "owner"];
        const { siteId, siteStatus, error, status } = await getApiContext(roles);
        if (error) return { success: false, error, status };

        if (siteStatus !== "active") {
            return { success: false, error: `Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk menghapus data.`, status: 403 };
        }

        const { id } = await params;
        if (!id) return { success: false, error: "ID required", status: 400 };

        return productService.deleteProductItem(id, siteId!);
    });
}
