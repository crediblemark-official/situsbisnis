import { 
    getPricingPlans, 
    getActivePlanNamesForSites, 
    checkSiteLimit, 
    processApprovedTransaction, 
    updateTransactionStatus,
    validateCoupon,
    buySlot,
    cancelTransaction,
    checkTransactionStatus,
    initializeCheckoutPayment,
    confirmManualPayment,
    extendTrial,
    getPaymentMethods,
    upgradePlan,
    processDuitkuWebhook,
    getAllPlans,
    getSubscriptionDetail,
    extendSubscription,
    cancelSubscription,
    updateSubscriptionPlan,
    followupWhatsApp,
    followupEmail,
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    processWithdrawalStatus
} from "./actions";

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

// Facade / Client kontrak publik
export const BillingClient = {
    getPricingPlans,
    getActivePlanNamesForSites,
    checkSiteLimit,
    processApprovedTransaction,
    updateTransactionStatus,
    validateCoupon,
    buySlot,
    cancelTransaction,
    checkTransactionStatus,
    initializeCheckoutPayment,
    confirmManualPayment,
    extendTrial,
    getPaymentMethods,
    upgradePlan,
    processDuitkuWebhook,
    getAllPlans,
    getSubscriptionDetail,
    extendSubscription,
    cancelSubscription,
    updateSubscriptionPlan,
    followupWhatsApp,
    followupEmail,
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    processWithdrawalStatus
};


