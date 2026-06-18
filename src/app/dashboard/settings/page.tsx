import React from "react";
import SettingsForm from "@/modules/site/ui/dashboard/settings/SettingsForm";
import { getApiContext } from "@/lib/api/utils";
import { SiteClient } from "@/modules/site";
import { FinancialClient } from "@/modules/financial";
import { getPaymentSettings } from "@/modules/shared/utils/settings/payment";

export const dynamic = "force-dynamic";

export default async function MasterSettingsPage() {
    const { session, siteId } = await getApiContext(undefined, { requireSite: false, isPublic: true });
    
    // Ambil pengaturan umum situs
    const settings = await SiteClient.getSiteSettings(siteId || undefined);
    let fullSettings: any = { ...settings };

    if (session && siteId) {
        const [domainInfo, billingContext] = await Promise.all([
            SiteClient.getSiteDomainInfo(siteId),
            FinancialClient.getSiteSettingsBillingContext(siteId)
        ]);

        fullSettings = {
            ...(settings as any),
            customDomain: domainInfo?.customDomain,
            customDomainVerified: domainInfo?.customDomainVerified,
            plan: billingContext.activePlanName,
            isTrial: billingContext.isTrial,
            trialEndsAt: billingContext.trialEndsAt ? String(billingContext.trialEndsAt) : null,
            planPrice: billingContext.activePlanPrice,
            allPlans: billingContext.allPlans,
            planFeatures: billingContext.planFeatures,
            maxSites: billingContext.maxSites
        };
    }

    // Ambil pengaturan pembayaran situs
    let paymentData = null;
    if (siteId) {
        paymentData = await getPaymentSettings(siteId);
    }

    // Serialisasikan decimal atau objek non-serializable jika ada
    const serializedSettings = JSON.parse(JSON.stringify(fullSettings));
    const serializedPaymentData = JSON.parse(JSON.stringify(paymentData || {}));

    return (
        <SettingsForm 
            initialSettings={serializedSettings} 
            initialPaymentData={serializedPaymentData} 
        />
    );
}
