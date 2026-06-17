import React from "react";
import { AlertCircle } from "lucide-react";
import { getSiteId } from "@/lib/domains/tenant";
import { LinkButton } from "@/components/ui/LinkButton";
import BillingClientComponent from "@/components/dashboard/BillingClient";
import { FinancialClient } from "@/modules/financial";
import { IdentityClient } from "@/modules/auth";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function BillingPage() {
    let siteId = await getSiteId();
    
    // Fallback for root domain/admin context (securely scoped to user sites)
    if (!siteId) {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
            const userSitesRes = await IdentityClient.getUserSites(session.user.id);
            siteId = userSitesRes.sites[0]?.id || null;
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

    const { plans, currentPlan, paymentMethods, whatsappNumber } = await FinancialClient.getSubscriptionContext(siteId);

    return (
        <BillingClientComponent 
            plans={plans as any} 
            currentPlan={currentPlan as any}
            paymentMethods={paymentMethods}
            siteId={siteId}
            whatsappNumber={whatsappNumber}
        />
    );
}

