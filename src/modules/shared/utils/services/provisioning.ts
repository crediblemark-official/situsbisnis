import { TenantClient } from "@/modules/tenant";

/**
 * Proxy delegator ke TenantClient untuk inisialisasi / provisioning situs baru.
 * Digunakan selama proses onboarding pengguna.
 */
export async function provisionSite(userId: string, siteName: string, subdomain: string) {
    return TenantClient.provisionSite(userId, siteName, subdomain);
}
