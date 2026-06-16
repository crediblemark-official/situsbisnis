import * as userRepo from "../repositories/user.repository";
import { SiteOwnerInfo, UserDTO, AwardCommissionDTO } from "../index";
import { db } from "@/modules/shared/core/db";

/**
 * Mendapatkan pemilik site.
 */
export async function getSiteOwner(siteId: string): Promise<SiteOwnerInfo | null> {
    return userRepo.findSiteUserOwner(siteId);
}

/**
 * Mendapatkan data user berdasarkan ID.
 */
export async function getUserById(userId: string): Promise<UserDTO | null> {
    const user = await userRepo.findUserById(userId);
    return user as UserDTO | null;
}

/**
 * Mendapatkan map dari banyak user.
 */
export async function getUsersMap(userIds: string[]): Promise<Record<string, UserDTO>> {
    if (userIds.length === 0) return {};
    const users = await userRepo.findUsersByIds(userIds);
    
    const resultMap: Record<string, UserDTO> = {};
    users.forEach(u => {
        resultMap[u.id] = u as UserDTO;
    });
    return resultMap;
}

/**
 * Memberikan komisi afiliasi kepada referrer user.
 */
export async function awardAffiliateCommission(
    dbClient: any,
    data: AwardCommissionDTO
): Promise<void> {
    const client = dbClient || db;
    await userRepo.createCommission(client, data.userId, data.amount, data.transactionId, data.description);
    await userRepo.incrementUserBalance(client, data.userId, data.amount);
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
    // Jalankan dalam transaction database agar atomic (mengurangi saldo dan membuat log withdrawal)
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

        // 1. Kurangi saldo user
        await userRepo.decrementUserBalance(tx, userId, amount);

        // 2. Buat log request penarikan
        const withdrawal = await userRepo.createUserWithdrawal(
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
