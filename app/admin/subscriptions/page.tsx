import React from "react";
import { db } from "@/lib/core/db";
import SubscriptionList from "./SubscriptionList";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
    const rawSubscriptions = await db.subscription.findMany({
        orderBy: { startDate: "desc" },
        select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            addonSlots: true,
            trialEndsAt: true,
            planId: true,
            siteId: true,
            plan: { 
                select: { 
                    id: true, 
                    name: true, 
                    price: true,
                    maxSites: true,
                    maxPosts: true,
                    maxProducts: true,
                    addonSiteBilling: true,
                    features: true
                } 
            }
        }
    });

    const siteIds = Array.from(new Set(rawSubscriptions.map(s => s.siteId)));
    const sites = await db.site.findMany({
        where: { 
            id: { in: siteIds },
            NOT: { subdomain: "admin" } 
        },
        select: { 
            id: true,
            name: true, 
            subdomain: true,
            users: {
                select: {
                    name: true,
                    email: true
                }
            },
            siteSettings: {
                select: {
                    whatsappNumber: true,
                    contactPhone: true
                }
            }
        } 
    });
    const siteMap = new Map(sites.map(s => [s.id, s]));

    const subscriptions = rawSubscriptions
        .map(sub => ({
            ...sub,
            site: siteMap.get(sub.siteId) || null
        }))
        .filter(sub => sub.site !== null);

    const serializedSubscriptions = JSON.parse(JSON.stringify(subscriptions));

    return <SubscriptionList initialSubscriptions={serializedSubscriptions} />;
}
