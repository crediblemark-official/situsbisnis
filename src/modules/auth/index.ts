import { 
    getSiteOwnerInternal, 
    getUserByIdInternal, 
    getUsersMapInternal, 
    awardAffiliateCommissionInternal,
    requestAffiliateWithdrawalInternal,
    checkAffiliateStatusInternal,
    updateUserReferrerInternal
} from "./actions";

export interface UserDTO {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
}

export interface SiteOwnerInfo {
    id: string;
    email: string | null;
    name: string | null;
    referredById: string | null;
}

export interface AwardCommissionDTO {
    userId: string;
    amount: number;
    transactionId: string;
    description: string;
}

// Facade / Client kontrak publik
export const IdentityClient = {
    getSiteOwner: getSiteOwnerInternal,
    getUserById: getUserByIdInternal,
    getUsersMap: getUsersMapInternal,
    awardAffiliateCommission: awardAffiliateCommissionInternal,
    requestAffiliateWithdrawal: requestAffiliateWithdrawalInternal,
    checkAffiliateStatus: checkAffiliateStatusInternal,
    updateUserReferrer: updateUserReferrerInternal
};

