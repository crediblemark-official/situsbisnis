import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { TenantClient } from "@/modules/tenant";
import { BillingClient } from "@/modules/billing";
import { IdentityClient } from "@/modules/auth";

/**
 * DELETE /api/admin/sites/[id]
 * Menghapus site beserta semua data yang terhubung (admin only).
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error, status } = await getApiContext(["admin"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("Site ID required", 400);

        try {
            await TenantClient.deleteSite(id);
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

        const { id } = await params;
        const body = await req.json();
        const { action } = body;

        // Ambil detail site untuk validasi dan email
        let site;
        try {
            site = await TenantClient.getSiteDetail(id);
        } catch (serviceError: any) {
            if (serviceError?.message === "SITE_NOT_FOUND") return apiError("Site not found", 404);
            throw serviceError;
        }

        if (action === "set_free") {
            try {
                await BillingClient.setSiteToFreePlan(id);
            } catch (serviceError: any) {
                if (serviceError?.message === "FREE_PLAN_NOT_FOUND") {
                    return apiError("Free plan not found in database", 404);
                }
                throw serviceError;
            }

            const { revalidateTag } = await import("next/cache");
            revalidateTag(`site-${id}`, "default" as any);

            return apiResponse({ success: true, message: "Site set to Free plan" });
        }

        if (action === "extend_trial") {
            let newEndDate: Date;
            try {
                const result = await BillingClient.extendSiteTrial(id, 7);
                newEndDate = result.newEndDate;
            } catch (serviceError: any) {
                const msg = serviceError?.message || "";
                if (msg === "NO_SUBSCRIPTION") return apiError("No subscription found", 404);
                if (msg === "TRIAL_ALREADY_EXTENDED") return apiError("Trial already extended", 400);
                if (msg === "NOT_A_TRIAL") return apiError("This is not a trial subscription", 400);
                throw serviceError;
            }

            const { revalidateTag } = await import("next/cache");
            revalidateTag(`site-${id}`, "default" as any);

            // Kirim email notifikasi ke pemilik site (fire and forget)
            const siteOwner = await IdentityClient.getSiteOwner(id);
            if (siteOwner && siteOwner.email) {
                const { sendTrialExtendedEmail } = await import("@/lib/services/email");
                const formattedEndDate = newEndDate.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                });
                sendTrialExtendedEmail({
                    toEmail: siteOwner.email,
                    userName: siteOwner.name || "Pengguna",
                    siteName: site.name,
                    days: 7,
                    newEndDate: formattedEndDate
                }).catch(err => {
                    console.error("[EXTEND_TRIAL_EMAIL_ERROR] Failed to send email:", err);
                });
            }

            return apiResponse({ success: true, message: "Trial extended by 7 days" });
        }

        return apiError("Invalid action", 400);
    } catch (e) {
        console.error("Patch Site Error:", e);
        return apiError("Failed to update site");
    }
}
