import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { z } from "zod";
import { FinancialClient } from "@/modules/financial";
import { SiteClient } from "@/modules/site";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
    siteName: z.string().min(1, "Site name is required").optional().nullable(),
    tagline: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    customDomain: z.string().optional().nullable(),
    contactEmail: z.string().email("Invalid email address").optional().nullable().or(z.literal("")).or(z.literal(null)),
    brandColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional().nullable(),
    brandPrimaryColor: z.string().optional().nullable(),
    brandSecondaryColor: z.string().optional().nullable(),
    brandAccentColor: z.string().optional().nullable(),
    brandBackgroundColor: z.string().optional().nullable(),
    brandTextColor: z.string().optional().nullable(),
    brandFontPrimary: z.string().optional().nullable(),
    brandFontSecondary: z.string().optional().nullable(),
    brandFooterText: z.string().optional().nullable(),
    brandSupportEmail: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    logoDisplayMode: z.string().optional().nullable(),
    faviconUrl: z.string().optional().nullable(),
    headerStyle: z.string().optional().nullable(),
    headerBackgroundColor: z.string().optional().nullable(),
    headerTextColor: z.string().optional().nullable(),
    footerCopyright: z.string().optional().nullable(),
    footerAddress: z.string().optional().nullable(),
    footerAboutText: z.string().optional().nullable(),
    footerBackgroundColor: z.string().optional().nullable(),
    footerTextColor: z.string().optional().nullable(),
    footerAddressBackgroundColor: z.string().optional().nullable(),
    footerAddressTextColor: z.string().optional().nullable(),
    activeTheme: z.string().optional().nullable(),
    showCart: z.boolean().optional().nullable(),
    showFloatingChat: z.boolean().optional().nullable(),
    whatsappNumber: z.string().optional().nullable(),
    googleAnalyticsId: z.string().optional().nullable(),
    googleSiteVerificationId: z.string().optional().nullable(),
    metaPixelId: z.string().optional().nullable(),
    tiktokPixelId: z.string().optional().nullable(),
    googleTagManagerId: z.string().optional().nullable(),
    seoTitle: z.string().optional().nullable(),
    seoKeywords: z.string().optional().nullable(),
    seoImage: z.string().optional().nullable(),
    socialFacebook: z.string().optional().nullable(),
    socialTwitter: z.string().optional().nullable(),
    socialInstagram: z.string().optional().nullable(),
    socialLinkedin: z.string().optional().nullable(),
    socialWhatsapp: z.string().optional().nullable(),
    socialTelegram: z.string().optional().nullable(),
    socialTiktok: z.string().optional().nullable(),
    socialYoutube: z.string().optional().nullable(),
    enabledPosts: z.boolean().optional().nullable(),
    enabledPortfolio: z.boolean().optional().nullable(),
    enabledTestimonials: z.boolean().optional().nullable(),
    enabledGallery: z.boolean().optional().nullable(),
    enabledProducts: z.boolean().optional().nullable(),
    enabledOrders: z.boolean().optional().nullable(),
    enabledWhatsappCheckout: z.boolean().optional().nullable(),
    enabledTaxonomies: z.boolean().optional().nullable(),
    enabledInbox: z.boolean().optional().nullable(),
    enabledCustomers: z.boolean().optional().nullable(),
    currency: z.string().optional().nullable(),
});

/**
 * GET /api/settings
 * Mengambil pengaturan situs beserta informasi billing dan domain.
 */
export async function GET() {
    try {
        const { session, siteId } = await getApiContext(undefined, { requireSite: false, isPublic: true });
        const settings = await SiteClient.getSiteSettings(siteId || undefined);

        if (session && siteId) {
            const [domainInfo, billingContext] = await Promise.all([
                SiteClient.getSiteDomainInfo(siteId),
                FinancialClient.getSiteSettingsBillingContext(siteId)
            ]);

            return apiResponse({ 
                ...settings, 
                customDomain: domainInfo?.customDomain,
                customDomainVerified: domainInfo?.customDomainVerified,
                plan: billingContext.activePlanName,
                isTrial: billingContext.isTrial,
                trialEndsAt: billingContext.trialEndsAt,
                planPrice: billingContext.activePlanPrice,
                allPlans: billingContext.allPlans,
                planFeatures: billingContext.planFeatures,
                maxSites: billingContext.maxSites
            });
        }

        return apiResponse(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return apiError("Failed to fetch settings");
    }
}


