import { db } from "@/modules/shared/core/db";

/**
 * Mencari data Site beserta relasi SiteSettings.
 */
export async function findSiteWithSettings(siteId: string) {
    return db.site.findUnique({
        where: { id: siteId },
        select: {
            name: true,
            logoUrl: true,
            faviconUrl: true,
            description: true,
            siteSettings: true
        }
    });
}

/**
 * Mencari data Site admin platform beserta SiteSettings.
 */
export async function findAdminSiteWithSettings() {
    return db.site.findUnique({
        where: { subdomain: "admin" },
        select: {
            id: true,
            name: true,
            logoUrl: true,
            description: true,
            siteSettings: true
        }
    });
}

/**
 * Memperbarui properti pada tabel Site.
 */
export async function updateSiteModel(siteId: string, data: {
    name?: string;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    description?: string | null;
    customDomain?: string | null;
    customDomainVerified?: boolean;
}) {
    return db.site.update({
        where: { id: siteId },
        data
    });
}

/**
 * Mengambil data SiteSettings saja berdasarkan siteId.
 */
export async function findSiteSettingsOnly(siteId: string) {
    return db.siteSettings.findUnique({
        where: { siteId },
        select: { themeConfig: true }
    });
}

/**
 * Memperbarui tabel SiteSettings.
 */
export async function updateSiteSettingsModel(siteId: string, data: any) {
    return db.siteSettings.update({
        where: { siteId },
        data
    });
}

/**
 * Upsert mata uang di PaymentSettings agar selaras dengan checkout.
 */
export async function upsertPaymentSettingsCurrency(siteId: string, currency: string) {
    return db.paymentSettings.upsert({
        where: { siteId },
        update: { currency },
        create: {
            siteId,
            currency,
            bankName: "",
            accountNumber: "",
            accountHolder: ""
        }
    });
}
