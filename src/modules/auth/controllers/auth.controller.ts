import * as authService from "../services/auth.service";
import { SiteOwnerInfo, UserDTO, AwardCommissionDTO } from "../index";

/**
 * Mendapatkan pemilik site.
 */
export async function getSiteOwnerInternal(siteId: string): Promise<SiteOwnerInfo | null> {
    return authService.getSiteOwner(siteId);
}

/**
 * Mendapatkan data user berdasarkan ID.
 */
export async function getUserByIdInternal(userId: string): Promise<UserDTO | null> {
    return authService.getUserById(userId);
}

/**
 * Mendapatkan map dari banyak user.
 */
export async function getUsersMapInternal(userIds: string[]): Promise<Record<string, UserDTO>> {
    return authService.getUsersMap(userIds);
}

/**
 * Memberikan komisi afiliasi kepada referrer user.
 */
export async function awardAffiliateCommissionInternal(
    dbClient: any,
    data: AwardCommissionDTO
): Promise<void> {
    return authService.awardAffiliateCommission(dbClient, data);
}

/**
 * Memproses permintaan penarikan dana afiliasi (withdrawal).
 */
export async function requestAffiliateWithdrawalInternal(
    userId: string,
    amount: number,
    bankName: string,
    accountNumber: string,
    accountName: string,
    notes?: string
) {
    return authService.requestAffiliateWithdrawal(userId, amount, bankName, accountNumber, accountName, notes);
}

/**
 * Memeriksa status keuangan afiliasi milik user.
 */
export async function checkAffiliateStatusInternal(userId: string) {
    return authService.checkAffiliateStatus(userId);
}

/**
 * Memperbarui referrer afiliasi seorang user.
 */
export async function updateUserReferrerInternal(userId: string, referredById: string): Promise<void> {
    return authService.updateUserReferrer(userId, referredById);
}

/**
 * Memeriksa keberadaan kode referral.
 */
export async function checkReferralCodeInternal(code: string): Promise<{ exists: boolean; name?: string | null }> {
    return authService.checkReferralCode(code);
}


/**
 * Registrasi user baru (SaaS onboarding).
 */
export async function registerUserInternal(body: any, referralCodeFromCookie?: string) {
    return authService.registerUser(body, referralCodeFromCookie);
}

/**
 * Validasi bridge token HMAC untuk login lintas subdomain.
 */
export async function verifyBridgeTokenInternal(token: string) {
    return authService.verifyBridgeToken(token);
}

/**
 * Mengubah data profil user sendiri (nama & ganti password).
 */
export async function updateUserProfileInternal(email: string, body: any) {
    return authService.updateUserProfile(email, body);
}

/**
 * Mengambil daftar user di level platform (admin) atau di level site (owner/editor).
 */
export async function getUsersInternal(sessionRole: string, isTenantContext: boolean, siteId?: string) {
    return authService.getUsers(sessionRole, isTenantContext, siteId);
}

/**
 * Membuat user baru oleh admin atau owner.
 */
export async function createUserByAdminInternal(siteId: string | undefined, data: any, sessionRole: string) {
    return authService.createUserByAdmin(siteId, data, sessionRole);
}

/**
 * Memperbarui user oleh admin atau owner.
 */
export async function updateUserByAdminInternal(
    userId: string,
    siteId: string | undefined,
    data: any,
    sessionUserId: string,
    sessionRole: string
) {
    return authService.updateUserByAdmin(userId, siteId, data, sessionUserId, sessionRole);
}

/**
 * Menghapus/menghilangkan user oleh admin atau owner.
 */
export async function deleteUserByAdminInternal(
    userId: string,
    siteId: string | undefined,
    sessionUserId: string,
    sessionRole: string
) {
    return authService.deleteUserByAdmin(userId, siteId, sessionUserId, sessionRole);
}

/**
 * Mengambil daftar site yang dimiliki user.
 */
export async function getUserSitesInternal(userId: string) {
    return authService.getUserSites(userId);
}

/**
 * Mengubah kustom domain milik site.
 */
export async function updateSiteCustomDomainInternal(userId: string, siteId: string, customDomain: string | null) {
    return authService.updateSiteCustomDomain(userId, siteId, customDomain);
}

/**
 * Memverifikasi CNAME/A-Record kustom domain milik site.
 */
export async function verifySiteCustomDomainInternal(userId: string, siteId: string, domain: string) {
    return authService.verifySiteCustomDomain(userId, siteId, domain);
}
