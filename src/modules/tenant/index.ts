import { getSiteInfoInternal, getSiteContactInternal } from "./actions";

export interface SiteInfo {
    id: string;
    name: string;
    subdomain: string;
    customDomain: string | null;
}

export interface SiteContactInfo {
    whatsappNumber: string | null;
    contactPhone: string | null;
}

// Facade / Client kontrak publik
export const TenantClient = {
    getSiteInfo: getSiteInfoInternal,
    getSiteContact: getSiteContactInternal
};
