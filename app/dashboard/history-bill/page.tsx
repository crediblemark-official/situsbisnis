import React from "react";
import { AlertCircle } from "lucide-react";
import { getSiteId } from "@/lib/domains/tenant";
import { db } from "@/lib/core/db";
import { LinkButton } from "@/components/ui/LinkButton";
import HistoryBillClient from "@/components/dashboard/HistoryBillClient";
import { getPlatformSettings } from "@/lib/settings/platform";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function HistoryBillPage() {
    let siteId = await getSiteId();
    
    // Fallback for root domain/admin context
    if (!siteId) {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
            const firstUserSite = await db.site.findFirst({
                where: {
                    users: {
                        some: { id: session.user.id }
                    }
                },
                select: { id: true }
            });
            siteId = firstUserSite?.id || null;
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
                    Silakan pilih situs terlebih dahulu untuk melihat riwayat tagihan.
                </p>
                <LinkButton href="/dashboard" className="mt-8">
                    Kembali
                </LinkButton>
            </div>
        );
    }

    const transactions = await db.paymentTransaction.findMany({
        where: { siteId },
        select: {
            id: true,
            amount: true,
            status: true,
            addonType: true,
            addonQuantity: true,
            paymentMethod: true,
            paymentUrl: true,
            createdAt: true,
            updatedAt: true,
            plan: {
                select: {
                    id: true,
                    name: true,
                    price: true,
                    priceYearly: true,
                    originalPrice: true,
                    originalPriceYearly: true,
                    createdAt: true,
                    updatedAt: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

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

    // Serialize data
    const serializedTransactions = transactions.map(tx => ({
        ...tx,
        amount: tx.amount.toNumber(),
        createdAt: tx.createdAt.toISOString(),
        updatedAt: tx.updatedAt.toISOString(),
        plan: {
            ...tx.plan,
            price: tx.plan.price.toNumber(),
            priceYearly: (tx.plan as any).priceYearly ? (tx.plan as any).priceYearly.toNumber() : null,
            originalPrice: (tx.plan as any).originalPrice ? (tx.plan as any).originalPrice.toNumber() : 0,
            originalPriceYearly: (tx.plan as any).originalPriceYearly ? (tx.plan as any).originalPriceYearly.toNumber() : 0,
        }
    }));

    return (
        <HistoryBillClient
            transactions={serializedTransactions}
            paymentMethods={paymentMethods}
            whatsappNumber={whatsappNumber}
            siteId={siteId}
        />
    );
}
