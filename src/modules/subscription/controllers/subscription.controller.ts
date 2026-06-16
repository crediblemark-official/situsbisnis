import * as planService from "../services/plan.service";
import * as limitService from "../services/limit.service";
import * as platformService from "../services/platform.service";
import { LimitType } from "../index";

export async function getPricingPlans() {
    return planService.getPricingPlans();
}

export async function getActivePlanNamesForSites(siteIds: string[]) {
    return planService.getActivePlanNamesForSites(siteIds);
}

export async function checkSiteLimit(siteId: string, type: LimitType) {
    return limitService.checkSiteLimit(siteId, type);
}

export async function getAllPlans() {
    return planService.getAllPlans();
}

export async function getSubscriptionDetail(subId: string) {
    return planService.getSubscriptionDetail(subId);
}

export async function getActiveSubscription(siteId: string) {
    return planService.getActiveSubscription(siteId);
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

export async function checkUserSitesLimit(siteIds: string[], currentSiteCount: number) {
    return limitService.checkUserSitesLimit(siteIds, currentSiteCount);
}

export async function extendTrial(userId: string, userRole: string, siteId: string) {
    return planService.extendTrial(userId, userRole, siteId);
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

export async function findPlanById(id: string) {
    return planService.findPlanById(id);
}

export async function findPlanByName(name: string) {
    return planService.findPlanByName(name);
}

export async function findLatestSubscription(siteId: string) {
    return planService.findLatestSubscription(siteId);
}

export async function findLatestSubscriptionAnyStatus(siteId: string) {
    return planService.findLatestSubscriptionAnyStatus(siteId);
}

export async function cancelAllSubscriptions(siteId: string) {
    return planService.cancelAllSubscriptions(siteId);
}

export async function createSubscription(data: { siteId: string, planId: string, status: string, startDate: Date, endDate: Date, addonSlots: number }) {
    return planService.createSubscription(data);
}

export async function updateSubscription(id: string, data: any) {
    return planService.updateSubscription(id, data);
}

export async function findSiteById(id: string) {
    return platformService.findSiteById(id);
}

export async function findWithdrawalById(id: string) {
    return platformService.findWithdrawalById(id);
}
