import React from "react";
import { AlertCircle } from "lucide-react";
import { getSiteId } from "@/lib/domains/tenant";
import { LinkButton } from "@/components/ui/LinkButton";
import BillingClientComponent from "@/components/dashboard/BillingClient";
import { FinancialClient } from "@/modules/financial";
import { db } from "@/lib/core/db";
import { redirect } from "next/navigation";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function BillingPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    let siteId = await getSiteId();
    
    // Fallback untuk root domain / dashboard utama (cari situs milik sendiri yang berstatus owner)
    if (!siteId) {
        const ownedSiteLink = await db.siteUser.findFirst({
            where: {
                userId: (session.user as any).id,
                role: "owner"
            },
            select: { siteId: true }
        });
        siteId = ownedSiteLink?.siteId || null;
    } else {
        // Jika siteId terdeteksi dari domain/subdomain, pastikan user saat ini adalah owner situs tersebut
        const isOwner = await db.siteUser.findFirst({
            where: {
                siteId: siteId,
                userId: (session.user as any).id,
                role: "owner"
            }
        });
        if (!isOwner) {
            return (
                <div className="w-full h-[60vh] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
                    <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
                        <AlertCircle size={32} className="text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Akses Ditolak</h2>
                    <p className="text-muted-foreground text-sm mt-2 max-w-xs text-center">
                        Hanya pemilik situs yang dapat mengelola dan melihat informasi tagihan.
                    </p>
                    <LinkButton href="/dashboard" className="mt-8">
                        Kembali ke Dashboard
                    </LinkButton>
                </div>
            );
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
                    Silakan buat situs terlebih dahulu untuk melihat informasi tagihan.
                </p>
                <LinkButton href="/onboarding" className="mt-8">
                    Buat Situs
                </LinkButton>
            </div>
        );
    }

    const { plans, currentPlan, paymentMethods, whatsappNumber, paymentGateway } = await FinancialClient.getSubscriptionContext(siteId);

    return (
        <BillingClientComponent 
            plans={plans as any} 
            currentPlan={currentPlan as any}
            paymentMethods={paymentMethods}
            siteId={siteId}
            whatsappNumber={whatsappNumber}
            paymentGateway={paymentGateway}
        />
    );
}

