import { db } from "@/modules/shared/core/db";
import * as planRepo from "../repositories/plan.repository";
import * as subscriptionRepo from "../repositories/subscription.repository";

/**
 * Mengambil konteks billing untuk halaman settings situs:
 * - Langganan aktif + nama plan
 * - Semua plan (untuk dropdown upgrade)
 */
export async function getSiteSettingsBillingContext(siteId: string) {
    const [subscription, allPlans] = await Promise.all([
        subscriptionRepo.findActiveSubscription(siteId),
        planRepo.findAllPlans()
    ]);

    const plan = subscription?.plan as any;
    const activePlanName = plan?.name || allPlans.find((p: any) => Number(p.price) === 0)?.name || "Free";
    const activePlanPrice = plan?.price ? Number(plan.price) : 0;

    return {
        activePlanName,
        activePlanPrice,
        isTrial: subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) > new Date() : false,
        trialEndsAt: subscription?.trialEndsAt ?? null,
        maxSites: plan?.maxSites || 1,
        planFeatures: {
            ...(plan?.features as any || {}),
            maxPosts: plan?.maxPosts,
            maxAssets: plan?.maxAssets,
            maxProducts: plan?.maxProducts,
            maxTestimonials: plan?.maxTestimonials,
            maxOrders: plan?.maxOrders,
        },
        allPlans: allPlans.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price)
        }))
    };
}

/**
 * Mengambil konteks data langganan lengkap untuk halaman Billing Dashboard.
 */
export async function getSubscriptionContext(siteId: string) {
    const [subscription, dbPlans, adminSite] = await Promise.all([
        subscriptionRepo.findActiveSubscription(siteId),
        planRepo.findPricingPlans(),
        db.site.findUnique({
            where: { subdomain: "admin" },
            select: {
                siteSettings: {
                    select: {
                        whatsappNumber: true
                    }
                },
                paymentSettings: {
                    select: {
                        id: true,
                        bankName: true,
                        accountHolder: true,
                        accountNumber: true,
                        instructions: true
                    }
                }
            }
        })
    ]);

    // Serialize data for Client Component
    const serializedPlans = dbPlans.map((plan: any) => ({
        ...plan,
        price: Number(plan.price),
        priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
        originalPrice: plan.originalPrice ? Number(plan.originalPrice) : 0,
        originalPriceYearly: plan.originalPriceYearly ? Number(plan.originalPriceYearly) : 0,
    }));

    let serializedCurrentPlan: any = (subscription?.plan as any) ? {
        ...(subscription.plan as any),
        price: Number((subscription.plan as any).price),
        priceYearly: (subscription.plan as any).priceYearly ? Number((subscription.plan as any).priceYearly) : null,
        originalPrice: (subscription.plan as any).originalPrice ? Number((subscription.plan as any).originalPrice) : 0,
        originalPriceYearly: (subscription.plan as any).originalPriceYearly ? Number((subscription.plan as any).originalPriceYearly) : 0,
        subscriptionId: subscription.id,
        endDate: subscription.endDate ? subscription.endDate.toISOString() : null,
        trialEndsAt: subscription.trialEndsAt ? subscription.trialEndsAt.toISOString() : null,
        trialExtended: subscription.trialExtended || false,
        status: subscription.status,
        addonSlots: subscription.addonSlots || 0
    } : null;

    // Fallback: Jika tidak ada subscription aktif, anggap paket "Free" sebagai paket saat ini jika ada
    if (!serializedCurrentPlan) {
        const freePlan: any = dbPlans.find((p: any) => p.name.toLowerCase() === 'free');
        if (freePlan) {
            serializedCurrentPlan = {
                ...freePlan,
                price: Number(freePlan.price),
                priceYearly: freePlan.priceYearly ? Number(freePlan.priceYearly) : null,
                originalPrice: freePlan.originalPrice ? Number(freePlan.originalPrice) : 0,
                originalPriceYearly: freePlan.originalPriceYearly ? Number(freePlan.originalPriceYearly) : 0,
                subscriptionId: null,
                endDate: null,
                status: 'none'
            };
        }
    }

    const paymentMethods = (adminSite as any)?.paymentSettings || [];
    const whatsappNumber = adminSite?.siteSettings?.whatsappNumber || "6281234567890";

    return {
        plans: serializedPlans,
        currentPlan: serializedCurrentPlan,
        paymentMethods,
        whatsappNumber
    };
}

/**
 * Mengambil seluruh data settings platform admin untuk halaman Admin Settings.
 */
export async function getAdminSettingsContext() {
    const [adminSite, plans, platformSettings] = await Promise.all([
        db.site.findUnique({
            where: { subdomain: "admin" },
            include: {
                siteSettings: {
                    select: {
                        siteName: true,
                        contactEmail: true,
                        contactPhone: true,
                        whatsappNumber: true,
                        footerAddress: true,
                        allowRegistration: true
                    }
                },
                paymentSettings: true
            }
        }),
        db.plan.findMany({
            orderBy: { price: "asc" },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                priceYearly: true,
                originalPrice: true,
                originalPriceYearly: true,
                trialDays: true,
                interval: true,
                features: true,
                maxPosts: true,
                maxProducts: true,
                maxAssets: true,
                maxTestimonials: true,
                maxOrders: true,
                maxSites: true,
                showInPricing: true,
                createdAt: true,
                updatedAt: true
            }
        }),
        db.platformSettings.findUnique({
            where: { id: "global" }
        })
    ]);

    return {
        adminSite,
        plans,
        platformSettings
    };
}
