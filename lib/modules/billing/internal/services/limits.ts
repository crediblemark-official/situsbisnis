import { db } from "@/lib/core/db";
import { ContentClient } from "@/lib/modules/content/client";
import { CatalogClient } from "@/lib/modules/catalog/client";
import { OrderClient } from "@/lib/modules/order/client";

export type LimitType = "maxPosts" | "maxProducts" | "maxOrders" | "maxTestimonials" | "maxAssets";

const LIMIT_CONFIG: Record<LimitType, {
    field: string;
    label: string;
    dependency?: string; // Fitur opsional yang harus aktif di paket (contoh: hasBlog)
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
            return bytes / (1024 * 1024); // Konversi ke Megabytes (MB)
        }
    }
};

export async function checkSiteLimit(siteId: string, type: LimitType) {
    // Ambil subscription aktif untuk siteId
    const subscription = await db.subscription.findFirst({
        where: { siteId, status: "active" },
        include: { plan: true },
        orderBy: { createdAt: "desc" }
    });

    if (!subscription || !subscription.plan) {
        return {
            allowed: false,
            message: "No active subscription found. Please select a plan in the billing dashboard."
        };
    }

    const plan = subscription.plan;
    const config = LIMIT_CONFIG[type];

    // 1. Cek dependensi fitur (apakah modul aktif di plan)
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

    // 2. Cek limitasi numerik
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
