import { db } from "@/lib/core/db";
import { cache } from "react";
import { unstable_cache } from "next/cache";

export interface PlatformSettings {
    siteName: string;
    contactEmail: string;
    contactPhone: string;
    whatsappNumber: string;
    footerAddress: string;
    logoUrl: string;
}

// Global platform settings cache (cross-request)
export const getPlatformSettings = cache(async (): Promise<PlatformSettings> => {
    return unstable_cache(
        async () => {
            try {
                const adminSite = await db.site.findUnique({
                    where: { subdomain: "admin" },
                    include: { siteSettings: true }
                });

                return {
                    siteName: adminSite?.siteSettings?.siteName || adminSite?.name || "SitusBisnis",
                    contactEmail: adminSite?.siteSettings?.contactEmail || "support@SitusBisnis.com",
                    contactPhone: adminSite?.siteSettings?.contactPhone || "",
                    whatsappNumber: adminSite?.siteSettings?.whatsappNumber || "",
                    footerAddress: adminSite?.siteSettings?.footerAddress || "",
                    logoUrl: adminSite?.logoUrl || "/brand/logo.svg",
                };
            } catch (error) {
                console.error("[getPlatformSettings] Error:", error);
                return {
                    siteName: "SitusBisnis",
                    contactEmail: "support@SitusBisnis.com",
                    contactPhone: "",
                    whatsappNumber: "",
                    footerAddress: "",
                    logoUrl: "/brand/logo.svg",
                };
            }
        },
        ["platform-settings"],
        { revalidate: 3600, tags: ["platform"] }
    )();
});
