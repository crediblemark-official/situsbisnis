import * as authService from "./services/auth.service";
import { SiteOwnerInfo, AwardCommissionDTO, UserDTO } from "./index";

/**
 * Server Actions / Wrapper internal untuk mengambil owner site.
 */
export async function getSiteOwnerInternal(siteId: string): Promise<SiteOwnerInfo | null> {
    return authService.getSiteOwner(siteId);
}

/**
 * Server Actions / Wrapper internal untuk mengambil data user berdasarkan ID.
 */
export async function getUserByIdInternal(userId: string): Promise<UserDTO | null> {
    return authService.getUserById(userId);
}

/**
 * Server Actions / Wrapper internal untuk mengambil data user secara massal.
 */
export async function getUsersMapInternal(userIds: string[]): Promise<Record<string, UserDTO>> {
    return authService.getUsersMap(userIds);
}

/**
 * Server Actions / Wrapper internal untuk mengalokasikan komisi afiliasi.
 */
export async function awardAffiliateCommissionInternal(
    dbClient: any, 
    data: AwardCommissionDTO
): Promise<void> {
    return authService.awardAffiliateCommission(dbClient, data);
}

/**
 * Server Actions / Wrapper internal untuk memproses penarikan saldo afiliasi.
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
 * Server Actions / Wrapper internal untuk memverifikasi saldo dan profil afiliasi.
 */
export async function checkAffiliateStatusInternal(userId: string) {
    return authService.checkAffiliateStatus(userId);
}

/**
 * Server Actions / Wrapper internal untuk memperbarui referrer user.
 */
export async function updateUserReferrerInternal(userId: string, referredById: string): Promise<void> {
    return authService.updateUserReferrer(userId, referredById);
}

