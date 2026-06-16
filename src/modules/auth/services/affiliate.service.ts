import * as affiliateRepo from "../repositories/affiliate.repository";
import { AwardCommissionDTO } from "../index";
import { db } from "@/modules/shared/core/db";

/**
 * Memberikan komisi afiliasi kepada referrer user.
 */
export async function awardAffiliateCommission(
    dbClient: any,
    data: AwardCommissionDTO
): Promise<void> {
    const client = dbClient || db;
    await affiliateRepo.createCommission(client, data.userId, data.amount, data.transactionId, data.description);
    await affiliateRepo.incrementUserBalance(client, data.userId, data.amount);
}

/**
 * Memproses permintaan penarikan dana afiliasi (withdrawal).
 */
export async function requestAffiliateWithdrawal(
    userId: string,
    amount: number,
    bankName: string,
    accountNumber: string,
    accountName: string,
    notes?: string
) {
    return db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { affiliateBalance: true }
        });

        if (!user) {
            throw new Error("User tidak ditemukan.");
        }

        const balance = Number(user.affiliateBalance);
        if (balance < amount) {
            throw new Error("Saldo Anda tidak mencukupi untuk melakukan penarikan.");
        }

        await affiliateRepo.decrementUserBalance(tx, userId, amount);

        const withdrawal = await affiliateRepo.createUserWithdrawal(
            tx,
            userId,
            amount,
            bankName,
            accountNumber,
            accountName,
            notes
        );

        return withdrawal;
    });
}

/**
 * Memeriksa status keuangan afiliasi milik user.
 */
export async function checkAffiliateStatus(userId: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            affiliateBalance: true,
            referralCode: true
        }
    });

    if (!user) return null;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: Number(user.affiliateBalance),
        referralCode: user.referralCode
    };
}

/**
 * Memperbarui referrer afiliasi seorang user.
 */
export async function updateUserReferrer(userId: string, referredById: string): Promise<void> {
    await affiliateRepo.updateUserReferrer(userId, referredById);
}

/**
 * Memeriksa keberadaan kode referral.
 */
export async function checkReferralCode(code: string): Promise<{ exists: boolean; name?: string | null }> {
    const user = await affiliateRepo.findUserByReferralCode(code);
    if (!user) {
        return { exists: false };
    }
    return { exists: true, name: user.name };
}
