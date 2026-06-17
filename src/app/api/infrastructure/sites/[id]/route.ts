import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { SiteClient } from "@/modules/site";
import { InfrastructureClient } from "@/modules/infrastructure";
import { validateCsrf } from "@/modules/shared/utils/csrf";

/**
 * DELETE /api/admin/sites/[id]
 * Menghapus site beserta semua data yang terhubung (admin only).
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error, status } = await getApiContext(["admin"]);
        if (error) return apiError(error, status);

        const csrf = validateCsrf(_req);
        if (!csrf.valid) {
            return apiError("CSRF validation failed", 403);
        }

        const { id } = await params;
        if (!id) return apiError("Site ID required", 400);

        try {
            await SiteClient.deleteSite(id);
            return apiResponse({ success: true, message: "Site deleted successfully" });
        } catch (serviceError: any) {
            const msg = serviceError?.message || "";
            if (msg === "SITE_NOT_FOUND") return apiError("Site not found", 404);
            if (msg === "CANNOT_DELETE_ADMIN") return apiError("Cannot delete the platform admin site", 400);
            throw serviceError;
        }
    } catch (e) {
        console.error("Delete Site Error:", e);
        return apiError("Failed to delete site");
    }
}

/**
 * PATCH /api/admin/sites/[id]
 * Menjalankan aksi manajemen pada site:
 * - set_free: Downgrade ke paket Free
 * - extend_trial: Perpanjang masa trial 7 hari
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error, status } = await getApiContext(["admin"]);
        if (error) return apiError(error, status);

        const csrf = validateCsrf(req);
        if (!csrf.valid) {
            return apiError("CSRF validation failed", 403);
        }

        const { id } = await params;
        const body = await req.json();
        const { action } = body;

        try {
            const result = await InfrastructureClient.manageSite(id, action);
            return apiResponse(result);
        } catch (serviceError: any) {
            const msg = serviceError?.message || "";
            if (msg === "SITE_NOT_FOUND") return apiError("Site not found", 404);
            if (msg === "FREE_PLAN_NOT_FOUND") return apiError("Free plan not found in database", 404);
            if (msg === "NO_SUBSCRIPTION") return apiError("No subscription found", 404);
            if (msg === "TRIAL_ALREADY_EXTENDED") return apiError("Trial already extended", 400);
            if (msg === "NOT_A_TRIAL") return apiError("This is not a trial subscription", 400);
            if (msg === "INVALID_ACTION") return apiError("Invalid action", 400);
            throw serviceError;
        }
    } catch (e) {
        console.error("Patch Site Error:", e);
        return apiError("Failed to update site");
    }
}

