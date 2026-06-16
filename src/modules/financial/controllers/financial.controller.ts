import * as couponService from "../services/coupon.service";
import * as withdrawalService from "../services/withdrawal.service";
import * as adminService from "../services/admin.service";
import * as settingsService from "../services/settings.service";

export async function validateCoupon(code: string, planId?: string) {
    return couponService.validateCoupon(code, planId);
}

export async function getAllCoupons() {
    return couponService.getAllCoupons();
}

export async function findCouponByCode(code: string) {
    return couponService.findCouponByCode(code);
}

export async function createCoupon(body: any) {
    return couponService.createCoupon(body);
}

export async function updateCoupon(couponId: string, body: any) {
    return couponService.updateCoupon(couponId, body);
}

export async function deleteCoupon(couponId: string) {
    return couponService.deleteCoupon(couponId);
}

export async function processWithdrawalStatus(withdrawalId: string, status: string) {
    return withdrawalService.processWithdrawalStatus(withdrawalId, status);
}

export async function getSiteSettingsBillingContext(siteId: string) {
    return settingsService.getSiteSettingsBillingContext(siteId);
}

export async function getSubscriptionContext(siteId: string) {
    return settingsService.getSubscriptionContext(siteId);
}

export async function getAdminSettingsContext() {
    return settingsService.getAdminSettingsContext();
}

export async function setSiteToFreePlan(siteId: string): Promise<void> {
    return adminService.setSiteToFreePlan(siteId);
}

export async function extendSiteTrial(siteId: string, days: number) {
    return adminService.extendSiteTrial(siteId, days);
}
