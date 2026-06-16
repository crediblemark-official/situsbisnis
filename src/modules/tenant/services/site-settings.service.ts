import { getSiteId } from "@/modules/shared/utils/domains/tenant";
import { TenantClient } from "@/modules/tenant";

export interface SiteSettings {
    id: string;
    siteName: string | null;
    tagline: string | null;
    description: string | null;
    logoUrl: string | null;
    activeTheme?: string | null;
    brandColor?: string | null;
    brandPrimaryColor?: string | null;
    brandSecondaryColor?: string | null;
    brandAccentColor?: string | null;
    brandBackgroundColor?: string | null;
    brandTextColor?: string | null;
    brandFontPrimary?: string | null;
    brandFontSecondary?: string | null;
    brandFooterText?: string | null;
    brandSupportEmail?: string | null;
    footerAddress: string | null;
    footerCopyright: string | null;
    footerAboutText: string | null;
    socialFacebook: string | null;
    socialTwitter: string | null;
    socialInstagram: string | null;
    socialLinkedin: string | null;
    socialWhatsapp: string | null;
    socialTelegram: string | null;
    socialTiktok: string | null;
    socialYoutube: string | null;
    socialEmail?: string | null; // contactEmail
    contactEmail: string | null;
    headerStyle: string | null;
    headerBackgroundColor: string | null;
    headerTextColor: string | null;
    headerMobileBackgroundColor: string | null;
    footerBackgroundColor: string | null;
    footerTextColor: string | null;
    footerAddressBackgroundColor?: string | null;
    footerAddressTextColor?: string | null;
    showCart: boolean | null;
    showFloatingChat: boolean | null;
    whatsappNumber: string | null;
    seoTitle: string | null;
    seoKeywords: string | null;
    seoImage: string | null;
    faviconUrl: string | null;
    googleSiteVerificationId: string | null;
    googleAnalyticsId: string | null;
    metaPixelId?: string | null;
    tiktokPixelId?: string | null;
    googleTagManagerId?: string | null;
    enabledPosts: boolean | null;
    enabledPortfolio: boolean | null;
    enabledTestimonials: boolean | null;
    enabledGallery: boolean | null;
    enabledProducts: boolean | null;
    enabledOrders: boolean | null;
    enabledWhatsappCheckout?: boolean | null;
    enabledTaxonomies?: boolean | null;
    enabledInbox?: boolean | null;
    enabledCustomers?: boolean | null;
    themeConfig?: any;
    currency?: string | null;
    logoDisplayMode?: string | null;
    updatedAt: Date;
}

export type SiteSettingsUpdate = Partial<Omit<SiteSettings, "id" | "updatedAt">>;

/**
 * Proxy delegator ke TenantClient untuk mengambil pengaturan situs.
 */
export const getSiteSettings = async (siteId?: string): Promise<SiteSettings> => {
    const id = siteId || await getSiteId();
    return TenantClient.getSiteSettings(id || undefined) as unknown as SiteSettings;
};

/**
 * Proxy delegator ke TenantClient untuk memperbarui pengaturan situs.
 */
export const updateSiteSettings = async (data: SiteSettingsUpdate, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) throw new Error("Site context required");

    return TenantClient.updateSiteSettings(data, id);
};

/**
 * Proxy delegator ke TenantClient untuk memperbarui properti domain situs.
 */
export const updateSite = async (data: { customDomain?: string | null }, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) throw new Error("Site context required");

    if (data.customDomain !== undefined) {
        if (data.customDomain === null) {
            return TenantClient.removeDomain(id, "");
        } else {
            return TenantClient.registerDomain(id, data.customDomain);
        }
    }
    return null;
};
