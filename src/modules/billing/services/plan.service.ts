import * as billingRepo from "../repositories/billing.repository";
import * as planRepo from "../repositories/plan.repository";
import * as subscriptionRepo from "../repositories/subscription.repository";
import { unstable_cache } from "next/cache";
import { TenantClient } from "@/lib/modules/tenant/client";
import { IdentityClient } from "@/lib/modules/identity/client";
import { PricingPlanDTO } from "../index";

/**
 * Mengambil paket harga untuk ditampilkan ke landing page dengan caching.
 */
export async function getPricingPlans(): Promise<PricingPlanDTO[]> {
    return unstable_cache(
        async () => {
            try {
                const dbPlans = await planRepo.findPricingPlans();
                const mainDomain = process.env.NEXT_PUBLIC_APP_URL || "SitusBisnis.com";
                const cleanDomain = mainDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");

                const formatPrice = (price: any) => {
                    return new Intl.NumberFormat('id-ID').format(Number(price));
                };

                return dbPlans.map((plan: any) => {
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
            } catch (e) {
                console.error("[getPricingPlans] Failed to fetch landing page plans:", e);
                return [];
            }
        },
        ["pricing-plans-cache"],
        { revalidate: 3600, tags: ["pricing-plans"] }
    )();
}

/**
 * Mengambil nama paket aktif untuk daftar ID situs.
 */
export async function getActivePlanNamesForSites(siteIds: string[]): Promise<Record<string, string>> {
    if (siteIds.length === 0) return {};
    try {
        const subscriptions = await subscriptionRepo.findActivePlanNamesForSites(siteIds);
        const resultMap: Record<string, string> = {};
        subscriptions.forEach(sub => {
            resultMap[sub.siteId] = sub.plan.name;
        });
        return resultMap;
    } catch (error) {
        console.error("[getActivePlanNamesForSites] Failed:", error);
        return {};
    }
}

/**
 * Memperpanjang masa uji coba (trial) gratis selama 7 hari.
 */
export async function extendTrial(userId: string, userRole: string, siteId: string) {
    if (!siteId) throw new Error("Site ID required");

    const site = await billingRepo.findSiteById(siteId);
    if (!site) {
        throw new Error("Site not found");
    }

    const isAdmin = userRole === "admin";
    if (!isAdmin) {
        const hasAccess = await TenantClient.verifyUserSiteAccess(userId, siteId);
        if (!hasAccess) {
            throw new Error("Forbidden");
        }
    }

    const sub = await subscriptionRepo.findLatestSubscriptionAnyStatus(siteId);

    if (!sub) throw new Error("No subscription found");
    if (sub.trialExtended) throw new Error("Trial already extended");
    if (!sub.trialEndsAt) throw new Error("This is not a trial subscription");

    const newEndDate = new Date(sub.trialEndsAt);
    newEndDate.setDate(newEndDate.getDate() + 7);

    await subscriptionRepo.updateSubscriptionTrial(sub.id, {
        trialEndsAt: newEndDate,
        trialExtended: true
    });

    try {
        const { revalidateTag } = await import("next/cache");
        revalidateTag(`site-${siteId}`, "default");
    } catch (e) {
        console.error("Failed to revalidate subscription cache:", e);
    }

    (async () => {
        try {
            const siteOwner = await IdentityClient.getSiteOwner(siteId);
            if (siteOwner && siteOwner.email) {
                const { sendTrialExtendedEmail } = await import("@/lib/services/email");
                const formattedEndDate = newEndDate.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                });
                await sendTrialExtendedEmail({
                    toEmail: siteOwner.email,
                    userName: siteOwner.name || "Pengguna",
                    siteName: site?.name || "Website Anda",
                    days: 7,
                    newEndDate: formattedEndDate
                });
            }
        } catch (err) {
            console.error("[EXTEND_TRIAL_EMAIL_ERROR] Failed to send email:", err);
        }
    })();

    return {
        success: true,
        message: "Trial extended successfully by 7 days."
    };
}

