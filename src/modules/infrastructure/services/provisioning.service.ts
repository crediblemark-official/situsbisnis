import * as provisioningRepo from "../repositories/provisioning.repository";

/**
 * Mendaftarkan dan menyiapkan (provision) situs baru untuk pengguna.
 */
export async function provisionSite(userId: string, siteName: string, subdomain: string) {
    const user = await provisioningRepo.verifyUserExists(userId);
    if (!user) {
        console.error(`[PROVISIONING] User ${userId} not found in database`);
        throw new Error("User not found. Please log out and log in again.");
    }

    const site = await provisioningRepo.executeProvisionSiteTransaction(userId, siteName, subdomain);

    // Invalidasi cache
    try {
        const { revalidateTag } = await import("next/cache");
        revalidateTag("settings", "default");
        revalidateTag(`site-${site.id}`, "default");
        revalidateTag("subscription", "default");
    } catch (cacheError) {
        console.error("[provisionSite] Cache revalidation failed:", cacheError);
    }

    return site;
}
