import React from "react";
import SettingsForm from "./SettingsForm";
import { BillingClient } from "@/modules/billing";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
    // We assume the site with subdomain 'admin' is the platform's control site
    const { adminSite, plans, platformSettings } = await BillingClient.getAdminSettingsContext();

    const data = {
        siteName: adminSite?.siteSettings?.siteName || adminSite?.name || "My Platform",
        contactEmail: adminSite?.siteSettings?.contactEmail || "support@example.com",
        contactPhone: (adminSite?.siteSettings as any)?.contactPhone || "",
        whatsappNumber: adminSite?.siteSettings?.whatsappNumber || "",
        footerAddress: adminSite?.siteSettings?.footerAddress || "",
        subdomain: adminSite?.subdomain || "admin",
        allowRegistration: adminSite?.siteSettings?.allowRegistration ?? true,
        affiliateCommissionRate: platformSettings?.affiliateCommissionRate ? Number(platformSettings.affiliateCommissionRate) : 20,
        affiliateRecurringCommission: platformSettings?.affiliateRecurringCommission ?? false,
        affiliateRecurringCommissionRate: platformSettings?.affiliateRecurringCommissionRate ? Number(platformSettings.affiliateRecurringCommissionRate) : 10,
        paymentMethods: adminSite?.paymentSettings ? [adminSite.paymentSettings] : [],
        duitkuMerchantCode: platformSettings?.duitkuMerchantCode || "",
        duitkuApiKey: platformSettings?.duitkuApiKey || "",
        duitkuSandbox: platformSettings?.duitkuSandbox ?? true,
        aiProvider: platformSettings?.aiProvider || "gemini",
        aiApiKey: platformSettings?.aiApiKey || "",
        starsenderApiKey: platformSettings?.starsenderApiKey || "",
        starsenderDeviceKey: platformSettings?.starsenderDeviceKey || "",
        resendApiKey: platformSettings?.resendApiKey || "",
        emailSenderName: platformSettings?.emailSenderName || "",
        emailSenderAddress: platformSettings?.emailSenderAddress || "",
        storage: {
            accessKeyId: platformSettings?.r2AccessKeyId || "",
            secretAccessKey: platformSettings?.r2SecretAccessKey || "",
            bucketName: platformSettings?.r2BucketName || "",
            publicDomain: platformSettings?.r2PublicDomain || "",
            endpoint: platformSettings?.r2Endpoint || "",
        },
        plans: plans.map(p => {
            const features = (p.features as any) || {};
            return {
                ...p,
                price: Number(p.price),
                priceYearly: (p as any).priceYearly ? Number((p as any).priceYearly) : null,
                originalPrice: (p as any).originalPrice ? Number((p as any).originalPrice) : 0,
                originalPriceYearly: (p as any).originalPriceYearly ? Number((p as any).originalPriceYearly) : 0,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
                showInPricing: (p as any).showInPricing,
                hasBlog: features.hasBlog ?? false,
                hasGallery: features.hasGallery ?? false,
                hasOrders: features.hasOrders ?? false,
                hasCart: features.hasCart ?? false,
                hasCustomDomain: features.hasCustomDomain ?? false,
                hasProducts: features.hasProducts ?? false,
                hasPortfolio: features.hasPortfolio ?? false,
                hasTaxonomies: features.hasTaxonomies ?? false,
                hasTestimonials: features.hasTestimonials ?? false,
                hasInbox: features.hasInbox ?? false,
                hasCustomers: features.hasCustomers ?? false,
            };
        })
    };

    return <SettingsForm initialData={data} />;
}
