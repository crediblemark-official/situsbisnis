import { db } from "@/modules/shared/core/db";

/**
 * Mencari site berdasarkan custom domain (dengan opsional pengecualian ID site tertentu).
 */
export async function findSiteByCustomDomain(domain: string, excludeSiteId?: string) {
    return db.site.findFirst({
        where: {
            customDomain: domain,
            id: excludeSiteId ? { not: excludeSiteId } : undefined
        }
    });
}

/**
 * Memperbarui info custom domain untuk situs tertentu.
 */
export async function updateSiteCustomDomain(siteId: string, domain: string | null, verified = false) {
    return db.site.update({
        where: { id: siteId },
        data: { 
            customDomain: domain,
            customDomainVerified: verified 
        }
    });
}

/**
 * Memperbarui hanya status verifikasi kustom domain situs.
 */
export async function updateSiteCustomDomainVerified(siteId: string, verified: boolean) {
    return db.site.update({
        where: { id: siteId },
        data: {
            customDomainVerified: verified
        }
    });
}

/**
 * Mengambil status kustom domain situs saat ini.
 */
export async function findSiteCustomDomainInfo(siteId: string) {
    return db.site.findUnique({
        where: { id: siteId },
        select: {
            customDomain: true,
            customDomainVerified: true,
            subdomain: true,
            name: true
        }
    });
}
