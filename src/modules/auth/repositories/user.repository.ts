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

/**
 * Mencari user berdasarkan email.
 */
export async function findUserByEmail(email: string) {
    return db.user.findUnique({
        where: { email }
    });
}

/**
 * Mencari user berdasarkan email (kembalian minimal/terbatas).
 */
export async function findUserByEmailLimited(email: string) {
    return db.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, role: true }
    });
}

/**
 * Mencari user berdasarkan nomor telepon.
 */
export async function findUserByPhone(phone: string) {
    return db.user.findUnique({
        where: { phone }
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

/**
 * Membuat user baru.
 */
export async function createUser(data: any) {
    return db.user.create({
        data
    });
}

/**
 * Mengambil semua user (admin platform).
 */
export async function findAllUsers() {
    return db.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            createdAt: true
        }
    });
}

/**
 * Mengambil semua ID user yang terkait dengan site tertentu.
 */
export async function findSiteUserIds(siteId: string) {
    const siteUsers = await db.siteUser.findMany({
        where: { siteId },
        select: { userId: true }
    });
    return siteUsers.map(su => su.userId);
}

/**
 * Mengambil user non-admin yang terhubung ke situs.
 */
export async function findSiteUsersExceptAdmin(userIds: string[]) {
    return db.user.findMany({
        where: {
            id: { in: userIds },
            role: { not: "admin" }
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            createdAt: true
        }
    });
}

/**
 * Mengelompokkan jumlah postingan per pengguna.
 */
export async function countPostsGroupedByAuthor(siteId?: string) {
    return db.post.groupBy({
        by: ["authorId"],
        _count: {
            id: true
        },
        where: {
            ...(siteId ? { siteId } : {}),
            published: true
        }
    });
}

/**
 * Menghubungkan user ke site (siteUser upsert).
 */
export async function upsertSiteUser(siteId: string, userId: string, role: string = "editor") {
    return db.siteUser.upsert({
        where: {
            siteId_userId: {
                siteId,
                userId
            }
        },
        create: {
            siteId,
            userId,
            role
        },
        update: {}
    });
}

/**
 * Menghubungkan user ke site (siteUser create).
 */
export async function createSiteUser(siteId: string, userId: string, role: string = "editor") {
    return db.siteUser.create({
        data: {
            siteId,
            userId,
            role
        }
    });
}

/**
 * Memperbarui data profil user.
 */
export async function updateUser(id: string, data: any) {
    return db.user.update({
        where: { id },
        data
    });
}

/**
 * Mencari relasi siteUser berdasarkan siteId, userId, dan role.
 */
export async function findSiteUserLink(siteId: string, userId: string, role?: string) {
    return db.siteUser.findFirst({
        where: {
            siteId,
            userId,
            ...(role ? { role } : {})
        }
    });
}

/**
 * Menghapus relasi siteUser.
 */
export async function deleteSiteUserLinks(siteId: string, userId: string) {
    return db.siteUser.deleteMany({
        where: {
            siteId,
            userId
        }
    });
}

/**
 * Menghapus semua postingan user.
 */
export async function deleteUserPosts(userId: string) {
    return db.post.deleteMany({
        where: { authorId: userId }
    });
}

/**
 * Menghapus user secara permanen.
 */
export async function deleteUser(userId: string) {
    return db.user.delete({
        where: { id: userId }
    });
}

/**
 * Mengambil seluruh website (sites) yang dimiliki/diakses oleh pengguna.
 */
export async function findUserSites(userId: string) {
    return db.siteUser.findMany({
        where: { userId },
        select: {
            site: {
                select: {
                    id: true,
                    name: true,
                    subdomain: true,
                    customDomain: true,
                }
            }
        }
    });
}

/**
 * Mengambil data detail site.
 */
export async function findSiteById(siteId: string) {
    return db.site.findUnique({
        where: { id: siteId }
    });
}

/**
 * Memperbarui custom domain milik site.
 */
export async function updateSiteCustomDomain(siteId: string, customDomain: string | null) {
    return db.site.update({
        where: { id: siteId },
        data: { customDomain }
    });
}

/**
 * Mengambil subscription aktif untuk suatu site.
 */
export async function findSiteActiveSubscription(siteId: string) {
    return db.subscription.findFirst({
        where: { siteId, status: "active" },
        include: { plan: true }
    });
}


