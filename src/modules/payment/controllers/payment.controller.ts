import * as transactionService from "../services/transaction.service";
import * as checkoutService from "../services/checkout.service";
import * as webhookService from "../services/webhook.service";

export async function processApprovedTransaction(transactionId: string) {
    return transactionService.processApprovedTransaction(transactionId);
}

export async function updateTransactionStatus(transactionId: string, status: string) {
    return transactionService.updateTransactionStatus(transactionId, status);
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

export async function getPaymentMethods(amount: number) {
    return webhookService.getPaymentMethods(amount);
}

export async function upgradePlan(userId: string, userRole: string, siteId: string, planId: string, couponCode?: string, paymentMethod?: string) {
    return checkoutService.upgradePlan(userId, userRole, siteId, planId, couponCode, paymentMethod);
}

export async function processDuitkuWebhook(body: Record<string, any>) {
    return webhookService.processDuitkuWebhook(body);
}
