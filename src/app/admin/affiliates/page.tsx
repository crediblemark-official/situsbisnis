import React from "react";
import { db } from "@/lib/core/db";
import AffiliateList from "./AffiliateList";

export const dynamic = "force-dynamic";

export default async function AdminAffiliatesPage() {
    const affiliates = await db.user.findMany({
        where: {
            referrals: {
                some: {} // Only fetch users who have at least 1 referral
            }
        },
        orderBy: {
            createdAt: "desc"
        },
        select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
            createdAt: true,
            _count: {
                select: { referrals: true }
            },
            referrals: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: "desc"
                }
            }
        }
    });

    return <AffiliateList data={affiliates} />;
}
