import {
    getSiteInfoInternal,
    getSiteContactInternal,
    verifyUserSiteAccessInternal,
    associateUserToSiteInternal,
    disassociateUserFromSiteInternal,
    getSiteUserIdsInternal,
    checkSubdomainAvailabilityInternal,
    getUserSiteCountInternal,
    deleteSiteInternal,
    getSiteDetailInternal,
    createContactSubmissionInternal,
    getContactSubmissionsInternal,
    countContactSubmissionsInternal,
    savePaymentSettingsInternal,
    getSiteDomainInfoInternal,
    getOrIncrementViewsInternal,
    pingDatabaseInternal
} from "./controllers/site.controller";
import {
    getSiteSettingsInternal,
    updateSiteSettingsInternal
} from "./controllers/settings.controller";

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
    getSiteInfo: getSiteInfoInternal,
    getSiteContact: getSiteContactInternal,
    getSiteDetail: getSiteDetailInternal,
    getSiteDomainInfo: getSiteDomainInfoInternal,

    verifyUserSiteAccess: verifyUserSiteAccessInternal,
    associateUserToSite: associateUserToSiteInternal,
    disassociateUserFromSite: disassociateUserFromSiteInternal,
    getSiteUserIds: getSiteUserIdsInternal,

    checkSubdomainAvailability: checkSubdomainAvailabilityInternal,
    getUserSiteCount: getUserSiteCountInternal,
    deleteSite: deleteSiteInternal,

    createContactSubmission: createContactSubmissionInternal,
    getContactSubmissions: getContactSubmissionsInternal,
    countContactSubmissions: countContactSubmissionsInternal,

    savePaymentSettings: savePaymentSettingsInternal,

    getOrIncrementViews: getOrIncrementViewsInternal,

    pingDatabase: pingDatabaseInternal,

    getSiteSettings: getSiteSettingsInternal,
    updateSiteSettings: updateSiteSettingsInternal
};

export { default as ThemeClientUtilities } from "./ui/site/ThemeClientUtilities";
