import { db } from "@/modules/shared/core/db";

/**
 * Menghitung jumlah pesanan di suatu situs.
 */
export async function countOrders(siteId: string): Promise<number> {
    return db.order.count({
        where: { siteId }
    });
}

/**
 * Mencari pesanan berdasarkan ID beserta item dan situsnya.
 */
export async function findOrderById(orderId: string) {
    return db.order.findUnique({
        where: { id: orderId },
        include: {
            items: true
        }
    });
}

/**
 * Mencari pengaturan pembayaran situs.
 */
export async function findPaymentSettings(siteId: string) {
    return db.paymentSettings.findUnique({
        where: { siteId }
    });
}

/**
 * Memproses transaksi atomic pembayaran pesanan via webhook.
 */
export async function processOrderPayment(orderId: string, siteId: string, amount: number, creditOwner: boolean) {
    return db.$transaction(async (tx) => {
        // 1. Update Order Payment Status
        await tx.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: "paid",
                status: "processing"
            }
        });

        if (creditOwner) {
            // 2. Cari owner situs
            const siteOwner = await tx.siteUser.findFirst({
                where: { siteId, role: "owner" },
                select: { userId: true }
            });

            // 3. Tambahkan ke saldo owner
            if (siteOwner) {
                await tx.user.update({
                    where: { id: siteOwner.userId },
                    data: {
                        affiliateBalance: {
                            increment: amount
                        }
                    }
                });
                return { success: true, ownerId: siteOwner.userId };
            }
        }

        return { success: true, ownerId: null };
    });
}

/**
 * Mencari daftar produk untuk situs tertentu.
 */
export async function findProductsForSite(siteId: string, productIds: string[]) {
    return db.product.findMany({
        where: {
            id: { in: productIds },
            siteId
        }
    });
}

/**
 * Membuat entri pesanan baru.
 */
export async function createOrder(data: {
    customerName: string;
    customerEmail: string;
    customerAddress: string;
    total: string;
    status: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    paymentMethod: string;
    siteId: string;
    items: {
        create: Array<{
            productId: string;
            quantity: number;
            price: string;
        }>
    }
}) {
    return db.order.create({
        data,
        include: {
            items: true
        }
    });
}

/**
 * Mencari data situs berdasarkan ID.
 */
export async function findSiteById(id: string) {
    return db.site.findUnique({
        where: { id },
        select: { name: true }
    });
}

/**
 * Mengambil pengaturan platform global.
 */
export async function findPlatformSettings() {
    return db.platformSettings.findUnique({
        where: { id: "global" }
    });
}

/**
 * Memperbarui URL pembayaran dan reference pesanan.
 */
export async function updateOrderPaymentUrl(orderId: string, paymentUrl: string, paymentReference?: string) {
    return db.order.update({
        where: { id: orderId },
        data: {
            paymentUrl,
            paymentReference
        },
        include: {
            items: true
        }
    });
}

/**
 * Memperbarui status pembayaran dan status umum pesanan.
 */
export async function updateOrderPaymentStatus(orderId: string, paymentStatus: string, status?: string) {
    const data: any = { paymentStatus };
    if (status) data.status = status;
    
    return db.order.update({
        where: { id: orderId },
        data
    });
}

/**
 * Mencari pesanan pertama yang cocok dengan ID dan siteId.
 */
export async function findOrderFirst(id: string, siteId: string) {
    return db.order.findFirst({
        where: { id, siteId },
        include: { items: true }
    });
}

/**
 * Memperbarui status fulfillment dan status pembayaran pesanan oleh owner.
 */
export async function updateOrderFulfillment(id: string, data: { paymentStatus?: string, fulfillmentStatus?: string, status?: string }) {
    return db.order.update({
        where: { id },
        data
    });
}

