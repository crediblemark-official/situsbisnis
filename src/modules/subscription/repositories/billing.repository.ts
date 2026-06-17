import { db } from "@/modules/shared/core/db";

/**
 * Mengambil pengaturan platform global.
 */
export async function findPlatformSettings(tx) {
    const client = tx || db;
    return client.platformSettings.findUnique({
        where: { id: "global" }
    });
}

/**
 * Upsert platform settings (untuk update konfigurasi storage, AI, dsb).
 */
export async function upsertPlatformSettings(data: Record<string, unknown>) {
    return db.platformSettings.upsert({
        where: { id: "global" },
        update: data as any,
        create: { id: "global", ...(data as any) }
    });
}

/**
 * Menghapus semua payment methods untuk siteId tertentu.
 */
export async function deletePaymentMethodsBySite(siteId: string) {
    return db.paymentSettings.deleteMany({ where: { siteId } });
}

/**
 * Membuat payment methods dalam jumlah banyak.
 */
export async function bulkCreatePaymentMethods(data: Array<{
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    instructions?: string | null;
    siteId: string;
}>) {
    return db.paymentSettings.createMany({ data });
}

/**
 * Mencari situs admin berdasarkan subdomain "admin".
 */
export async function findAdminSite() {
    return db.site.findUnique({ where: { subdomain: "admin" } });
}

/**
 * Update pengaturan situs admin (nama, siteSettings).
 */
export async function updateAdminSiteSettings(adminSiteId: string, data: {
    siteName?: string;
    contactEmail?: string;
    contactPhone?: string;
    whatsappNumber?: string;
    footerAddress?: string;
    allowRegistration?: boolean;
}) {
    return db.site.update({
        where: { id: adminSiteId },
        data: {
            name: data.siteName,
            siteSettings: {
                upsert: {
                    create: data as any,
                    update: data as any
                }
            }
        }
    });
}

/**
 * Mencari site berdasarkan ID.
 */
export async function findSiteById(id: string) {
    return db.site.findUnique({
        where: { id }
    });
}

/**
 * Mencari request penarikan saldo (withdrawal) berdasarkan ID.
 */
export async function findWithdrawalById(id: string) {
    return db.withdrawal.findUnique({
        where: { id }
    });
}

/**
 * Memperbarui data penarikan saldo (withdrawal).
 */
export async function updateWithdrawal(tx, id: string, data: any) {
    const client = tx || db;
    return client.withdrawal.update({
        where: { id },
        data
    });
}

/**
 * Mengembalikan dana (affiliateBalance increment) kepada user.
 */
export async function incrementUserBalance(tx, userId: string, amount: number) {
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
