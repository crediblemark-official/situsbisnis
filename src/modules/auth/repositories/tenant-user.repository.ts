import { db } from "@/modules/shared/core/db";

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
 * Mengambil seluruh website (sites) yang dimiliki/diakses oleh pengguna.
 */
export async function findUserSites(userId: string) {
    return db.siteUser.findMany({
        where: { userId }
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
