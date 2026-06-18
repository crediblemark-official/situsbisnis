import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import UserAffiliateView from "@/modules/auth/ui/dashboard/affiliate/UserAffiliateView";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AffiliateDashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/login");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            referralCode: true,
            affiliateBalance: true,
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

    if (!user) redirect("/login");

    const [commissions, withdrawals] = await Promise.all([
        db.commission.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 10
        }),
        db.withdrawal.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 10
        })
    ]);

    // Generate referral code if missing
    let finalUser = {
        ...user,
        commissions,
        withdrawals
    };
    if (!user.referralCode) {
        const crypto = require("crypto");
        let newReferralCode = crypto.randomBytes(4).toString("hex").substring(0, 6).toUpperCase();
        let codeExists = true;
        while (codeExists) {
            const existingCode = await db.user.findUnique({ where: { referralCode: newReferralCode } });
            if (!existingCode) codeExists = false;
            else {
                newReferralCode = crypto.randomBytes(4).toString("hex").substring(0, 6).toUpperCase();
            }
        }
        await db.user.update({
            where: { id: user.id },
            data: { referralCode: newReferralCode }
        });
        
        finalUser = {
            ...user,
            commissions,
            withdrawals,
            referralCode: newReferralCode
        };
    }

    const serializedUser = JSON.parse(JSON.stringify(finalUser));

    return <UserAffiliateView user={serializedUser} />;
}
