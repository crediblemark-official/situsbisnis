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
 * Mengambil informasi domain custom (status verifikasi) untuk suatu situs.
 */
export async function getSiteDomainInfo(siteId: string) {
    return db.site.findUnique({
        where: { id: siteId },
        select: {
            customDomain: true,
            customDomainVerified: true
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

/**
 * Mencari site berdasarkan subdomain.
 */
export async function findSiteBySubdomain(subdomain: string) {
    return db.site.findUnique({
        where: { subdomain }
    });
}

/**
 * Mengambil site-site yang terhubung ke user berdasarkan userId.
 */
export async function findSiteUserLinksByUserId(userId: string) {
    return db.siteUser.findMany({
        where: { userId },
        select: { siteId: true }
    });
}

/**
 * Mengambil site-site yang terhubung ke user berdasarkan userId dan role tertentu.
 */
export async function findSiteUserLinksByUserIdAndRole(userId: string, role: string) {
    return db.siteUser.findMany({
        where: { userId, role },
        select: { siteId: true }
    });
}

/**
 * Menghapus site beserta semua data yang terhubung (cascade manual untuk constraint RESTRICT).
 */
export async function deleteSiteById(id: string) {
    // Hapus OrderItem dahulu untuk satisfi foreign key RESTRICT
    await db.orderItem.deleteMany({
        where: { order: { siteId: id } }
    });
    return db.site.delete({ where: { id } });
}

/**
 * Mencari site berdasarkan ID (detail penuh).
 */
export async function findSiteById(id: string) {
    return db.site.findUnique({ where: { id } });
}

/**
 * Memperbarui data site.
 */
export async function updateSiteById(id: string, data: Record<string, unknown>) {
    return db.site.update({
        where: { id },
        data: data as any
    });
}

/**
 * Membuat contact submission baru.
 */
export async function createContactSubmission(data: {
    siteId: string;
    name: string;
    email: string;
    subject?: string;
    message: string;
}) {
    return db.contactSubmission.create({ data });
}

/**
 * Mengambil daftar contact submission berdasarkan siteId.
 */
export async function findContactSubmissions(siteId: string, options?: { skip?: number; take?: number }) {
    return db.contactSubmission.findMany({
        where: { siteId },
        orderBy: { createdAt: 'desc' },
        skip: options?.skip,
        take: options?.take,
        select: {
            id: true,
            name: true,
            email: true,
            subject: true,
            message: true,
            status: true,
            createdAt: true,
            siteId: true,
        }
    });
}

/**
 * Menghitung total contact submission berdasarkan siteId.
 */
export async function countContactSubmissions(siteId: string): Promise<number> {
    return db.contactSubmission.count({
        where: { siteId }
    });
}

/**
 * Mengambil pengaturan payment berdasarkan siteId.
 */
export async function upsertPaymentSettings(siteId: string, data: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    currency?: string;
    instructions?: string;
    gatewayEnabled?: boolean;
    manualEnabled?: boolean;
}) {
    return db.paymentSettings.upsert({
        where: { siteId },
        update: { ...data, updatedAt: new Date() },
        create: {
            site: { connect: { id: siteId } },
            ...data
        } as any
    });
}

/**
 * Mencari data statistik situs berdasarkan siteId.
 */
export async function findSiteStatistics(siteId: string) {
    return db.siteStatistics.findUnique({
        where: { siteId }
    });
}

/**
 * Membuat data statistik situs baru.
 */
export async function createSiteStatistics(data: {
    siteId: string;
    totalViews: number;
    todayViews: number;
    lastUpdated: Date;
}) {
    return db.siteStatistics.create({ data });
}

/**
 * Memperbarui data statistik berdasarkan ID.
 */
export async function updateSiteStatistics(id: string, data: Record<string, unknown>) {
    return db.siteStatistics.update({
        where: { id },
        data: data as any
    });
}

/**
 * Melakukan upsert data statistik berdasarkan siteId.
 */
export async function upsertSiteStatistics(siteId: string, data: {
    totalViews: number;
    todayViews: number;
    lastUpdated: Date;
}) {
    return db.siteStatistics.upsert({
        where: { siteId },
        create: {
            siteId,
            ...data
        },
        update: data
    });
}

/**
 * Melakukan ping/raw query ke database untuk check health status.
 */
export async function pingDatabase(): Promise<boolean> {
    try {
        await db.$queryRaw`SELECT 1`;
        return true;
    } catch {
        return false;
    }
}


