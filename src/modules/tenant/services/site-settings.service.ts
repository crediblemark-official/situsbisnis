import { getSiteId } from "@/modules/shared/utils/domains/tenant";
import { TenantClient } from "@/modules/tenant";
import { SiteSettings, SiteSettingsUpdate } from "@/types/site-settings";
export type { SiteSettings, SiteSettingsUpdate };

/**
 * Proxy delegator ke TenantClient untuk mengambil pengaturan situs.
 */
export const getSiteSettings = async (siteId?: string): Promise<SiteSettings> => {
    const id = siteId || await getSiteId();
    return TenantClient.getSiteSettings(id || undefined) as unknown as SiteSettings;
};

/**
 * Proxy delegator ke TenantClient untuk memperbarui pengaturan situs.
 */
export const updateSiteSettings = async (data: SiteSettingsUpdate, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) throw new Error("Site context required");

    return TenantClient.updateSiteSettings(data, id);
};

/**
 * Proxy delegator ke TenantClient untuk memperbarui properti domain situs.
 */
export const updateSite = async (data: { customDomain?: string | null }, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) throw new Error("Site context required");

    if (data.customDomain !== undefined) {
        if (data.customDomain === null) {
            return TenantClient.removeDomain(id, "");
        } else {
            return TenantClient.registerDomain(id, data.customDomain);
        }
    }
    return null;
};
