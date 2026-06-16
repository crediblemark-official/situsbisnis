import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { siteId, quantity, paymentMethod = "manual" } = body;

        if (!siteId || !quantity || quantity < 1) {
            return new NextResponse("Missing data", { status: 400 });
        }

        // Verify that the logged-in user belongs to the site
        const site = await db.site.findUnique({
            where: { id: siteId }
        });

        if (!site) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const { TenantClient } = await import("@/modules/tenant");
        const hasAccess = await TenantClient.verifyUserSiteAccess(session.user.id, siteId);
        if (!hasAccess) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Get current subscription to find plan
        const subscription = await db.subscription.findFirst({
            where: { siteId, status: "active" },
            include: { plan: true }
        });

        if (!subscription || !subscription.plan) {
            return new NextResponse("Active subscription not found", { status: 404 });
        }

        const planFeatures = subscription.plan.features as any;
        const addonPrice = planFeatures?.addonSitePrice || 0;

        if (addonPrice <= 0) {
            return new NextResponse("Add-on slots not available for this plan", { status: 400 });
        }

        const totalAmount = addonPrice * quantity;

        // 1. Check if there is any pending transaction that already has proof of payment (awaiting admin review)
        const pendingWithProof = await db.paymentTransaction.findFirst({
            where: {
                siteId,
                status: "pending",
                NOT: {
                    OR: [
                        { proofOfPayment: null },
                        { proofOfPayment: "" }
                    ]
                }
            }
        });

        if (pendingWithProof) {
            return NextResponse.json(
                { error: "Anda memiliki transaksi tertunda yang sedang diverifikasi admin. Harap tunggu persetujuan." },
                { status: 400 }
            );
        }

        // 2. Delete all other pending transactions for this site that DO NOT have proof of payment (orphaned checkouts)
        await db.paymentTransaction.deleteMany({
            where: {
                siteId,
                status: "pending",
                OR: [
                    { proofOfPayment: null },
                    { proofOfPayment: "" }
                ]
            }
        });

        // Create a pending transaction for the addon
        let transaction = await db.paymentTransaction.create({
            data: {
                siteId,
                planId: subscription.planId,
                amount: totalAmount,
                addonType: "site_slot",
                addonQuantity: quantity,
                status: "pending",
                paymentMethod: paymentMethod
            }
        });

        // Try to generate Duitku Invoice if platform keys are configured and paymentMethod is duitku
        try {
            if (paymentMethod === "duitku") {
                const platformSettings = await db.platformSettings.findUnique({
                    where: { id: "global" }
                });

                if (platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey) {
                    const { paymentManager } = await import("@crediblemark/buayar");
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://situsbisnis.com";
                
                const invoice = await paymentManager.createInvoice("duitku", {
                    orderId: transaction.id,
                    amount: totalAmount,
                    productDetails: `Pembelian Slot: +${quantity} Tambahan Situs • Utama: ${site.name}`,
                    customer: {
                        name: session.user.name || "Customer",
                        email: session.user.email || ""
                    },
                    returnUrl: `${appUrl}/dashboard/billing`,
                    callbackUrl: `${appUrl}/api/billing/webhook/duitku`
                }, {
                    merchantCode: platformSettings.duitkuMerchantCode,
                    apiKey: platformSettings.duitkuApiKey,
                    sandbox: platformSettings.duitkuSandbox
                });

                if (invoice.success && invoice.paymentUrl) {
                    transaction = await db.paymentTransaction.update({
                        where: { id: transaction.id },
                        data: {
                            paymentMethod: "duitku",
                            paymentUrl: invoice.paymentUrl,
                            paymentReference: invoice.reference
                        }
                    });
                } else {
                    console.warn(`[DUITKU] Addon invoice creation failed: ${invoice.error}`);
                }
                }
            }
        } catch (duitkuError) {
            console.error("[DUITKU_BUY_SLOT_ERROR]", duitkuError);
        }

        return NextResponse.json(transaction);
    } catch (error) {
        console.error("[BILLING_BUY_SLOT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
