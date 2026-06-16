import { db } from "@/lib/core/db";
import { unstable_cache } from "next/cache";

export const getPricingPlans = async () => {
    return unstable_cache(
        async () => {
            try {
                const dbPlans = await db.plan.findMany({
                    where: { showInPricing: true } as any,
                    orderBy: { price: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        price: true,
                        priceYearly: true,
                        originalPrice: true,
                        originalPriceYearly: true,
                        interval: true,
                        trialDays: true,
                        maxSites: true,
                        maxProducts: true,
                        maxPosts: true,
                        maxAssets: true,
                        maxOrders: true,
                        maxTestimonials: true,
                        features: true,
                        addonSiteBilling: true
                    }
                });

                const mainDomain = process.env.NEXT_PUBLIC_APP_URL || "SitusBisnis.com";
                const cleanDomain = mainDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");

                const formatPrice = (price: any) => {
                    return new Intl.NumberFormat('id-ID').format(Number(price));
                };

                const result = dbPlans.map((plan: any) => {
                    const coreFeatures: string[] = [];
                    const limits: { label: string; value: string }[] = [];
                    const planFeatures = plan.features as any || {};

                    if (plan.maxSites === 1) limits.push({ label: "Jumlah Website", value: "1 Website" });
                    else if (plan.maxSites === -1) limits.push({ label: "Jumlah Website", value: "Sepuasnya" });
                    else limits.push({ label: "Jumlah Website", value: `${plan.maxSites} Website` });

                    if (planFeatures.hasCustomDomain) coreFeatures.push("Bisa Pakai Domain Sendiri (.com/.id)");
                    else coreFeatures.push(`Alamat Web Bawaan (.${cleanDomain})`);

                    const quotaMapping = [
                        { key: "maxProducts", label: "Maksimal Produk", featureKey: "hasProducts" },
                        { key: "maxPosts", label: "Maksimal Artikel/Blog", featureKey: "hasBlog" },
                        { key: "maxAssets", label: "Maksimal Upload Foto", featureKey: "hasGallery" },
                        { key: "maxOrders", label: "Maksimal Transaksi", featureKey: "hasOrders" },
                        { key: "maxTestimonials", label: "Maksimal Testimoni", featureKey: "hasTestimonials" },
                    ];

                    quotaMapping.forEach(q => {
                        if (planFeatures[q.featureKey]) {
                            const val = plan[q.key];
                            limits.push({
                                label: q.label,
                                value: val === -1 ? "Sepuasnya" : `${val} Item`
                            });
                        }
                    });

                    if (planFeatures.hasCart) coreFeatures.push("Fitur Toko Online (Keranjang)");
                    if (planFeatures.hasPortfolio) coreFeatures.push("Galeri & Portofolio Karya");
                    if (planFeatures.hasInbox) coreFeatures.push("Kotak Pesan Masuk (Inbox)");
                    if (planFeatures.hasTaxonomies) coreFeatures.push("Bebas Buat Kategori/Label");

                    let color = "blue";
                    if (plan.price > 0) color = "emerald";
                    if (plan.price > 100000) color = "indigo";

                    return {
                        id: plan.id,
                        name: plan.name,
                        description: plan.description,
                        price: Number(plan.price),
                        priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
                        originalPrice: plan.originalPrice ? Number(plan.originalPrice) : 0,
                        originalPriceYearly: plan.originalPriceYearly ? Number(plan.originalPriceYearly) : 0,
                        interval: plan.interval,
                        trialDays: plan.trialDays || 0,
                        color,
                        displayPrice: formatPrice(plan.price),
                        displayPriceYearly: plan.priceYearly ? formatPrice(plan.priceYearly) : null,
                        displayOriginalPrice: plan.originalPrice ? formatPrice(plan.originalPrice) : null,
                        displayOriginalPriceYearly: plan.originalPriceYearly ? formatPrice(plan.originalPriceYearly) : null,
                        coreFeatures,
                        limits,
                        addonPrice: planFeatures.addonSitePrice ? formatPrice(planFeatures.addonSitePrice) : null,
                        addonBilling: plan.addonSiteBilling === 'recurring' ? '/bulan' : ' (Sekali bayar)'
                    };
                });
                return result;
            } catch (e) {
                console.error("[getPricingPlans] Failed to fetch landing page plans:", e);
                return [];
            }
        },
        ["pricing-plans-cache"],
        { revalidate: 3600, tags: ["pricing-plans"] }
    )();
};

/**
 * Mengambil nama paket aktif untuk daftar ID situs.
 * Digunakan untuk menggantikan kueri join database.
 */
export async function getActivePlanNamesForSites(siteIds: string[]): Promise<Record<string, string>> {
    if (siteIds.length === 0) return {};

    try {
        const subscriptions = await db.subscription.findMany({
            where: {
                siteId: { in: siteIds },
                status: "active"
            },
            select: {
                siteId: true,
                plan: {
                    select: {
                        name: true
                    }
                }
            }
        });

        const resultMap: Record<string, string> = {};
        subscriptions.forEach(sub => {
            resultMap[sub.siteId] = sub.plan.name;
        });

        return resultMap;
    } catch (error) {
        console.error("[getActivePlanNamesForSites] Failed to fetch active plans:", error);
        return {};
    }
}

