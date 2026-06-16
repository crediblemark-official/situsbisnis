import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import { CheckoutClient } from "@/components/dashboard/checkout/CheckoutClient";

interface CheckoutPageProps {
    params: Promise<{ transactionId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
    const { transactionId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/auth/login");
    }

    const transaction = await db.paymentTransaction.findUnique({
        where: { id: transactionId },
        include: {
            plan: { select: { id: true, name: true, description: true } }
        }
    });

    if (!transaction) {
        notFound();
    }

    // Security: only site members or admin
    const isAdmin = (session.user as any).role === "admin";
    
    const { TenantClient } = await import("@/modules/tenant");
    const { IdentityClient } = await import("@/modules/auth");
    
    const site = await TenantClient.getSiteInfo(transaction.siteId);
    const ownerInfo = await IdentityClient.getSiteOwner(transaction.siteId);
    const isOwner = ownerInfo?.id === session.user.id;

    if (!isAdmin && !isOwner) {
        notFound();
    }

    // If already paid/cancelled, redirect back to billing
    if (transaction.status === "approved") {
        redirect("/dashboard/billing?status=success");
    }
    if (transaction.status === "rejected" || transaction.status === "cancelled") {
        redirect("/dashboard/billing");
    }

    // Fetch platform settings for checkout display
    const platform = await db.platformSettings.findUnique({
        where: { id: "global" },
        select: {
            duitkuMerchantCode: true,
            duitkuApiKey: true,
            duitkuSandbox: true,
        }
    });

    // Fetch platform name from environment or use default
    const platformName = process.env.NEXT_PUBLIC_APP_NAME || process.env.NEXT_PUBLIC_ROOT_DOMAIN || "Platform";

    const serializedTransaction = {
        id: transaction.id,
        amount: Number(transaction.amount),
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        paymentUrl: transaction.paymentUrl || null,
        paymentReference: transaction.paymentReference || null,
        createdAt: transaction.createdAt.toISOString(),
        plan: transaction.plan ? {
            id: transaction.plan.id,
            name: transaction.plan.name,
            description: transaction.plan.description,
        } : null,
        site: site ? {
            id: site.id,
            name: site.name,
        } : null,
    };

    return (
        <CheckoutClient
            transaction={serializedTransaction}
            platformName={platformName}
            isDuitkuConfigured={!!(platform?.duitkuMerchantCode && platform?.duitkuApiKey)}
        />
    );
}
