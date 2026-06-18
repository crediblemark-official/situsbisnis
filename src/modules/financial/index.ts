import {
    validateCoupon,
    getAllCoupons,
    findCouponByCode,
    createCoupon,
    updateCoupon,
    deleteCoupon
} from "./services/coupon.service";

import {
    processWithdrawalStatus
} from "./services/withdrawal.service";

import {
    getSiteSettingsBillingContext,
    getSubscriptionContext,
    getAdminSettingsContext
} from "./services/settings.service";

import {
    setSiteToFreePlan,
    extendSiteTrial
} from "./services/admin.service";

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


