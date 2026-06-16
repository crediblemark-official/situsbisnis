import React from "react";
import { db } from "@/lib/core/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Globe, Plus, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { SiteList } from "./SiteList";

export default async function MySitesPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const siteLinks = await db.siteUser.findMany({
        where: { userId: (session.user as any).id },
        select: {
            site: {
                select: {
                    id: true,
                    name: true,
                    subdomain: true,
                    customDomain: true,
                    customDomainVerified: true
                }
            }
        }
    });

    const rawSites = siteLinks.map(link => link.site);
    
    // Dapatkan data subscription untuk masing-masing siteId
    const sites = await Promise.all(rawSites.map(async (site) => {
        const sub = await db.subscription.findFirst({
            where: { siteId: site.id, status: "active" },
            select: {
                trialEndsAt: true,
                plan: {
                    select: {
                        name: true,
                        features: true
                    }
                }
            }
        });
        return {
            ...site,
            subscriptions: sub ? [sub] : []
        };
    }));
    
    const siteIds = rawSites.map(s => s.id);
    
    // Calculate global resource limit for this user
    // We look at the subscription with the highest limit
    const activeSubscriptions = await db.subscription.findMany({
        where: { siteId: { in: siteIds }, status: "active" },
        select: {
            addonSlots: true,
            plan: {
                select: {
                    maxSites: true
                }
            }
        }
    });
    
    // Total Limit = Plan Max Sites + Purchased Addon Slots
    const maxSitesAllowed = activeSubscriptions.length > 0 
        ? Math.max(...activeSubscriptions.map(s => (s.plan?.maxSites || 1) + (s.addonSlots || 0)))
        : 1; // Default for free/no subscription

    const isLimitReached = maxSitesAllowed !== -1 && sites.length >= maxSitesAllowed;

    if (sites.length === 0) {
        redirect("/onboarding");
    }

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

    return (
        <div className="w-full animate-in fade-in duration-700 pb-32 space-y-6">
            <PageHeader
                title="Situs Saya"
                subtitle="Kelola semua website Anda dalam satu tempat."
                icon={<Globe />}
            >
                {isLimitReached ? (
                    <LinkButton
                        href="/dashboard/billing"
                        icon={<ArrowUpRight size={16} />}
                        className="bg-amber-500 text-black shadow-amber-500/20 animate-pulse"
                    >
                        Upgrade Limit
                    </LinkButton>
                ) : (
                    <LinkButton
                        href="/onboarding"
                        icon={<Plus size={16} />}
                    >
                        Tambah Situs
                    </LinkButton>
                )}
            </PageHeader>

            <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${isLimitReached ? 'bg-amber-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min((sites.length / (maxSitesAllowed === -1 ? sites.length : maxSitesAllowed)) * 100, 100)}%` }}
                    />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    Usage: {sites.length} / {maxSitesAllowed === -1 ? '∞' : maxSitesAllowed} Sites
                </span>
            </div>
            <SiteList initialSites={sites} rootDomain={rootDomain} isLimitReached={isLimitReached} />
        </div>
    );
}
