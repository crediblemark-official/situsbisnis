import { db } from "@/modules/shared/core/db";
import { unstable_cache } from "next/cache";
import * as billingRepo from "../repositories/billing.repository";
import { ContentClient } from "@/lib/modules/content/client";
import { CatalogClient } from "@/lib/modules/catalog/client";
import { OrderClient } from "@/lib/modules/order/client";
import { sendWhatsAppNotification } from "@/lib/services/whatsapp";
import { TenantClient } from "@/lib/modules/tenant/client";
import { IdentityClient } from "@/lib/modules/identity/client";
import { LimitType, LimitCheckResult, PricingPlanDTO } from "../index";

const LIMIT_CONFIG: Record<LimitType, {
    field: string;
    label: string;
    dependency?: string;
    countFn: (siteId: string) => Promise<number>;
}> = {
    maxPosts: {
        field: "maxPosts",
        label: "posts",
        dependency: "hasBlog",
        countFn: (siteId) => ContentClient.countPosts(siteId)
    },
    maxProducts: {
        field: "maxProducts",
        label: "products",
        dependency: "hasProducts",
        countFn: (siteId) => CatalogClient.countProducts(siteId)
    },
    maxOrders: {
        field: "maxOrders",
        label: "orders",
        dependency: "hasOrders",
        countFn: (siteId) => OrderClient.countOrders(siteId)
    },
    maxTestimonials: {
        field: "maxTestimonials",
        label: "testimonials",
        dependency: "hasTestimonials",
        countFn: (siteId) => ContentClient.countTestimonials(siteId)
    },
    maxAssets: {
        field: "maxAssets",
        label: "MB storage",
        dependency: "hasGallery", 
        countFn: async (siteId) => {
            const bytes = await ContentClient.getMediaSize(siteId);
            return bytes / (1024 * 1024);
        }
    }
};

/**
 * Mengambil paket harga untuk ditampilkan ke landing page dengan caching.
 */
