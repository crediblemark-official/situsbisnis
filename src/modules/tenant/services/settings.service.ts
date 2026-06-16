import * as settingsRepo from "../repositories/settings.repository";
import { getProxiedUrl } from "@/modules/shared/utils/media/utils";
import { env } from "@/modules/shared/core/env";
import { cache } from "react";
import { unstable_cache } from "next/cache";

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
 * Mengambil data pengaturan visual/SEO situs, dengan fallback ke setelan admin platform.
 */
export const getSiteSettings = async (siteId?: string): Promise<SiteSettings> => {
    if (!siteId) {
        return fetchAdminFallback();
    }

    return unstable_cache(
        async () => {
            try {
                const siteWithSettings = await settingsRepo.findSiteWithSettings(siteId);

                if (siteWithSettings) {
                    const settings = siteWithSettings.siteSettings;
                    const themeConfig = settings?.themeConfig as any || {};

                    return {
                        ...settings,
                        siteName: siteWithSettings.name,
                        logoUrl: siteWithSettings.logoUrl ? getProxiedUrl(siteWithSettings.logoUrl) : null,
                        faviconUrl: siteWithSettings.faviconUrl ? getProxiedUrl(siteWithSettings.faviconUrl) : null,
                        description: siteWithSettings.description,
                        ...themeConfig,
                        footerAddressBackgroundColor: themeConfig.footerAddressBackgroundColor || settings?.footerAddressBackgroundColor || "#1e293b",
                        footerAddressTextColor: themeConfig.footerAddressTextColor || settings?.footerAddressTextColor || "#ffffff",
                        updatedAt: settings?.updatedAt || new Date()
                    } as SiteSettings;
                }
            } catch (error) {
                console.error("[settings.service.getSiteSettings] Error fetching settings:", error);
            }
            return fetchAdminFallback();
        },
        [`site-settings-${siteId}`],
        { revalidate: 300, tags: [`site-${siteId}`, "settings"] }
    )();
};

/**
 * Mendapatkan fallback pengaturan global platform (situs admin).
 */
const fetchAdminFallback = cache(async (): Promise<SiteSettings> => {
    return unstable_cache(
        async () => {
            try {
                const adminSite = await settingsRepo.findAdminSiteWithSettings();

                if (adminSite) {
                    return {
                        id: "platform",
                        siteId: adminSite.id,
                        siteName: adminSite.siteSettings?.siteName || adminSite.name || "SitusBisnis",
                        tagline: adminSite.siteSettings?.tagline || "The Future of Multi-Tenant CMS",
                        description: adminSite.siteSettings?.description || adminSite.description || "An all-in-one platform to launch multi-tenant websites.",
                        logoUrl: adminSite.logoUrl ? getProxiedUrl(adminSite.logoUrl) : "/brand/logo.svg",
                        brandSupportEmail: adminSite.siteSettings?.contactEmail || "support@SitusBisnis.id",
                        socialFacebook: adminSite.siteSettings?.socialFacebook || null,
                        socialTwitter: adminSite.siteSettings?.socialTwitter || null,
                        socialInstagram: adminSite.siteSettings?.socialInstagram || null,
                        socialLinkedin: adminSite.siteSettings?.socialLinkedin || null,
                        socialWhatsapp: adminSite.siteSettings?.socialWhatsapp || null,
                        whatsappNumber: adminSite.siteSettings?.whatsappNumber || adminSite.siteSettings?.socialWhatsapp || null,
                        socialTelegram: adminSite.siteSettings?.socialTelegram || null,
                        socialTiktok: (adminSite.siteSettings as any)?.socialTiktok || null,
                        socialYoutube: (adminSite.siteSettings as any)?.socialYoutube || null,
                        updatedAt: new Date()
                    } as unknown as SiteSettings;
                }
            } catch (e) {
                console.error("[settings.service.getSiteSettings] Admin fallback failed:", e);
            }

            return {
                id: "default",
                siteId: "default",
                siteName: "SitusBisnis",
                tagline: "The Future of Multi-Tenant CMS",
                description: "An all-in-one platform to launch multi-tenant websites with a visual page builder.",
                logoUrl: "/brand/logo.svg",
                activeTheme: env.DEFAULT_THEME,
                seoTitle: null,
                seoKeywords: null,
                seoImage: null,
                faviconUrl: null,
                footerAddress: null,
                footerCopyright: `© ${new Date().getFullYear()} All Rights Reserved.`,
                footerAboutText: null,
                socialFacebook: null,
                socialTwitter: null,
                socialInstagram: null,
                socialLinkedin: null,
                socialWhatsapp: null,
                socialTelegram: null,
                socialTiktok: null,
                socialYoutube: null,
                contactEmail: null,
                brandColor: "#0369a1",
                brandPrimaryColor: "#0369a1",
                brandSecondaryColor: "#0369a1",
                brandAccentColor: "#0369a1",
                brandBackgroundColor: "#FAFAFA",
                brandFontPrimary: "Inter",
                brandFontSecondary: "Inter",
                brandFooterText: "Solusi Website Multi-Tenant Premium",
                brandSupportEmail: "support@SitusBisnis.id",
                headerStyle: "simple",
                headerBackgroundColor: "#0369a1",
                headerTextColor: "#ffffff",
                showCart: false,
                showFloatingChat: false,
                whatsappNumber: null,
                headerMobileBackgroundColor: "#0284c7",
                footerBackgroundColor: "#0369a1",
                footerTextColor: "#ffffff",
                footerAddressBackgroundColor: "#1e293b",
                footerAddressTextColor: "#ffffff",
                googleSiteVerificationId: null,
                googleAnalyticsId: null,
                enabledPosts: false,
                enabledPortfolio: false,
                enabledTestimonials: false,
                enabledGallery: false,
                enabledProducts: false,
                enabledOrders: false,
                enabledCustomers: false,
                updatedAt: new Date(),
            } as SiteSettings;
        },
        ["platform-settings-fallback"],
        { revalidate: 3600, tags: ["platform", "settings"] }
    )();
});

