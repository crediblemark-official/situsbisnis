import { getSiteId } from "@/modules/shared/utils/domains/tenant";
import { SiteClient } from "@/modules/site";
import { DomainClient } from "@/modules/domain";
import { SiteSettings, SiteSettingsUpdate } from "@/types/site-settings";
export type { SiteSettings, SiteSettingsUpdate };

export const getSiteSettings = async (siteId?: string): Promise<SiteSettings> => {
    const id = siteId || await getSiteId();
    return SiteClient.getSiteSettings(id || undefined) as unknown as SiteSettings;
};

export const updateSiteSettings = async (data: SiteSettingsUpdate, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) throw new Error("Site context required");

    return SiteClient.updateSiteSettings(data, id);
};

export const updateSite = async (data: { customDomain?: string | null }, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) throw new Error("Site context required");

    if (data.customDomain !== undefined) {
        if (data.customDomain === null) {
            return DomainClient.removeDomain(id, "");
        } else {
            return DomainClient.registerDomain(id, data.customDomain);
        }
    }
    return null;
};
