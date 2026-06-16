import { db } from "@/modules/shared/core/db";

/**
 * Mengambil informasi situs dasar berdasarkan ID.
 */
export async function getSiteById(siteId: string) {
    return db.site.findUnique({
        where: { id: siteId },
        select: {
            id: true,
            name: true,
            subdomain: true,
            customDomain: true
        }
    });
}

/**
 * Mengambil informasi kontak WhatsApp dan Telepon dari pengaturan situs.
 */
export async function getSiteContactSettings(siteId: string) {
    return db.siteSettings.findUnique({
        where: { siteId },
        select: {
            whatsappNumber: true,
            contactPhone: true
        }
    });
}

/**
 * Mengecek apakah user terhubung ke site di tabel SiteUser.
 */
export async function countSiteUserLink(siteId: string, userId: string): Promise<number> {
    return db.siteUser.count({
        where: {
            siteId,
            userId
        }
    });
}

/**
 * Menghubungkan user ke site dengan peran (role) tertentu.
 */
export async function upsertSiteUserLink(siteId: string, userId: string, role: string) {
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
        update: {
            role
        }
    });
}

/**
 * Menghapus hubungan user dari site.
 */
export async function deleteSiteUserLink(siteId: string, userId: string) {
    return db.siteUser.deleteMany({
        where: {
            siteId,
            userId
        }
    });
}

/**
 * Mendapatkan seluruh daftar user yang terhubung ke site.
 */
export async function findSiteUsers(siteId: string) {
    return db.siteUser.findMany({
        where: { siteId },
        select: {
            userId: true,
            role: true
        }
    });
}
