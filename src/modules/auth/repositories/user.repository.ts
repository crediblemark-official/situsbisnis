import { db } from "@/modules/shared/core/db";

/**
 * Mengambil data user berdasarkan ID.
 */
export async function findUserById(userId: string) {
    return db.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
        }
    });
}

/**
 * Mengambil banyak user berdasarkan daftar ID.
 */
export async function findUsersByIds(userIds: string[]) {
    return db.user.findMany({
        where: { id: { in: userIds } },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
        }
    });
}

/**
 * Mencari user owner (pemilik) dari suatu site di database via SiteUser.
 */
export async function findSiteUserOwner(siteId: string) {
    const siteUser = await db.siteUser.findFirst({
        where: {
            siteId,
            role: "owner"
        },
        select: {
            userId: true
        }
    });
    if (!siteUser) return null;

    return db.user.findUnique({
        where: { id: siteUser.userId },
        select: {
            id: true,
            email: true,
            name: true,
            referredById: true
        }
    });
}

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