export async function getPricingPlans(): Promise<PricingPlanDTO[]> {
    return unstable_cache(
        async () => {
            try {
                const dbPlans = await billingRepo.findPricingPlans();
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
        const subscriptions = await billingRepo.findActivePlanNamesForSites(siteIds);
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
 * Memverifikasi apakah suatu situs melampaui limitasi paket langganannya.
 */
export async function checkSiteLimit(siteId: string, type: LimitType): Promise<LimitCheckResult> {
    const subscription = await billingRepo.findActiveSubscription(siteId);

    if (!subscription || !subscription.plan) {
        return {
            allowed: false,
            message: "No active subscription found. Please select a plan in the billing dashboard."
        };
    }

    const plan = subscription.plan;
    const config = LIMIT_CONFIG[type];

    if (config.dependency) {
        const features = (plan.features as any) || {};
        const isEnabled = features[config.dependency] === true;
        if (!isEnabled) {
            return {
                allowed: false,
                message: `Feature Disabled: The ${config.label} module is not included in your current plan. Please upgrade to unlock this feature.`
            };
        }
    }

    const limit = (plan as any)[config.field] ?? -1;
    if (limit === -1) {
        return { allowed: true };
    }

    const count = await config.countFn(siteId);
    if (count >= limit) {
        return {
            allowed: false,
            message: `Resource Limit Exceeded: Your ${plan.name} plan is capped at ${limit} ${config.label}. Upgrade your plan in the billing tab to unlock more.`
        };
    }

    return { allowed: true };
}

/**
 * Memproses transaksi yang disetujui (aktivasi paket/addon slots).
 */
export async function processApprovedTransaction(transactionId: string) {
    const updatedTx = await db.$transaction(async (tx) => {
        const currentTx = await billingRepo.findTransactionById(tx, transactionId);
        if (!currentTx) {
            throw new Error("TRANSACTION_NOT_FOUND");
        }
        if (currentTx.status !== "pending") {
            throw new Error("ALREADY_PROCESSED");
        }

        const updated = await billingRepo.updateTransactionStatus(tx, transactionId, "approved");

        if (updated.couponId) {
            await billingRepo.incrementCouponUses(tx, updated.couponId);
        }

        const siteOwner = await IdentityClient.getSiteOwner(updated.siteId);
        const siteInfo = await TenantClient.getSiteInfo(updated.siteId);

        if (siteOwner && siteOwner.referredById) {
            const platformSettings = await billingRepo.findPlatformSettings(tx);
            const isRecurringEnabled = platformSettings?.affiliateRecurringCommission ?? false;
            const approvedTxCount = await billingRepo.countApprovedTransactions(tx, updated.siteId);

            let shouldAwardCommission = true;
            if (!isRecurringEnabled) {
                if (approvedTxCount > 1) {
                    shouldAwardCommission = false;
                }
            }

            if (shouldAwardCommission) {
                let ratePercentage = 20;
                if (approvedTxCount > 1) {
                    ratePercentage = platformSettings?.affiliateRecurringCommissionRate ? Number(platformSettings.affiliateRecurringCommissionRate) : 10;
                } else {
                    ratePercentage = platformSettings?.affiliateCommissionRate ? Number(platformSettings.affiliateCommissionRate) : 20;
                }
                
                const commissionAmount = Number(updated.amount) * (ratePercentage / 100);
                
                await IdentityClient.awardAffiliateCommission(tx, {
                    userId: siteOwner.referredById,
                    amount: commissionAmount,
                    transactionId: updated.id,
                    description: `Komisi pembayaran dari situs ${siteInfo?.name || "website"}`
                });
            }
        }

        if (updated.addonType === "site_slot") {
            const existingSub = await billingRepo.findLatestSubscription(tx, updated.siteId);
            if (existingSub) {
                await billingRepo.updateSubscriptionAddonSlots(tx, existingSub.id, updated.addonQuantity || 0);
            }
        } else {
            const activeSubBeforeUpgrade = await billingRepo.findLatestSubscription(tx, updated.siteId);
            const carryOverSlots = activeSubBeforeUpgrade?.addonSlots || 0;

            await billingRepo.cancelAllSubscriptions(tx, updated.siteId);

            const now = new Date();
            const endDate = new Date(now);
            if (updated.plan.interval === "year") {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }

            const existingSubOfThisPlan = await billingRepo.findSubscriptionBySiteAndPlan(tx, updated.siteId, updated.planId);
            if (existingSubOfThisPlan) {
                await billingRepo.activateExistingSubscription(tx, existingSubOfThisPlan.id, {
                    endDate,
                    addonSlots: Math.max(existingSubOfThisPlan.addonSlots, carryOverSlots)
                });
            } else {
                await billingRepo.createSubscription(tx, {
                    siteId: updated.siteId,
                    planId: updated.planId,
                    status: "active",
                    startDate: now,
                    endDate,
                    addonSlots: carryOverSlots
                });
            }
        }

        return updated;
    }, {
        maxWait: 15000,
        timeout: 45000,
    });

    if (updatedTx && updatedTx.status === "approved") {
        try {
            const { revalidateTag } = await import("next/cache");
            revalidateTag(`site-${updatedTx.siteId}`, "default");
        } catch (e) {
            console.error("Failed to revalidate subscription cache:", e);
        }

        (async () => {
            try {
                const siteContact = await TenantClient.getSiteContact(updatedTx.siteId);
                const siteInfo = await TenantClient.getSiteInfo(updatedTx.siteId);
                const activeSub = await billingRepo.findActiveSubscription(updatedTx.siteId);

                const formattedEndDate = activeSub?.endDate
                    ? new Date(activeSub.endDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })
                    : "";

                const formattedAmount = new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0
                }).format(Number(updatedTx.amount));

                const planName = updatedTx.plan.name.toUpperCase();
                const siteName = siteInfo?.name || "Website Anda";

                const recipientPhone = siteContact?.whatsappNumber || siteContact?.contactPhone;
                if (recipientPhone) {
                    let message = `*SitusBisnis - Pembayaran Berhasil* 🎉\n\n`;
                    message += `Halo Pengelola *${siteName}*,\n\n`;
                    message += `Pembayaran Anda untuk paket *${planName}* sebesar *${formattedAmount}* telah berhasil diverifikasi dan disetujui.\n\n`;
                    if (formattedEndDate) {
                        message += `Layanan paket aktif/diperpanjang hingga: *${formattedEndDate}*.\n\n`;
                    }
                    message += `Terima kasih atas kepercayaan Anda menggunakan layanan kami!\n\n`;
                    message += `_Pesan ini dikirim otomatis oleh sistem SitusBisnis._`;

                    await sendWhatsAppNotification(recipientPhone, message);
                }

                const siteOwner = await IdentityClient.getSiteOwner(updatedTx.siteId);
                if (siteOwner && siteOwner.email) {
                    const { sendPaymentSuccessEmail } = await import("@/lib/services/email");
                    await sendPaymentSuccessEmail({
                        toEmail: siteOwner.email,
                        userName: siteOwner.name || "Pengguna",
                        siteName,
                        planName,
                        amount: formattedAmount,
                        endDate: formattedEndDate
                    });
                }
            } catch (error) {
                console.error("[NOTIFICATION_TRIGGER_ERROR]", error);
            }
        })();
    }

    return updatedTx;
}

/**
 * Memperbarui status transaksi.
 */
export async function updateTransactionStatus(transactionId: string, status: string) {
    return db.$transaction(async (tx) => {
        const currentTx = await billingRepo.findTransactionById(tx, transactionId);
        if (!currentTx) {
            throw new Error("TRANSACTION_NOT_FOUND");
        }
        if (currentTx.status !== "pending") {
            throw new Error("ALREADY_PROCESSED");
        }
        return billingRepo.updateTransactionStatus(tx, transactionId, status as any);
    });
}
