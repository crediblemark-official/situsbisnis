import * as billingService from "./services/billing.service";
import { LimitType } from "./index";

export async function getPricingPlans() {
    return billingService.getPricingPlans();
}

export async function getActivePlanNamesForSites(siteIds: string[]) {
    return billingService.getActivePlanNamesForSites(siteIds);
}

export async function checkSiteLimit(siteId: string, type: LimitType) {
    return billingService.checkSiteLimit(siteId, type);
}

export async function processApprovedTransaction(transactionId: string) {
    return billingService.processApprovedTransaction(transactionId);
}

export async function updateTransactionStatus(transactionId: string, status: string) {
    return billingService.updateTransactionStatus(transactionId, status);
}

export async function validateCoupon(code: string, planId?: string) {
    return billingService.validateCoupon(code, planId);
}

export async function buySlot(userId: string, siteId: string, quantity: number, paymentMethod?: string) {
    return billingService.buySlot(userId, siteId, quantity, paymentMethod);
}

export async function cancelTransaction(userId: string, transactionId: string) {
    return billingService.cancelTransaction(userId, transactionId);
}

export async function checkTransactionStatus(userId: string, userRole: string, transactionId: string) {
    return billingService.checkTransactionStatus(userId, userRole, transactionId);
}

export async function initializeCheckoutPayment(userId: string, userRole: string, transactionId: string, paymentMethod: string) {
    return billingService.initializeCheckoutPayment(userId, userRole, transactionId, paymentMethod);
}

export async function confirmManualPayment(userId: string, userRole: string, transactionId: string, notes?: string, proofOfPayment?: string) {
    return billingService.confirmManualPayment(userId, userRole, transactionId, notes, proofOfPayment);
}

export async function extendTrial(userId: string, userRole: string, siteId: string) {
    return billingService.extendTrial(userId, userRole, siteId);
}

export async function getPaymentMethods(amount: number) {
    return billingService.getPaymentMethods(amount);
}

export async function upgradePlan(userId: string, userRole: string, siteId: string, planId: string, couponCode?: string, paymentMethod?: string) {
    return billingService.upgradePlan(userId, userRole, siteId, planId, couponCode, paymentMethod);
}

export async function processDuitkuWebhook(body: Record<string, any>) {
    return billingService.processDuitkuWebhook(body);
}

