import { db } from "@/lib/core/db";

export interface SiteInfo {
    id: string;
    name: string;
    subdomain: string;
    customDomain: string | null;
}

export interface SiteContactInfo {
    whatsappNumber: string | null;
    contactPhone: string | null;
}

export const TenantClient = {
    /**
     * Mengambil informasi dasar situs berdasarkan siteId.
     */
    async getSiteInfo(siteId: string): Promise<SiteInfo | null> {
        return db.site.findUnique({
            where: { id: siteId },
            select: {
                id: true,
                name: true,
                subdomain: true,
                customDomain: true
            }
        });
    },

    /**
     * Mengambil informasi kontak (nomor WhatsApp dan kontak telepon) untuk notifikasi.
     */
    async getSiteContact(siteId: string): Promise<SiteContactInfo | null> {
        const settings = await db.siteSettings.findUnique({
            where: { siteId },
            select: {
                whatsappNumber: true,
                contactPhone: true
            }
        });
        return settings || null;
    }
};
