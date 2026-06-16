import * as planRepo from "../repositories/plan.repository";
import * as subscriptionRepo from "../repositories/subscription.repository";

/**
 * Mengubah subscription situs ke paket Free (admin only).
 * Menonaktifkan semua subscription aktif lalu membuat subscription Free baru.
 */
export async function setSiteToFreePlan(siteId: string): Promise<void> {
    const freePlan = await planRepo.findPlanByName("Free");
    if (!freePlan) throw new Error("FREE_PLAN_NOT_FOUND");

    // Nonaktifkan semua subscription aktif
    await subscriptionRepo.cancelAllSubscriptions(null, siteId);

    // Buat subscription Free baru
    const now = new Date();
    await subscriptionRepo.createSubscription(null, {
        siteId,
        planId: freePlan.id,
        status: "active",
        startDate: now,
        endDate: new Date(now.getFullYear() + 10, now.getMonth(), now.getDate()), // 10 tahun
        addonSlots: 0
    });
}

/**
 * Memperpanjang masa trial subscription satu situs (admin only) sebanyak N hari.
 * Melempar error jika tidak ada subscription, bukan trial, atau trial sudah pernah diperpanjang.
 */
export async function extendSiteTrial(siteId: string, days: number): Promise<{ newEndDate: Date }> {
    const sub = await subscriptionRepo.findLatestSubscriptionAnyStatus(siteId);

    if (!sub) throw new Error("NO_SUBSCRIPTION");
    if ((sub as any).trialExtended) throw new Error("TRIAL_ALREADY_EXTENDED");
    if (!(sub as any).trialEndsAt) throw new Error("NOT_A_TRIAL");

    const newEndDate = new Date((sub as any).trialEndsAt);
    newEndDate.setDate(newEndDate.getDate() + days);

    await subscriptionRepo.updateSubscription(sub.id, {
        trialEndsAt: newEndDate,
        trialExtended: true
    });

    return { newEndDate };
}
