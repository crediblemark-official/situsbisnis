import { db } from "@/modules/shared/core/db";

/**
 * Mengambil nama paket langganan aktif untuk daftar situs.
 */
export async function findActivePlanNamesForSites(siteIds: string[]) {
    return db.subscription.findMany({
        where: {
            siteId: { in: siteIds },
            status: "active"
        },
        select: {
            siteId: true,
            plan: {
                select: {
                    name: true
                }
            }
        }
    });
}

/**
 * Mengambil subscription aktif untuk suatu situs.
 */
export async function findActiveSubscription(siteId: string) {
    return db.subscription.findFirst({
        where: { siteId, status: "active" },
        include: { plan: true },
        orderBy: { createdAt: "desc" }
    });
}

/**
 * Mencari langganan aktif dari sekumpulan siteIds (untuk validasi limit situs saat onboarding).
 */
export async function findActiveSubscriptionBySiteIds(siteIds: string[]) {
    return db.subscription.findFirst({
        where: { siteId: { in: siteIds }, status: "active" },
        include: { plan: true },
        orderBy: { createdAt: "desc" }
    });
}

/**
 * Mengambil subscription aktif terakhir dari suatu situs.
 */
export async function findLatestSubscription(tx, siteId: string) {
    const client = tx || db;
    return client.subscription.findFirst({
        where: { siteId, status: "active" }
    });
}

/**
 * Mengambil subscription terbaru tanpa mempedulikan status.
 */
export async function findLatestSubscriptionAnyStatus(siteId: string) {
    return db.subscription.findFirst({
        where: { siteId },
        orderBy: { createdAt: "desc" }
    });
}

/**
 * Memperbarui jumlah addon slots pada subscription.
 */
export async function updateSubscriptionAddonSlots(tx, subId: string, quantity: number) {
    const client = tx || db;
    return client.subscription.update({
        where: { id: subId },
        data: {
            addonSlots: {
                increment: quantity
            }
        }
    });
}

/**
 * Menonaktifkan (membatalkan) semua subscription aktif milik situs.
 */
export async function cancelAllSubscriptions(tx, siteId: string) {
    const client = tx || db;
    return client.subscription.updateMany({
        where: { siteId },
        data: { status: "cancelled" }
    });
}

/**
 * Mengambil subscription berdasarkan situs dan paket tertentu.
 */
export async function findSubscriptionBySiteAndPlan(tx, siteId: string, planId: string) {
    const client = tx || db;
    return client.subscription.findFirst({
        where: { siteId, planId }
    });
}

/**
 * Memperbarui subscription yang sudah ada agar aktif kembali.
 */
export async function activateExistingSubscription(tx, subId: string, data: { endDate: Date, addonSlots: number }) {
    const client = tx || db;
    return client.subscription.update({
        where: { id: subId },
        data: {
            status: "active",
            endDate: data.endDate,
            trialEndsAt: null,
            addonSlots: data.addonSlots
        }
    });
}

/**
 * Membuat subscription baru.
 */
export async function createSubscription(tx, data: { siteId: string, planId: string, status: string, startDate: Date, endDate: Date, addonSlots: number }) {
    const client = tx || db;
    return client.subscription.create({
        data: {
            siteId: data.siteId,
            planId: data.planId,
            status: data.status,
            startDate: data.startDate,
            endDate: data.endDate,
            addonSlots: data.addonSlots
        }
    });
}

/**
 * Memperbarui masa uji coba (trial) subscription.
 */
export async function updateSubscriptionTrial(id: string, data: {
    trialEndsAt: Date;
    trialExtended: boolean;
}) {
    return db.subscription.update({
        where: { id },
        data: {
            trialEndsAt: data.trialEndsAt,
            trialExtended: data.trialExtended
        }
    });
}

/**
 * Mengambil subscription berdasarkan ID.
 */
export async function findSubscriptionById(id: string) {
    return db.subscription.findUnique({
        where: { id },
        include: { plan: true }
    });
}

/**
 * Memperbarui data subscription.
 */
export async function updateSubscription(id: string, data: any) {
    return db.subscription.update({
        where: { id },
        data,
        include: { plan: true }
    });
}

/**
 * Memperbarui status subscription saja tanpa relasi plan.
 */
export async function updateSubscriptionStatusOnly(id: string, status: string) {
    return db.subscription.update({
        where: { id },
        data: { status }
    });
}
