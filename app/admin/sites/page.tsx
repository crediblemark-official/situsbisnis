import React from "react";
import { db } from "@/lib/core/db";
import SiteList from "./SiteList";

export const dynamic = "force-dynamic";

export default async function AdminSitesPage() {
    const rawSites = await db.site.findMany({
        orderBy: { createdAt: "desc" },
        where: {
            NOT: { subdomain: "admin" }
        },
        select: {
            id: true,
            name: true,
            subdomain: true,
            customDomain: true,
            createdAt: true,
            users: { select: { name: true, email: true }, take: 1 }
        }
    });

    const sites = await Promise.all(rawSites.map(async (site) => {
        const subs = await db.subscription.findMany({
            where: { siteId: site.id, status: "active" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
                id: true,
                trialEndsAt: true,
                trialExtended: true,
                plan: { select: { name: true } }
            }
        });
        return {
            ...site,
            subscriptions: subs
        };
    }));

    const serializedSites = JSON.parse(JSON.stringify(sites));

    return <SiteList initialSites={serializedSites} />;
}
