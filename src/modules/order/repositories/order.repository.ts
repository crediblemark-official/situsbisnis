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
