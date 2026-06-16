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
