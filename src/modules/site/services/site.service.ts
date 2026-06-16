import * as tenantRepo from "../repositories/tenant.repository";

/**
 * Mengecek ketersediaan subdomain.
 * Melempar error jika sudah digunakan.
 */
export async function checkSubdomainAvailability(subdomain: string): Promise<void> {
    const existing = await tenantRepo.findSiteBySubdomain(subdomain);
    if (existing) {
        throw new Error("SUBDOMAIN_TAKEN");
    }
}

/**
 * Mengambil jumlah site yang dimiliki user, berdasarkan siteUser links.
 */
export async function getUserSiteCount(userId: string): Promise<{
    siteIds: string[];
    count: number;
}> {
    const links = await tenantRepo.findSiteUserLinksByUserId(userId);
    return {
        siteIds: links.map(l => l.siteId),
        count: links.length
    };
}

/**
 * Menghapus site berdasarkan ID.
 * Melempar error jika site adalah situs admin platform atau tidak ditemukan.
 */
export async function deleteSite(id: string): Promise<void> {
    const site = await tenantRepo.findSiteById(id);
    if (!site) throw new Error("SITE_NOT_FOUND");
    if (site.subdomain === "admin") throw new Error("CANNOT_DELETE_ADMIN");

    await tenantRepo.deleteSiteById(id);
}

/**
 * Mengambil detail site berdasarkan ID.
 */
export async function getSiteDetail(id: string) {
    const site = await tenantRepo.findSiteById(id);
    if (!site) throw new Error("SITE_NOT_FOUND");
    return site;
}
