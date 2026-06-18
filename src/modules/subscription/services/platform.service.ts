import * as billingRepo from "../repositories/billing.repository";
import * as planRepo from "../repositories/plan.repository";

export interface PlanUpdateData {
    id?: string;
    name: string;
    description?: string;
    price: number | string;
    priceYearly?: number | string | null;
    originalPrice?: number | string | null;
    originalPriceYearly?: number | string | null;
    trialDays?: number | string;
    maxPosts?: number | string;
    maxProducts?: number | string;
    maxAssets?: number | string;
    maxTestimonials?: number | string;
    maxOrders?: number | string;
    maxSites?: number | string;
    addonSiteBilling?: boolean;
    showInPricing?: boolean;
    hasBlog?: boolean;
    hasGallery?: boolean;
    hasOrders?: boolean;
    hasCart?: boolean;
    hasCustomDomain?: boolean;
    hasProducts?: boolean;
    hasPortfolio?: boolean;
    hasTaxonomies?: boolean;
    hasTestimonials?: boolean;
    hasInbox?: boolean;
    hasCustomers?: boolean;
    features?: { addonSitePrice?: number };
}

export interface PlatformSettingsData {
    r2AccessKeyId?: string;
    r2SecretAccessKey?: string;
    r2BucketName?: string;
    r2PublicDomain?: string;
    r2Endpoint?: string;
    affiliateCommissionRate?: number;
    affiliateRecurringCommission?: boolean;
    affiliateRecurringCommissionRate?: number;
    paymentGateway?: string;
    gatewayMerchantId?: string;
    gatewayClientKey?: string;
    gatewayApiKey?: string;
    gatewaySandbox?: boolean;
    gatewayApiType?: string;
    aiProvider?: string;
    aiApiKey?: string;
    starsenderApiKey?: string;
    starsenderDeviceKey?: string;
    resendApiKey?: string;
    emailSenderName?: string;
    emailSenderAddress?: string;
}

export interface PaymentMethodData {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    instructions?: string;
}

/**
 * Memperbarui atau membuat paket langganan berdasarkan data yang dikirim.
 */
export async function upsertPlans(plans: PlanUpdateData[]): Promise<void> {
    for (const plan of plans) {
        const planData = {
            name: plan.name,
            description: plan.description,
            price: plan.price,
            priceYearly: plan.priceYearly,
            originalPrice: plan.originalPrice,
            originalPriceYearly: plan.originalPriceYearly,
            trialDays: parseInt(String(plan.trialDays)) || 0,
            maxPosts: isNaN(parseInt(String(plan.maxPosts))) ? -1 : parseInt(String(plan.maxPosts)),
            maxProducts: isNaN(parseInt(String(plan.maxProducts))) ? -1 : parseInt(String(plan.maxProducts)),
            maxAssets: isNaN(parseInt(String(plan.maxAssets))) ? -1 : parseInt(String(plan.maxAssets)),
            maxTestimonials: isNaN(parseInt(String(plan.maxTestimonials))) ? -1 : parseInt(String(plan.maxTestimonials)),
            maxOrders: isNaN(parseInt(String(plan.maxOrders))) ? -1 : parseInt(String(plan.maxOrders)),
            maxSites: isNaN(parseInt(String(plan.maxSites))) ? 1 : parseInt(String(plan.maxSites)),
            addonSiteBilling: plan.addonSiteBilling === true ? "recurring" : plan.addonSiteBilling === false ? "one_time" : plan.addonSiteBilling,
            showInPricing: plan.showInPricing ?? true,
            features: {
                hasBlog: plan.hasBlog ?? false,
                hasGallery: plan.hasGallery ?? false,
                hasOrders: plan.hasOrders ?? false,
                hasCart: plan.hasCart ?? false,
                hasCustomDomain: plan.hasCustomDomain ?? false,
                hasProducts: plan.hasProducts ?? false,
                hasPortfolio: plan.hasPortfolio ?? false,
                hasTaxonomies: plan.hasTaxonomies ?? false,
                hasTestimonials: plan.hasTestimonials ?? false,
                hasInbox: plan.hasInbox ?? false,
                hasCustomers: plan.hasCustomers ?? false,
                addonSitePrice: plan.features?.addonSitePrice || 0
            }
        };

        if (plan.id && !plan.id.startsWith("new-")) {
            await planRepo.updatePlan(plan.id, planData);
        } else {
            await planRepo.createPlan(planData);
        }
    }
}

/**
 * Mengupdate konfigurasi platform (storage R2, AI, affiliate, gateway pembayaran).
 */
export async function updatePlatformSettings(data: PlatformSettingsData): Promise<void> {
    await billingRepo.upsertPlatformSettings(data as Record<string, unknown>);
}

/**
 * Update payment methods platform: hapus semua yang lama, buat yang baru.
 */
export async function updateAdminPaymentMethods(adminSiteId: string, methods: PaymentMethodData[]): Promise<void> {
    await billingRepo.deletePaymentMethodsBySite(adminSiteId);
    
    const validMethods = methods
        .filter(pm => pm.bankName && pm.accountNumber && pm.accountHolder)
        .map(pm => ({
            bankName: pm.bankName!,
            accountNumber: pm.accountNumber!,
            accountHolder: pm.accountHolder!,
            instructions: pm.instructions || "",
            siteId: adminSiteId
        }));

    if (validMethods.length > 0) {
        await billingRepo.bulkCreatePaymentMethods(validMethods);
    }
}

/**
 * Mengambil situs admin platform (subdomain "admin").
 */
export async function getAdminSite() {
    const site = await billingRepo.findAdminSite();
    if (!site) throw new Error("ADMIN_SITE_NOT_FOUND");
    return site;
}

/**
 * Update branding dan pengaturan utama situs admin platform.
 */
export async function updateAdminSiteBranding(adminSiteId: string, data: {
    siteName?: string;
    contactEmail?: string;
    contactPhone?: string;
    whatsappNumber?: string;
    footerAddress?: string;
    allowRegistration?: boolean;
}): Promise<void> {
    await billingRepo.updateAdminSiteSettings(adminSiteId, data);
}

/**
 * Mengambil pengaturan platform global.
 */
export async function getPlatformSettings() {
    return billingRepo.findPlatformSettings(null);
}

export async function findSiteById(id: string) {
    return billingRepo.findSiteById(id);
}

export async function findWithdrawalById(id: string) {
    return billingRepo.findWithdrawalById(id);
}

