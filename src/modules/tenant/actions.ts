import * as tenantService from "./services/tenant.service";
import { SiteInfo, SiteContactInfo } from "./index";

/**
 * Server Actions / Wrapper internal untuk mengambil info site.
 */
export async function getSiteInfoInternal(siteId: string): Promise<SiteInfo | null> {
    return tenantService.getSiteInfo(siteId);
}

/**
 * Server Actions / Wrapper internal untuk mengambil kontak site.
 */
export async function getSiteContactInternal(siteId: string): Promise<SiteContactInfo | null> {
    return tenantService.getSiteContact(siteId);
}

/**
 * Server Actions / Wrapper internal untuk verifikasi akses site.
 */
export async function verifyUserSiteAccessInternal(userId: string, siteId: string): Promise<boolean> {
    return tenantService.verifyUserSiteAccess(userId, siteId);
}

/**
 * Server Actions / Wrapper internal untuk mengaitkan user ke site.
 */
export async function associateUserToSiteInternal(userId: string, siteId: string, role = "owner") {
    return tenantService.associateUserToSite(userId, siteId, role);
}

/**
 * Server Actions / Wrapper internal untuk memutuskan kaitan user ke site.
 */
export async function disassociateUserFromSiteInternal(userId: string, siteId: string) {
    return tenantService.disassociateUserFromSite(userId, siteId);
}

/**
 * Server Actions / Wrapper internal untuk mendapatkan seluruh ID user yang terhubung ke site.
 */
export async function getSiteUserIdsInternal(siteId: string): Promise<string[]> {
    return tenantService.getSiteUserIds(siteId);
}
