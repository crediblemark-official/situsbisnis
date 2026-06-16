import * as tenantRepo from "../repositories/tenant.repository";
import { SiteInfo, SiteContactInfo } from "../index";

/**
 * Mendapatkan informasi dasar situs.
 */
export async function getSiteInfo(siteId: string): Promise<SiteInfo | null> {
    return tenantRepo.getSiteById(siteId);
}

/**
 * Mendapatkan informasi domain custom situs.
 */
export async function getSiteDomainInfo(siteId: string) {
    return tenantRepo.getSiteDomainInfo(siteId);
}

/**
 * Mendapatkan detail kontak situs.
 */
export async function getSiteContact(siteId: string): Promise<SiteContactInfo | null> {
    const contact = await tenantRepo.getSiteContactSettings(siteId);
    return contact || null;
}

/**
 * Memverifikasi hak akses user ke site.
 */
export async function verifyUserSiteAccess(userId: string, siteId: string): Promise<boolean> {
    const count = await tenantRepo.countSiteUserLink(siteId, userId);
    return count > 0;
}

/**
 * Menghubungkan user ke site (misal onboarding atau penambahan user baru).
 */
export async function associateUserToSite(userId: string, siteId: string, role = "owner") {
    return tenantRepo.upsertSiteUserLink(siteId, userId, role);
}

/**
 * Memutuskan hubungan user dari site.
 */
export async function disassociateUserFromSite(userId: string, siteId: string) {
    return tenantRepo.deleteSiteUserLink(siteId, userId);
}

/**
 * Mendapatkan ID seluruh user yang terhubung ke site.
 */
export async function getSiteUserIds(siteId: string): Promise<string[]> {
    const links = await tenantRepo.findSiteUsers(siteId);
    return links.map(link => link.userId);
}
