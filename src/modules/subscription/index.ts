import {
    getPricingPlans,
    getActivePlanNamesForSites,
    getAllPlans,
    getSubscriptionDetail,
    getActiveSubscription,
    extendSubscription,
    cancelSubscription,
    updateSubscriptionPlan,
    extendTrial,
    findPlanById,
    findPlanByName,
    findLatestSubscription,
    findLatestSubscriptionAnyStatus,
    cancelAllSubscriptions,
    createSubscription,
    updateSubscription
} from "./services/plan.service";

import {
    checkSiteLimit,
    checkUserSitesLimit
} from "./services/limit.service";

import {
    upsertPlans,
    updatePlatformSettings,
    updateAdminPaymentMethods,
    getAdminSite,
    updateAdminSiteBranding,
    getPlatformSettings,
    findSiteById,
    findWithdrawalById
} from "./services/platform.service";

import {
    checkAndUpdateExpiredSubscriptions
} from "./services/expiration.service";

export type LimitType = "maxPosts" | "maxProducts" | "maxOrders" | "maxTestimonials" | "maxAssets";

export interface LimitCheckResult {
    allowed: boolean;
    message?: string;
}

export interface PricingPlanDTO {
    id: string;
    name: string;
    description: string | null;
    price: number;
    priceYearly: number | null;
    originalPrice: number | null;
    originalPriceYearly: number | null;
    interval: string;
    trialDays: number;
    color: string;
    displayPrice: string;
    displayPriceYearly: string | null;
    displayOriginalPrice: string | null;
    displayOriginalPriceYearly: string | null;
    coreFeatures: string[];
    limits: { label: string; value: string }[];
    addonPrice: string | null;
    addonBilling: string;
}

export const SubscriptionClient = {
    getPricingPlans,
    getActivePlanNamesForSites,
    checkSiteLimit,
    getAllPlans,
    getSubscriptionDetail,
    getActiveSubscription,
    extendSubscription,
    cancelSubscription,
    updateSubscriptionPlan,
    checkUserSitesLimit,
    extendTrial,
    upsertPlans,
    updatePlatformSettings,
    updateAdminPaymentMethods,
    getAdminSite,
    updateAdminSiteBranding,
    getPlatformSettings,
    findPlanById,
    findPlanByName,
    findLatestSubscription,
    findLatestSubscriptionAnyStatus,
    cancelAllSubscriptions,
    createSubscription,
    updateSubscription,
    findSiteById,
    findWithdrawalById,
    checkAndUpdateExpiredSubscriptions
};
