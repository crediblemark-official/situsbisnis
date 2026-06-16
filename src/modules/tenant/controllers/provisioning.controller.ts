import * as provisioningService from "../services/provisioning.service";

/**
 * Server Actions / Wrapper internal untuk inisialisasi / provisioning situs baru.
 */
export async function provisionSiteInternal(userId: string, siteName: string, subdomain: string) {
    return provisioningService.provisionSite(userId, siteName, subdomain);
}
