import { headers } from "next/headers";
import { db } from "@/lib/core/db";
import { getRootDomain } from "@/lib/domains/utils";
import { isFeatureEnabled } from "@/lib/billing/features";
import { unstable_cache } from "next/cache";
import { GRACE_PERIOD_DAYS } from "@/lib/billing/constants";

export const getTenant = async () => {
    const headerList = await headers();
    const fullHost = headerList.get("host");
    
    const subdomainFromProxy = headerList.get("x-tenant-subdomain");
    if (subdomainFromProxy) {
        return subdomainFromProxy;
    }
    
    if (!fullHost) return null;

    const hostname = fullHost.split(":")[0];
    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || isIp;

    if (isLocal) {
        return null;
    }

    const rootDomain = getRootDomain(fullHost);

    // If we are exactly on the root domain, it's the platform, not a tenant
    // Guard: If NEXT_PUBLIC_ROOT_DOMAIN is not set, we shouldn't assume a 2-part domain is the root
    const isExplicitRoot = process.env.NEXT_PUBLIC_ROOT_DOMAIN && 
        (fullHost === rootDomain || fullHost === `www.${rootDomain}`);
    
    const isLocalhost = fullHost.includes("localhost");

    if (isExplicitRoot || (isLocalhost && (fullHost === rootDomain || fullHost === `www.${rootDomain}`))) {
        return null;
    }

    // Check if it's a subdomain (e.g., tenant.example.com or tenant.localhost:3000)
    if (fullHost.endsWith(`.${rootDomain}`)) {
        return fullHost.replace(`.${rootDomain}`, "");
    }

    // Otherwise, it might be a custom domain (e.g., example.io)
    // We return the host without port as the "subdomain identifier" for getSiteId to lookup via customDomain
    return fullHost.split(":")[0];
}

export const getSite = async () => {
    const siteId = await getSiteId();
    if (!siteId) return null;

    return unstable_cache(
        async () => {
            const site = await db.site.findUnique({
                where: { id: siteId },
                include: {
                    siteSettings: true,
                }
            });
            return site;
        },
        [`site-data-${siteId}`],
        { 
            revalidate: 300, // 5 minutes
            tags: [`site-${siteId}`] 
        }
    )();
}

export const getSiteId = async () => {
    const headerList = await headers();
    const siteIdFromHeader = headerList.get("x-site-id");
    if (siteIdFromHeader) return siteIdFromHeader;

    const tenant = await getTenant();
    if (!tenant) return null;

    return unstable_cache(
        async () => {
            // 1. Try lookup by subdomain
            let site = await db.site.findUnique({
                where: { subdomain: tenant },
                select: { id: true }
            });

            // 2. If not found by subdomain, try lookup by customDomain
            if (!site) {
                const customSite = await db.site.findFirst({
                    where: { customDomain: tenant }
                });

                if (customSite) {
                    const sub = await db.subscription.findFirst({
                        where: { siteId: customSite.id, status: "active" },
                        include: { plan: true }
                    });
                    const planName = sub?.plan?.name || "Free";
                    const planFeatures = sub?.plan?.features || {};
                    
                    // Check if current plan allows custom domains
                    if (isFeatureEnabled(planName, planFeatures, "hasCustomDomain")) {
                        return customSite.id;
                    }
                }
            }

            return site?.id || null;
        },
        [`tenant-id-${tenant}`],
        { 
            revalidate: 3600, // Cache for 1 hour
            tags: [`site-id-${tenant}`] 
        }
    )();
}

export const getSubscription = async () => {
    const siteId = await getSiteId();
    if (!siteId) return null;

    return unstable_cache(
        async () => {
            const subscription = await db.subscription.findFirst({
                where: {
                    siteId,
                    status: { in: ["active", "past_due"] }
                },
                include: { plan: true },
                orderBy: { createdAt: "desc" }
            });
            return subscription;
        },
        [`site-sub-${siteId}`],
        {
            revalidate: 300, // 5 minutes
            tags: [`site-${siteId}`, "subscription"]
        }
    )();
}

const getAnySubscription = async () => {
    const siteId = await getSiteId();
    if (!siteId) return null;

    return unstable_cache(
        async () => {
            // Prioritaskan subscription dengan status active/past_due (masih berlaku)
            const activeSub = await db.subscription.findFirst({
                where: {
                    siteId,
                    status: { in: ["active", "past_due"] }
                },
                include: { plan: true },
                orderBy: { createdAt: "desc" }
            });
            if (activeSub) return activeSub;

            // Fallback: cari subscription terakhir apapun statusnya
            return db.subscription.findFirst({
                where: { siteId },
                include: { plan: true },
                orderBy: { createdAt: "desc" }
            });
        },
        [`site-sub-any-${siteId}`],
        {
            revalidate: 300,
            tags: [`site-${siteId}`, "subscription"]
        }
    )();
}

export type SiteAccessStatus = "active" | "expired" | "grace_period" | "no_subscription";

export const getSiteAccessStatus = async (): Promise<SiteAccessStatus> => {
    const sub = await getAnySubscription();
    if (!sub) return "no_subscription";

    // Permanent plan (active, no trial, no end date)
    if (sub.status === "active" && !sub.trialEndsAt && !sub.endDate) return "active";

    const now = new Date();

    // Check trial
    if (sub.trialEndsAt) {
        const trialEnd = new Date(sub.trialEndsAt);
        if (now <= trialEnd) return "active";

        // Trial expired - Check Grace Period
        const graceEnd = new Date(trialEnd);
        graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);

        if (now <= graceEnd) return "grace_period";
        return "expired";
    }

    // Check fixed period subscription
    if (sub.endDate) {
        const end = new Date(sub.endDate);
        if (now <= end) return "active";

        const graceEnd = new Date(end);
        graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);

        if (now <= graceEnd) return "grace_period";
        return "expired";
    }

    // Fallback: map DB status to SiteAccessStatus
    if (sub.status === "cancelled" || sub.status === "expired") return "expired";
    if (sub.status === "past_due") return "grace_period";
    return "active";
}
