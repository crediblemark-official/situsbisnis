import {
    validateCoupon,
    getAllCoupons,
    findCouponByCode,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    processWithdrawalStatus,
    getSiteSettingsBillingContext,
    getSubscriptionContext,
    getAdminSettingsContext,
    setSiteToFreePlan,
    extendSiteTrial
} from "./controllers/financial.controller";

export const FinancialClient = {
    validateCoupon,
    getAllCoupons,
    findCouponByCode,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    processWithdrawalStatus,
    getSiteSettingsBillingContext,
    getSubscriptionContext,
    getAdminSettingsContext,
    setSiteToFreePlan,
    extendSiteTrial
};
