import {
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
} from "./controllers/subscription.controller";

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
