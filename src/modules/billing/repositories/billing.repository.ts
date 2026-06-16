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
 * Mencari site berdasarkan ID.
 */
export async function findSiteById(id: string) {
    return db.site.findUnique({
        where: { id }
    });
}

/**
 * Mencari kupon berdasarkan kode kupon.
 */
export async function findCouponByCode(code: string) {
    return db.coupon.findUnique({
        where: { code }
    });
}

/**
 * Mencari plan berdasarkan ID.
 */
export async function findPlanById(id: string) {
    return db.plan.findUnique({
        where: { id }
    });
}

/**
 * Mencari transaksi tertunda (pending) yang memiliki bukti pembayaran (awaiting admin review).
 */
export async function findPendingTransactionWithProof(siteId: string) {
    return db.paymentTransaction.findFirst({
        where: {
            siteId,
            status: "pending",
            NOT: {
                OR: [
                    { proofOfPayment: null },
                    { proofOfPayment: "" }
                ]
            }
        }
    });
}

/**
 * Menghapus transaksi tertunda (pending) milik site yang tidak memiliki bukti pembayaran.
 */
export async function deletePendingTransactionsWithoutProof(siteId: string) {
    return db.paymentTransaction.deleteMany({
        where: {
            siteId,
            status: "pending",
            OR: [
                { proofOfPayment: null },
                { proofOfPayment: "" }
            ]
        }
    });
}

/**
 * Membuat transaksi baru dengan status pending.
 */
export async function createPendingTransaction(data: {
    siteId: string;
    planId: string;
    amount: number;
    addonType?: string;
    addonQuantity?: number;
    paymentMethod?: string;
    couponId?: string | null;
}) {
    return db.paymentTransaction.create({
        data: {
            siteId: data.siteId,
            planId: data.planId,
            amount: data.amount,
            addonType: data.addonType,
            addonQuantity: data.addonQuantity,
            status: "pending",
            paymentMethod: data.paymentMethod,
            couponId: data.couponId
        }
    });
}

/**
 * Menghapus transaksi secara permanen.
 */
export async function deleteTransaction(id: string) {
    return db.paymentTransaction.delete({
        where: { id }
    });
}

/**
 * Memperbarui detail pembayaran (URL pembayaran, reference, dan metode) transaksi.
 */
export async function updateTransactionPaymentDetails(id: string, data: {
    paymentUrl: string;
    paymentReference?: string;
    paymentMethod?: string;
}) {
    return db.paymentTransaction.update({
        where: { id },
        data: {
            paymentUrl: data.paymentUrl,
            paymentReference: data.paymentReference,
            paymentMethod: data.paymentMethod
        }
    });
}

/**
 * Memperbarui detail konfirmasi pembayaran manual (catatan dan bukti pembayaran).
 */
export async function updateTransactionConfirmDetails(id: string, data: {
    notes?: string;
    proofOfPayment?: string;
}) {
    return db.paymentTransaction.update({
        where: { id },
        data: {
            notes: data.notes,
            proofOfPayment: data.proofOfPayment
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
 * Mengambil semua paket (plans) terurut berdasarkan harga.
 */
export async function findAllPlans() {
    return db.plan.findMany({
        orderBy: { price: 'asc' },
        select: {
            id: true,
            name: true,
            price: true,
            priceYearly: true,
            interval: true,
            trialDays: true,
            maxSites: true,
            maxPosts: true,
            maxProducts: true,
            addonSiteBilling: true,
            features: true
        }
    });
}

/**
 * Mengambil satu plan berdasarkan nama (case-insensitive).
 */
export async function findPlanByName(name: string) {
    return db.plan.findFirst({
        where: { name: { equals: name, mode: "insensitive" } }
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


/**
 * Mengambil seluruh data kupon yang terurut berdasarkan tanggal dibuat.
 */
export async function findAllCoupons() {
    return db.coupon.findMany({
        orderBy: {
            createdAt: "desc"
        }
    });
}

/**
 * Membuat kupon baru.
 */
export async function createCoupon(data: any) {
    return db.coupon.create({
        data
    });
}

/**
 * Mencari kupon berdasarkan ID.
 */
export async function findCouponById(id: string) {
    return db.coupon.findUnique({
        where: { id }
    });
}

/**
 * Memperbarui kupon.
 */
export async function updateCoupon(id: string, data: any) {
    return db.coupon.update({
        where: { id },
        data
    });
}

/**
 * Menghapus kupon.
 */
export async function deleteCoupon(id: string) {
    return db.coupon.delete({
        where: { id }
    });
}

/**
 * Mencari request penarikan saldo (withdrawal) berdasarkan ID.
 */
export async function findWithdrawalById(id: string) {
    return db.withdrawal.findUnique({
        where: { id }
    });
}

/**
 * Memperbarui data penarikan saldo (withdrawal).
 */
export async function updateWithdrawal(tx, id: string, data: any) {
    const client = tx || db;
    return client.withdrawal.update({
        where: { id },
        data,
        include: { user: true }
    });
}

/**
 * Mengembalikan dana (affiliateBalance increment) kepada user.
 */
export async function incrementUserBalance(tx, userId: string, amount: number) {
    const client = tx || db;
    return client.user.update({
        where: { id: userId },
        data: {
            affiliateBalance: {
                increment: amount
            }
        }
    });
}

/**
 * Membuat transaksi upgrade paket premium.
 */
export async function createUpgradeTransaction(data: {
    siteId: string;
    planId: string;
    amount: number;
    couponId: string | null;
    paymentMethod: string;
}) {
    return db.paymentTransaction.create({
        data: {
            siteId: data.siteId,
            planId: data.planId,
            amount: data.amount,
            status: "pending",
            couponId: data.couponId,
            paymentMethod: data.paymentMethod
        }
    });
}



