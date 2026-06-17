import {
    getSiteInfo,
    getSiteContact,
    verifyUserSiteAccess,
    associateUserToSite,
    disassociateUserFromSite,
    getSiteUserIds,
    getSiteDomainInfo,
    pingDatabase
} from "./services/tenant.service";
export * from "./actions/site.actions";
import {
    checkSubdomainAvailability,
    getUserSiteCount,
    deleteSite,
    getSiteDetail
} from "./services/site.service";
import {
    createContactSubmission,
    getContactSubmissions,
    countContactSubmissions,
    savePaymentSettings
} from "./services/contact.service";
import {
    getOrIncrementViews
} from "./services/analytics.service";
import {
    getSiteSettings,
    updateSiteSettings
} from "./services/settings.service";

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

export const SiteClient = {
    getSiteInfo,
    getSiteContact,
    getSiteDetail,
    getSiteDomainInfo,

    verifyUserSiteAccess,
    associateUserToSite,
    disassociateUserFromSite,
    getSiteUserIds,

    checkSubdomainAvailability,
    getUserSiteCount,
    deleteSite,

    createContactSubmission,
    getContactSubmissions,
    countContactSubmissions,

    savePaymentSettings,

    getOrIncrementViews,

    pingDatabase,

    getSiteSettings,
    updateSiteSettings
};

export { default as ThemeClientUtilities } from "./ui/site/ThemeClientUtilities";
