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
} from "./controllers/tenant.controller";
import {
    registerDomainInternal,
    verifyDomainInternal,
    removeDomainInternal
} from "./controllers/domain.controller";
import {
    getSiteSettingsInternal,
    updateSiteSettingsInternal
} from "./controllers/settings.controller";
import {
    provisionSiteInternal
} from "./controllers/provisioning.controller";

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
    provisionSite: provisionSiteInternal,

    // Contact form
    createContactSubmission: createContactSubmissionInternal,
    getContactSubmissions: getContactSubmissionsInternal,
    countContactSubmissions: countContactSubmissionsInternal,

    // Payment settings
    savePaymentSettings: savePaymentSettingsInternal,

    // Site statistics / analytics
    getOrIncrementViews: getOrIncrementViewsInternal,

    // Database health checks
    pingDatabase: pingDatabaseInternal,

    // Custom Domain settings
    registerDomain: registerDomainInternal,
    verifyDomain: verifyDomainInternal,
    removeDomain: removeDomainInternal,

    // Site settings
    getSiteSettings: getSiteSettingsInternal,
    updateSiteSettings: updateSiteSettingsInternal
};
