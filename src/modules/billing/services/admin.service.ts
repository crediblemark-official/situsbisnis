import * as billingRepo from "../repositories/billing.repository";

/**
 * Mengubah subscription situs ke paket Free (admin only).
 * Menonaktifkan semua subscription aktif lalu membuat subscription Free baru.
 */
export async function setSiteToFreePlan(siteId: string): Promise<void> {
    const freePlan = await billingRepo.findPlanByName("Free");
    if (!freePlan) throw new Error("FREE_PLAN_NOT_FOUND");

    // Nonaktifkan semua subscription aktif
    await billingRepo.cancelAllSubscriptions(null, siteId);

    // Buat subscription Free baru
    const now = new Date();
    await billingRepo.createSubscription(null, {
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
    const sub = await billingRepo.findLatestSubscriptionAnyStatus(siteId);

    if (!sub) throw new Error("NO_SUBSCRIPTION");
    if ((sub as any).trialExtended) throw new Error("TRIAL_ALREADY_EXTENDED");
    if (!(sub as any).trialEndsAt) throw new Error("NOT_A_TRIAL");

    const newEndDate = new Date((sub as any).trialEndsAt);
    newEndDate.setDate(newEndDate.getDate() + days);

    await billingRepo.updateSubscription(sub.id, {
        trialEndsAt: newEndDate,
        trialExtended: true
    });

    return { newEndDate };
}
