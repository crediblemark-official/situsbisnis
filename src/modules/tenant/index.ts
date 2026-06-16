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
    savePaymentSettingsInternal,
    getSiteDomainInfoInternal
} from "./actions";

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

// Facade / Client kontrak publik modul Tenant
export const TenantClient = {
    // Site info
    getSiteInfo: getSiteInfoInternal,
    getSiteContact: getSiteContactInternal,
    getSiteDetail: getSiteDetailInternal,
    getSiteDomainInfo: getSiteDomainInfoInternal,

    // User-Site access
    verifyUserSiteAccess: verifyUserSiteAccessInternal,
    associateUserToSite: associateUserToSiteInternal,
    disassociateUserFromSite: disassociateUserFromSiteInternal,
    getSiteUserIds: getSiteUserIdsInternal,

    // Site management (admin / onboarding)
    checkSubdomainAvailability: checkSubdomainAvailabilityInternal,
    getUserSiteCount: getUserSiteCountInternal,
    deleteSite: deleteSiteInternal,

    // Contact form
    createContactSubmission: createContactSubmissionInternal,
    getContactSubmissions: getContactSubmissionsInternal,

    // Payment settings
    savePaymentSettings: savePaymentSettingsInternal,
};
