import { db } from "@/modules/shared/core/db";

/**
 * Membuat entri komisi afiliasi baru.
 */
export async function createCommission(client: any, userId: string, amount: number, transactionId: string, description: string) {
    const dbClient = client || db;
    return dbClient.commission.create({
        data: {
            userId,
            amount,
            transactionId,
            description
        }
    });
}

/**
 * Menambahkan saldo afiliasi user.
 */
export async function incrementUserBalance(client: any, userId: string, amount: number) {
    const dbClient = client || db;
    return dbClient.user.update({
        where: { id: userId },
        data: {
            affiliateBalance: {
                increment: amount
            }
        }
    });
}

/**
 * Membuat data penarikan saldo (withdrawal).
 */
export async function createUserWithdrawal(client: any, userId: string, amount: number, bankName: string, accountNumber: string, accountName: string, notes?: string) {
    const dbClient = client || db;
    return dbClient.withdrawal.create({
        data: {
            userId,
            amount,
            bankName,
            accountNumber,
            accountName,
            notes
        }
    });
}

/**
 * Mengurangi saldo afiliasi user.
 */
export async function decrementUserBalance(client: any, userId: string, amount: number) {
    const dbClient = client || db;
    return dbClient.user.update({
        where: { id: userId },
        data: {
            affiliateBalance: {
                decrement: amount
            }
        }
    });
}

/**
 * Memperbarui data referredById (affiliate referrer) milik user.
 */
export async function updateUserReferrer(userId: string, referredById: string) {
    return db.user.update({
        where: { id: userId },
        data: { referredById }
    });
}

/**
 * Mencari user berdasarkan kode referral.
 */
export async function findUserByReferralCode(referralCode: string) {
    return db.user.findUnique({
        where: { referralCode }
    });
}
