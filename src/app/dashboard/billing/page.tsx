import React from "react";
import { AlertCircle } from "lucide-react";
import { getSiteId } from "@/lib/domains/tenant";
import { db } from "@/lib/core/db";
import { LinkButton } from "@/components/ui/LinkButton";
import BillingClient from "@/components/dashboard/BillingClient";
import { getPlatformSettings } from "@/lib/settings/platform";


import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function BillingPage() {
    let siteId = await getSiteId();
    
    // Fallback for root domain/admin context (securely scoped to user sites)
    if (!siteId) {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
            const firstSiteLink = await db.siteUser.findFirst({
                where: {
                    userId: session.user.id
                },
                select: { siteId: true }
            });
            siteId = firstSiteLink?.siteId || null;
        }
    }

    if (!siteId) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
                <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-6">
                    <AlertCircle size={32} className="text-muted-foreground opacity-40" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Pilih Situs</h2>
                <p className="text-muted-foreground text-sm mt-2 max-w-xs text-center">
                    Silakan pilih situs terlebih dahulu untuk melihat informasi tagihan.
                </p>
                <LinkButton href="/dashboard" className="mt-8">
                    Kembali
                </LinkButton>
            </div>
        );
    }

    const subscription = await db.subscription.findFirst({
        where: { siteId, status: "active" },
        include: { plan: true },
        orderBy: { createdAt: "desc" }
    });
    
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
            addonSiteBilling: true,
            showInPricing: true,
            createdAt: true,
            updatedAt: true
        }
    });

    // Serialize data for Client Component
    const serializedPlans = dbPlans.map((plan: any) => ({
        ...plan,
        price: plan.price.toNumber(),
        priceYearly: plan.priceYearly ? plan.priceYearly.toNumber() : null,
        originalPrice: plan.originalPrice ? plan.originalPrice.toNumber() : 0,
        originalPriceYearly: plan.originalPriceYearly ? plan.originalPriceYearly.toNumber() : 0,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
    }));

    let serializedCurrentPlan: any = (subscription?.plan as any) ? {
        ...(subscription.plan as any),
        price: (subscription.plan as any).price.toNumber(),
        priceYearly: (subscription.plan as any).priceYearly ? (subscription.plan as any).priceYearly.toNumber() : null,
        originalPrice: (subscription.plan as any).originalPrice ? (subscription.plan as any).originalPrice.toNumber() : 0,
        originalPriceYearly: (subscription.plan as any).originalPriceYearly ? (subscription.plan as any).originalPriceYearly.toNumber() : 0,
        createdAt: (subscription.plan as any).createdAt.toISOString(),
        updatedAt: (subscription.plan as any).updatedAt.toISOString(),
        subscriptionId: subscription.id,
        endDate: subscription.endDate?.toISOString() || null,
        trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
        trialExtended: subscription.trialExtended || false,
        status: subscription.status,
        addonSlots: subscription.addonSlots || 0
    } : null;

    // Fallback: If no active subscription, treat the "Free" plan as current plan if it exists
    if (!serializedCurrentPlan) {
        const freePlan: any = dbPlans.find((p: any) => p.name.toLowerCase() === 'free');
        if (freePlan) {
            serializedCurrentPlan = {
                ...freePlan,
                price: freePlan.price.toNumber(),
                priceYearly: freePlan.priceYearly ? freePlan.priceYearly.toNumber() : null,
                originalPrice: freePlan.originalPrice ? freePlan.originalPrice.toNumber() : 0,
                originalPriceYearly: freePlan.originalPriceYearly ? freePlan.originalPriceYearly.toNumber() : 0,
                createdAt: freePlan.createdAt.toISOString(),
                updatedAt: freePlan.updatedAt.toISOString(),
                subscriptionId: null,
                endDate: null,
                status: 'none'
            };
        }
    }

    // Fetch Admin Site for payment settings
    const adminSite = await db.site.findUnique({
        where: { subdomain: "admin" },
        select: {
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
    });

    const paymentMethods = (adminSite as any)?.paymentSettings || [];
    const platform = await getPlatformSettings();
    const whatsappNumber = platform.whatsappNumber || "6281234567890";

    return (
        <BillingClient 
            plans={serializedPlans as any} 
            currentPlan={serializedCurrentPlan as any}
            paymentMethods={paymentMethods}
            siteId={siteId}
            whatsappNumber={whatsappNumber}
        />
    );
}

