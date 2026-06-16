import { db } from "@/modules/shared/core/db";

/**
 * Mengambil paket langganan yang akan ditampilkan pada halaman harga.
 */
export async function findPricingPlans() {
    return db.plan.findMany({
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
}

/**
 * Mengambil semua paket (plans) terurut berdasarkan harga.
 */
export async function findAllPlans() {
    return db.plan.findMany({
        orderBy: { price: 'asc' },
        select: {
            id: true,
            name: true,
            price: true,
            priceYearly: true,
            interval: true,
            trialDays: true,
            maxSites: true,
            maxPosts: true,
            maxProducts: true,
            addonSiteBilling: true,
            features: true
        }
    });
}

/**
 * Mengambil satu plan berdasarkan nama (case-insensitive).
 */
export async function findPlanByName(name: string) {
    return db.plan.findFirst({
        where: { name: { equals: name, mode: "insensitive" } }
    });
}

/**
 * Mencari plan berdasarkan ID.
 */
export async function findPlanById(id: string) {
    return db.plan.findUnique({
        where: { id }
    });
}

/**
 * Memperbarui data plan berdasarkan ID.
 */
export async function updatePlan(id: string, data: Record<string, unknown>) {
    return db.plan.update({
        where: { id },
        data: data as any
    });
}

/**
 * Membuat plan baru.
 */
export async function createPlan(data: Record<string, unknown>) {
    return db.plan.create({
        data: data as any
    });
}
