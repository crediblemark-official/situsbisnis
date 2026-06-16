import * as billingRepo from "../repositories/billing.repository";

/**
 * Mengambil konteks billing untuk halaman settings situs:
 * - Langganan aktif + nama plan
 * - Semua plan (untuk dropdown upgrade)
 */
export async function getSiteSettingsBillingContext(siteId: string) {
    const [subscription, allPlans] = await Promise.all([
        billingRepo.findActiveSubscription(siteId),
        billingRepo.findAllPlans()
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
