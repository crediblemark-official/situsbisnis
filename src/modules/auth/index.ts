import {
    getSiteOwner,
    registerUser,
    verifyBridgeToken,
    getUserSites,
    updateSiteCustomDomain,
    verifySiteCustomDomain
} from "./services/auth.service";

import {
    getUserById,
    getUsersMap,
    updateUserProfile,
    getUsers,
    createUserByAdmin,
    updateUserByAdmin,
    deleteUserByAdmin,
    getAdminUsersContext
} from "./services/user.service";

import {
    awardAffiliateCommission,
    requestAffiliateWithdrawal,
    checkAffiliateStatus,
    updateUserReferrer,
    checkReferralCode
} from "./services/affiliate.service";

export * from "./actions/auth.actions";

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
    getSiteOwner,
    getUserById,
    getUsersMap,
    awardAffiliateCommission,
    requestAffiliateWithdrawal,
    checkAffiliateStatus,
    updateUserReferrer,
    registerUser,
    verifyBridgeToken,
    updateUserProfile,
    getUsers,
    getAdminUsersContext,
    createUserByAdmin,
    updateUserByAdmin,
    deleteUserByAdmin,
    getUserSites,
    updateSiteCustomDomain,
    verifySiteCustomDomain,
    checkReferralCode
};



