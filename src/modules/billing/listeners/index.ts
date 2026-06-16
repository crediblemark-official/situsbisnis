import { eventBus } from "@/modules/shared/core/event-bus";
import { checkSiteLimit } from "../services/limit.service";
import { LimitType } from "../index";

/**
 * Menginisialisasi event listeners untuk modul billing.
 */
export function initBillingListeners() {
    // Reply listener untuk validasi limit kuota/situs
    eventBus.reply<{ siteId: string; limitType: string }, { allowed: boolean; message?: string }>(
        "request.billing.checkLimit",
        async (data) => {
            try {
                return await checkSiteLimit(data.siteId, data.limitType as LimitType);
            } catch (err: any) {
                console.error("[BillingListener] Gagal memvalidasi limit situs:", err);
                return { allowed: false, message: "Gagal memproses pengecekan kuota" };
            }
        }
    );

    // Reply listener untuk mengambil subscription aktif
    eventBus.reply<{ siteId: string }, any>(
        "request.billing.getActiveSubscription",
        async (data) => {
            try {
                const planService = await import("../services/plan.service");
                return await planService.getActiveSubscription(data.siteId);
            } catch (err) {
                console.error("[BillingListener] Gagal mengambil subscription aktif:", err);
                return null;
            }
        }
    );
}
