import { eventBus } from "@/modules/shared/core/event-bus";
import { checkSiteLimit } from "../services/limit.service";
import { LimitType } from "../index";

export async function initSubscriptionListeners() {
    await eventBus.reply<{ siteId: string; limitType: string }, { allowed: boolean; message?: string }>(
        "request.billing.checkLimit",
        async (data) => {
            try {
                return await checkSiteLimit(data.siteId, data.limitType as LimitType);
            } catch (err: any) {
                console.error("[SubscriptionListener] Gagal memvalidasi limit situs:", err);
                return { allowed: false, message: "Gagal memproses pengecekan kuota" };
            }
        }
    );

    await eventBus.reply<{ siteId: string }, any>(
        "request.billing.getActiveSubscription",
        async (data) => {
            try {
                const planService = await import("../services/plan.service");
                return await planService.getActiveSubscription(data.siteId);
            } catch (err) {
                console.error("[SubscriptionListener] Gagal mengambil subscription aktif:", err);
                return null;
            }
        }
    );
}
