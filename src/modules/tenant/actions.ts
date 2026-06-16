import { db } from "@/modules/shared/core/db";
import { SiteInfo, SiteContactInfo } from "./index";

/**
 * Mengambil informasi dasar situs berdasarkan siteId.
 */
export async function getSiteInfoInternal(siteId: string): Promise<SiteInfo | null> {
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
 * Mengambil informasi kontak (nomor WhatsApp dan kontak telepon) untuk notifikasi.
 */
export async function getSiteContactInternal(siteId: string): Promise<SiteContactInfo | null> {
    const settings = await db.siteSettings.findUnique({
        where: { siteId },
        select: {
            whatsappNumber: true,
            contactPhone: true
        }
    });
    return settings || null;
}