/**
 * Memperbarui data pengaturan situs.
 */
export const updateSiteSettings = async (data: SiteSettingsUpdate, siteId: string) => {
    if (!siteId) throw new Error("Site context required");

    const {
        siteName,
        logoUrl,
        faviconUrl,
        description,
        currency,
        ...rest
    } = data;

    // 1. Update properti umum tabel Site
    await settingsRepo.updateSiteModel(siteId, {
        ...(siteName !== undefined && { name: siteName }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(faviconUrl !== undefined && { faviconUrl }),
        ...(description !== undefined && { description })
    });

    // 2. Ambil themeConfig lama
    const existing = await settingsRepo.findSiteSettingsOnly(siteId);
    const oldConfig = (existing?.themeConfig as any) || {};

    const brandingFields = [
        'brandColor', 'brandPrimaryColor', 'brandSecondaryColor', 'brandAccentColor',
        'brandBackgroundColor', 'brandTextColor', 'brandFontPrimary', 'brandFontSecondary',
        'headerStyle', 'headerBackgroundColor', 'headerTextColor', 'activeTheme',
        'footerBackgroundColor', 'footerTextColor',
        'footerAddressBackgroundColor', 'footerAddressTextColor',
        'logoDisplayMode'
    ];

    const configOnlyFields = ['logoDisplayMode', 'enabledWhatsappCheckout', 'metaPixelId', 'tiktokPixelId', 'googleTagManagerId'];

    const themeConfig: any = { ...oldConfig };
    const settingsData: any = {
        ...(currency !== undefined && { currency })
    };

    // 3. Mapping data ke prisma column dan themeConfig json
    Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined) {
            if (!configOnlyFields.includes(key)) {
                settingsData[key] = value;
            }
            if (brandingFields.includes(key) || configOnlyFields.includes(key)) {
                themeConfig[key] = value;
            }
        }
    });

    // 4. Update SiteSettings
    const updated = await settingsRepo.updateSiteSettingsModel(siteId, {
        ...settingsData,
        themeConfig: themeConfig,
        updatedAt: new Date(),
    });

    // 5. Sinkronisasi mata uang ke PaymentSettings
    if (currency !== undefined && currency !== null) {
        await settingsRepo.upsertPaymentSettingsCurrency(siteId, currency);
    }

    // Invalidasi cache
    try {
        const { revalidateTag } = await import("next/cache");
        revalidateTag(`site-${siteId}`, "default");
        revalidateTag("settings", "default");
    } catch (cacheError) {
        console.error("[updateSiteSettings] Cache revalidation failed:", cacheError);
    }

    return updated;
};
