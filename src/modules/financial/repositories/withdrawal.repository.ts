import { db } from "@/modules/shared/core/db";

/**
 * Mencari request penarikan saldo (withdrawal) berdasarkan ID.
 */
export async function findWithdrawalById(id: string) {
    return db.withdrawal.findUnique({
        where: { id }
    });
}

/**
 * Mencari request penarikan saldo (withdrawal) berdasarkan ID dengan Prisma transaction client.
 */
export async function findWithdrawalByIdTx(tx: any, id: string) {
    const client = tx || db;
    return client.withdrawal.findUnique({
        where: { id }
    });
}

/**
 * Memperbarui data penarikan saldo (withdrawal).
 */
export async function updateWithdrawal(tx: any, id: string, data: any) {
    const client = tx || db;
    return client.withdrawal.update({
        where: { id },
        data
    });
}

/**
 * Mengembalikan dana (affiliateBalance increment) kepada user.
 */
export async function incrementUserBalance(tx: any, userId: string, amount: number) {
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
