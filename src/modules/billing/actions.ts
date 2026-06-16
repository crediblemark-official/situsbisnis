import * as planService from "./services/plan.service";
import * as limitService from "./services/limit.service";
import * as couponService from "./services/coupon.service";
import * as checkoutService from "./services/checkout.service";
import * as transactionService from "./services/transaction.service";
import * as webhookService from "./services/webhook.service";
import * as followupService from "./services/followup.service";
import * as withdrawalService from "./services/withdrawal.service";
import * as settingsService from "./services/settings.service";
import * as adminService from "./services/admin.service";
import * as platformService from "./services/platform.service";
import { LimitType } from "./index";

export async function getPricingPlans() {
    return planService.getPricingPlans();
}

export async function getActivePlanNamesForSites(siteIds: string[]) {
    return planService.getActivePlanNamesForSites(siteIds);
}

export async function checkSiteLimit(siteId: string, type: LimitType) {
    return limitService.checkSiteLimit(siteId, type);
}

export async function processApprovedTransaction(transactionId: string) {
    return transactionService.processApprovedTransaction(transactionId);
}

export async function updateTransactionStatus(transactionId: string, status: string) {
    return transactionService.updateTransactionStatus(transactionId, status);
}

export async function validateCoupon(code: string, planId?: string) {
    return couponService.validateCoupon(code, planId);
}

export async function buySlot(userId: string, siteId: string, quantity: number, paymentMethod?: string) {
    return checkoutService.buySlot(userId, siteId, quantity, paymentMethod);
}

export async function cancelTransaction(userId: string, transactionId: string) {
    return transactionService.cancelTransaction(userId, transactionId);
}

export async function checkTransactionStatus(userId: string, userRole: string, transactionId: string) {
    return webhookService.checkTransactionStatus(userId, userRole, transactionId);
}

export async function initializeCheckoutPayment(userId: string, userRole: string, transactionId: string, paymentMethod: string) {
    return checkoutService.initializeCheckoutPayment(userId, userRole, transactionId, paymentMethod);
}

export async function confirmManualPayment(userId: string, userRole: string, transactionId: string, notes?: string, proofOfPayment?: string) {
    return transactionService.confirmManualPayment(userId, userRole, transactionId, notes, proofOfPayment);
}

export async function extendTrial(userId: string, userRole: string, siteId: string) {
    return planService.extendTrial(userId, userRole, siteId);
}

export async function getPaymentMethods(amount: number) {
    return webhookService.getPaymentMethods(amount);
}

export async function upgradePlan(userId: string, userRole: string, siteId: string, planId: string, couponCode?: string, paymentMethod?: string) {
    return checkoutService.upgradePlan(userId, userRole, siteId, planId, couponCode, paymentMethod);
}

export async function processDuitkuWebhook(body: Record<string, any>) {
    return webhookService.processDuitkuWebhook(body);
}

export async function getAllPlans() {
    return planService.getAllPlans();
}

export async function getSubscriptionDetail(subId: string) {
    return planService.getSubscriptionDetail(subId);
}

export async function extendSubscription(subId: string, days: number) {
    return planService.extendSubscription(subId, days);
}

export async function cancelSubscription(subId: string) {
    return planService.cancelSubscription(subId);
}

export async function updateSubscriptionPlan(subId: string, planId: string) {
    return planService.updateSubscriptionPlan(subId, planId);
}

export async function followupWhatsApp(phone: string, message: string) {
    return followupService.followupWhatsApp(phone, message);
}

export async function followupEmail(email: string, message: string, siteId: string) {
    return followupService.followupEmail(email, message, siteId);
}

export async function getAllCoupons() {
    return couponService.getAllCoupons();
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

export async function checkUserSitesLimit(siteIds: string[], currentSiteCount: number) {
    return limitService.checkUserSitesLimit(siteIds, currentSiteCount);
}

export async function getSiteSettingsBillingContext(siteId: string) {
    return settingsService.getSiteSettingsBillingContext(siteId);
}

export async function setSiteToFreePlan(siteId: string): Promise<void> {
    return adminService.setSiteToFreePlan(siteId);
}

export async function extendSiteTrial(siteId: string, days: number) {
    return adminService.extendSiteTrial(siteId, days);
}

export async function upsertPlans(plans: platformService.PlanUpdateData[]) {
    return platformService.upsertPlans(plans);
}

export async function updatePlatformSettings(data: platformService.PlatformSettingsData) {
    return platformService.updatePlatformSettings(data);
}

export async function updateAdminPaymentMethods(adminSiteId: string, methods: platformService.PaymentMethodData[]) {
    return platformService.updateAdminPaymentMethods(adminSiteId, methods);
}

export async function getAdminSite() {
    return platformService.getAdminSite();
}

export async function updateAdminSiteBranding(adminSiteId: string, data: Parameters<typeof platformService.updateAdminSiteBranding>[1]) {
    return platformService.updateAdminSiteBranding(adminSiteId, data);
}

export async function getPlatformSettings() {
    return platformService.getPlatformSettings();
}
