import { db } from "@/modules/shared/core/db";

/**
 * Mengambil paket langganan yang akan ditampilkan pada halaman harga.
 */
export async function findPricingPlans() {
    return db.plan.findMany({
        where: { showInPricing: true } as any,
        orderBy: { price: 'asc' },
        select: {
            id: true,
            name: true,
            description: true,
            price: true,
            priceYearly: true,
            originalPrice: true,
            originalPriceYearly: true,
            interval: true,
            trialDays: true,
            maxSites: true,
            maxProducts: true,
            maxPosts: true,
            maxAssets: true,
            maxOrders: true,
            maxTestimonials: true,
            features: true,
            addonSiteBilling: true
        }
    });
}

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
 * Mengambil data transaksi beserta paket langganannya.
 */
export async function findTransactionById(tx, id: string) {
    const client = tx || db;
    return client.paymentTransaction.findUnique({
        where: { id },
        include: { plan: true }
    });
}

/**
 * Memperbarui status transaksi.
 */
export async function updateTransactionStatus(tx, id: string, status: any) {
    const client = tx || db;
    return client.paymentTransaction.update({
        where: { id },
        data: { status },
        include: { plan: true }
    });
}

/**
 * Menambahkan jumlah penggunaan kupon.
 */
export async function incrementCouponUses(tx, id: string) {
    const client = tx || db;
    return client.coupon.update({
        where: { id },
        data: { usedCount: { increment: 1 } }
    });
}

/**
 * Mengambil pengaturan platform global.
 */
export async function findPlatformSettings(tx) {
    const client = tx || db;
    return client.platformSettings.findUnique({
        where: { id: "global" }
    });
}

/**
 * Menghitung jumlah transaksi yang telah disetujui untuk suatu situs.
 */
export async function countApprovedTransactions(tx, siteId: string) {
    const client = tx || db;
    return client.paymentTransaction.count({
        where: {
            siteId,
            status: "approved"
        }
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