/**
 * Mengambil daftar seluruh paket langganan (untuk admin).
 */
export async function getAllPlans() {
    return planRepo.findAllPlans();
}

/**
 * Mengambil detail satu subscription beserta paket langganannya.
 */
export async function getSubscriptionDetail(subId: string) {
    return subscriptionRepo.findSubscriptionById(subId);
}

/**
 * Mengambil subscription aktif berdasarkan siteId.
 */
export async function getActiveSubscription(siteId: string) {
    return subscriptionRepo.findActiveSubscription(siteId);
}

/**
 * Memperpanjang masa aktif subscription (admin).
 */
export async function extendSubscription(subId: string, days: number) {
    const sub = await subscriptionRepo.findSubscriptionById(subId);
    if (!sub) {
        throw new Error("NOT_FOUND");
    }

    let updateData: any = {
        status: "active"
    };

    // Jika paket saat ini adalah "Free", upgrade ke "Pro" untuk periode perpanjangan
    if (sub.plan.name.toLowerCase() === "free") {
        const proPlan = await planRepo.findPlanByName("Pro");
        if (proPlan) {
            updateData.planId = proPlan.id;
        }
        updateData.endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        updateData.trialEndsAt = null;
    } else {
        if (sub.endDate) {
            const currentEnd = new Date(sub.endDate);
            updateData.endDate = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
        } else if (sub.trialEndsAt) {
            const currentTrial = new Date(sub.trialEndsAt);
            updateData.trialEndsAt = new Date(currentTrial.getTime() + days * 24 * 60 * 60 * 1000);
        } else {
            updateData.endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }
    }

    const updated = await subscriptionRepo.updateSubscription(subId, updateData);

    return {
        success: true,
        message: `Subscription extended by ${days} days`,
        newEndDate: updated.endDate || updated.trialEndsAt,
        newPlan: updated.plan.name,
        newPlanObj: {
            id: updated.plan.id,
            name: updated.plan.name,
            price: updated.plan.price,
            maxSites: updated.plan.maxSites,
            maxPosts: updated.plan.maxPosts,
            maxProducts: updated.plan.maxProducts,
            addonSiteBilling: updated.plan.addonSiteBilling,
            features: updated.plan.features
        }
    };
}

/**
 * Membatalkan subscription (admin).
 */
export async function cancelSubscription(subId: string) {
    const sub = await subscriptionRepo.findSubscriptionById(subId);
    if (!sub) {
        throw new Error("NOT_FOUND");
    }

    await subscriptionRepo.updateSubscriptionStatusOnly(subId, "cancelled");

    // Kirim email pembatalan
    try {
        const site = await billingRepo.findSiteById(sub.siteId);
        const siteOwner = site ? await IdentityClient.getSiteOwner(site.id) : null;
        if (siteOwner && siteOwner.email) {
            const { sendSubscriptionCancelledEmail } = await import("@/lib/services/email");
            await sendSubscriptionCancelledEmail({
                toEmail: siteOwner.email,
                userName: siteOwner.name || "Pengguna",
                siteName: site?.name || "Situs",
                planName: sub.plan.name
            });
        }
    } catch (err) {
        console.error("[CANCEL_EMAIL_ERROR] Failed to send email:", err);
    }

    return { success: true, message: "Subscription cancelled" };
}

/**
 * Memperbarui paket langganan subscription (admin).
 */
export async function updateSubscriptionPlan(subId: string, planId: string) {
    const sub = await subscriptionRepo.findSubscriptionById(subId);
    if (!sub) {
        throw new Error("NOT_FOUND");
    }

    const updated = await subscriptionRepo.updateSubscription(subId, {
        planId,
        status: "active"
    });

    return {
        success: true,
        message: "Plan updated successfully",
        newPlan: updated.plan.name
    };
}
