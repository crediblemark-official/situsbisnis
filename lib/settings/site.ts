import { db } from "@/lib/core/db";
import { getSiteId } from "@/lib/domains/tenant";
import { env } from "@/lib/core/env";
import { revalidateTag, unstable_cache } from "next/cache";
import { cache } from "react";
import { getProxiedUrl } from "@/lib/media/utils";

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

export const getSiteSettings = async (siteId?: string): Promise<SiteSettings> => {
    const id = siteId || await getSiteId();
    if (!id) {
        // Fallback: Platform (Admin) Settings as defaults
        return fetchAdminFallback();
    }

    return unstable_cache(
        async () => {
            try {
                const siteWithSettings = await db.site.findUnique({
                    where: { id },
                    select: {
                        name: true,
                        logoUrl: true,
                        faviconUrl: true,
                        description: true,
                        siteSettings: true
                    }
                });

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
                console.error("[getSiteSettings] Error fetching settings:", error);
            }
            return fetchAdminFallback();
        },
        [`site-settings-${id}`],
        { revalidate: 300, tags: [`site-${id}`, "settings"] }
    )();
};

const fetchAdminFallback = cache(async (): Promise<SiteSettings> => {
    return unstable_cache(
        async () => {
            try {
                const adminSite = await db.site.findUnique({
                    where: { subdomain: "admin" },
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                        description: true,
                        siteSettings: true
                    }
                });

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
                console.error("[getSiteSettings] Admin fallback failed:", e);
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

export const updateSiteSettings = async (data: SiteSettingsUpdate, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) throw new Error("Site context required");

    const {
        siteName,
        logoUrl,
        faviconUrl,
        description,
        currency,
        ...rest
    } = data;

    // 1. Update Site Model (Identity)
    // Only update if fields are provided to avoid nullifying existing data accidentally
    await db.site.update({
        where: { id },
        data: {
            ...(siteName !== undefined && { name: siteName }),
            ...(logoUrl !== undefined && { logoUrl }),
            ...(faviconUrl !== undefined && { faviconUrl }),
            ...(description !== undefined && { description })
        }
    });

    // 2. Fetch existing settings to merge themeConfig safely
    const existing = await db.siteSettings.findUnique({
        where: { siteId: id },
        select: { themeConfig: true }
    });

    const oldConfig = (existing?.themeConfig as any) || {};

    // 3. Define branding fields that we also want in themeConfig for legacy/redundancy support
    const brandingFields = [
        'brandColor', 'brandPrimaryColor', 'brandSecondaryColor', 'brandAccentColor',
        'brandBackgroundColor', 'brandTextColor', 'brandFontPrimary', 'brandFontSecondary',
        'headerStyle', 'headerBackgroundColor', 'headerTextColor', 'activeTheme',
        'footerBackgroundColor', 'footerTextColor',
        'footerAddressBackgroundColor', 'footerAddressTextColor',
        'logoDisplayMode'
    ];

    // Fields that do not exist as flat columns in the DB model and should ONLY live in themeConfig
    const configOnlyFields = ['logoDisplayMode', 'enabledWhatsappCheckout', 'metaPixelId', 'tiktokPixelId', 'googleTagManagerId'];

    const themeConfig: any = { ...oldConfig };
    const settingsData: any = {
        ...(currency !== undefined && { currency })
    };

    // 4. Map everything to individual columns AND themeConfig
    Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined) {
            // Put in flat settingsData (Prisma columns) only if it is a real database column
            if (!configOnlyFields.includes(key)) {
                settingsData[key] = value;
            }

            // Also mirror in themeConfig if it's a branding field or a config-only field
            if (brandingFields.includes(key) || configOnlyFields.includes(key)) {
                themeConfig[key] = value;
            }
        }
    });

    // 5. Update SiteSettings Model
    const updated = await db.siteSettings.update({
        where: { siteId: id },
        data: {
            ...settingsData,
            themeConfig: themeConfig,
            updatedAt: new Date(),
        }
    });

    // Sinkronisasi mata uang (currency) ke PaymentSettings agar konsisten di checkout
    if (currency !== undefined && currency !== null) {
        await db.paymentSettings.upsert({
            where: { siteId: id },
            update: { currency },
            create: {
                siteId: id,
                currency,
                bankName: "",
                accountNumber: "",
                accountHolder: ""
            }
        });
    }

    revalidateTag(`site-${id}`, "default");
    revalidateTag("settings", "default");

    return updated;
};

export const updateSite = async (data: { customDomain?: string | null }, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) throw new Error("Site context required");

    const result = await db.site.update({
        where: { id },
        data: {
            ...data,
            ...(data.customDomain !== undefined && { customDomainVerified: false })
        }
    });

    revalidateTag(`site-${id}`, "default");
    return result;
};
