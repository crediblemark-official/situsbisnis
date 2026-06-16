import * as tenantService from "./services/tenant.service";
import * as siteService from "./services/site.service";
import * as contactService from "./services/contact.service";
import * as analyticsService from "./services/analytics.service";
import { SiteInfo, SiteContactInfo } from "./index";

/**
 * Server Actions / Wrapper internal untuk mengambil info site.
 */
export async function getSiteInfoInternal(siteId: string): Promise<SiteInfo | null> {
    return tenantService.getSiteInfo(siteId);
}

/**
 * Server Actions / Wrapper internal untuk mengambil info domain custom situs.
 */
export async function getSiteDomainInfoInternal(siteId: string) {
    return tenantService.getSiteDomainInfo(siteId);
}

/**
 * Server Actions / Wrapper internal untuk mengambil kontak site.
 */
export async function getSiteContactInternal(siteId: string): Promise<SiteContactInfo | null> {
    return tenantService.getSiteContact(siteId);
}

/**
 * Server Actions / Wrapper internal untuk verifikasi akses site.
 */
export async function verifyUserSiteAccessInternal(userId: string, siteId: string): Promise<boolean> {
    return tenantService.verifyUserSiteAccess(userId, siteId);
}

/**
 * Server Actions / Wrapper internal untuk mengaitkan user ke site.
 */
export async function associateUserToSiteInternal(userId: string, siteId: string, role = "owner") {
    return tenantService.associateUserToSite(userId, siteId, role);
}

/**
 * Server Actions / Wrapper internal untuk memutuskan kaitan user ke site.
 */
export async function disassociateUserFromSiteInternal(userId: string, siteId: string) {
    return tenantService.disassociateUserFromSite(userId, siteId);
}

/**
 * Server Actions / Wrapper internal untuk mendapatkan seluruh ID user yang terhubung ke site.
 */
export async function getSiteUserIdsInternal(siteId: string): Promise<string[]> {
    return tenantService.getSiteUserIds(siteId);
}

/**
 * Mengecek ketersediaan subdomain saat onboarding.
 * Melempar error jika sudah digunakan.
 */
export async function checkSubdomainAvailabilityInternal(subdomain: string): Promise<void> {
    return siteService.checkSubdomainAvailability(subdomain);
}

/**
 * Mengambil jumlah site yang dimiliki user beserta daftar siteId-nya.
 */
export async function getUserSiteCountInternal(userId: string) {
    return siteService.getUserSiteCount(userId);
}

/**
 * Menghapus site berdasarkan ID (admin only).
 */
export async function deleteSiteInternal(id: string): Promise<void> {
    return siteService.deleteSite(id);
}

/**
 * Mengambil detail site berdasarkan ID.
 */
export async function getSiteDetailInternal(id: string) {
    return siteService.getSiteDetail(id);
}

/**
 * Membuat contact submission baru.
 */
export async function createContactSubmissionInternal(siteId: string, data: {
    name: string;
    email: string;
    subject?: string;
    message: string;
}) {
    return contactService.createContactSubmission(siteId, data);
}

/**
 * Mengambil daftar contact submission untuk suatu situs.
 */
export async function getContactSubmissionsInternal(siteId: string) {
    return contactService.getContactSubmissions(siteId);
}

/**
 * Menyimpan pengaturan pembayaran untuk suatu situs.
 */
export async function savePaymentSettingsInternal(siteId: string, data: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    currency?: string;
    instructions?: string;
}) {
    return contactService.savePaymentSettings(siteId, data);
}

/**
 * Mencatat dan mengambil statistik kunjungan halaman situs.
 */
export async function getOrIncrementViewsInternal(siteId: string) {
    return analyticsService.getOrIncrementViews(siteId);
}

export async function pingDatabaseInternal(): Promise<boolean> {
    return tenantService.pingDatabase();
}

