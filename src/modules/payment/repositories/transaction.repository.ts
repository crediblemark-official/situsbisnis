import { db } from "@/modules/shared/core/db";

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

export async function findPendingTransactionWithProofTx(tx: any, siteId: string) {
    return tx.paymentTransaction.findFirst({
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

export async function deletePendingTransactionsWithoutProofTx(tx: any, siteId: string) {
    return tx.paymentTransaction.deleteMany({
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

export async function createPendingTransactionTx(tx: any, data: {
    siteId: string;
    planId: string;
    amount: number;
    addonType?: string;
    addonQuantity?: number;
    paymentMethod?: string;
    couponId?: string | null;
}) {
    return tx.paymentTransaction.create({
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

export async function createUpgradeTransactionTx(tx: any, data: {
    siteId: string;
    planId: string;
    amount: number;
    couponId: string | null;
    paymentMethod: string;
}) {
    return tx.paymentTransaction.create({
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
