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
        const { siteId, planId, couponCode, paymentMethod = "manual" } = body;

        if (!siteId || !planId) {
            return new NextResponse("Missing data", { status: 400 });
        }

        console.log(`[UPGRADE] Attempting upgrade for siteId: '${siteId}', planId: '${planId}' by userId: '${session.user.id}' (role: '${session.user.role}')`);

        const isAdmin = (session.user as any).role === "admin";

        // Verify that the logged-in user belongs to the site (or is admin)
        const site = await db.site.findUnique({
            where: { id: siteId }
        });

        if (!site) {
            console.warn(`[UPGRADE] Site not found! Site '${siteId}'`);
            return new NextResponse("Forbidden", { status: 403 });
        }

        if (!isAdmin) {
            const { TenantClient } = await import("@/modules/tenant");
            const hasAccess = await TenantClient.verifyUserSiteAccess(session.user.id, siteId);
            if (!hasAccess) {
                console.warn(`[UPGRADE] Access verification failed! User '${session.user.id}' has no access to site '${siteId}'`);
                return new NextResponse("Forbidden", { status: 403 });
            }
        }

        if (!site) {
            console.warn(`[UPGRADE] Site verification failed! Site '${siteId}' not found or user '${session.user.id}' is not associated.`);
            return new NextResponse("Forbidden", { status: 403 });
        }
        console.log(`[UPGRADE] Site verified successfully: '${site.name}'`);

        const plan = await db.plan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            return new NextResponse("Plan not found", { status: 404 });
        }

        // Calculate Total Amount: Base Plan Price + Recurring Addons
        let totalAmount = Number(plan.price);

        // Find active subscription to check for existing recurring addons
        const existingSub = await db.subscription.findFirst({
            where: { siteId, status: "active" },
            include: { plan: true }
        });

        // If user is currently in a trial period, do not charge them for the carried over addon slots
        // in this initial activation transaction since they paid for them separately during the trial.
        const now = new Date();
        const isCurrentlyInTrial = existingSub && existingSub.trialEndsAt && existingSub.trialEndsAt > now;

        if (existingSub && existingSub.addonSlots > 0 && (existingSub.plan as any)?.addonSiteBilling === "recurring" && !isCurrentlyInTrial) {
            const planFeatures = existingSub.plan.features as any;
            const addonPrice = planFeatures?.addonSitePrice || 0;
            totalAmount += (existingSub.addonSlots * addonPrice);
        }

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

        // Validate and apply coupon if couponCode is provided
        let appliedCoupon = null;
        if (couponCode) {
            const formattedCode = couponCode.trim().toUpperCase();
            const coupon = await db.coupon.findUnique({
                where: { code: formattedCode }
            });

            if (coupon && coupon.isActive) {
                const now = new Date();
                const notExpired = !coupon.expiryDate || new Date(coupon.expiryDate) >= now;
                const notExceeded = coupon.maxUses === null || coupon.usedCount < coupon.maxUses;

                if (notExpired && notExceeded) {
                    appliedCoupon = coupon;
                }
            }
        }

        if (appliedCoupon) {
            let discountAmount = 0;
            if (appliedCoupon.discountType === "percentage") {
                discountAmount = totalAmount * (Number(appliedCoupon.discountValue) / 100);
            } else {
                discountAmount = Number(appliedCoupon.discountValue);
            }
            totalAmount = Math.max(0, totalAmount - discountAmount);

            // Automatically associate the user with the affiliate if user has no referrer yet
            const { IdentityClient } = await import("@/modules/auth");
            const siteOwner = await IdentityClient.getSiteOwner(siteId);
            if (appliedCoupon.affiliateId && siteOwner && !siteOwner.referredById && siteOwner.id !== appliedCoupon.affiliateId) {
                await db.user.update({
                    where: { id: siteOwner.id },
                    data: { referredById: appliedCoupon.affiliateId }
                });
            }
        }

        // Create a pending transaction
        let transaction = await db.paymentTransaction.create({
            data: {
                siteId,
                planId,
                amount: totalAmount,
                status: "pending",
                couponId: appliedCoupon ? appliedCoupon.id : null,
                paymentMethod: paymentMethod,
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
                    productDetails: `Peningkatan Paket: Premium ${plan.name.toUpperCase()} • Situs: ${site.name}`,
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
                    console.warn(`[DUITKU] Invoice creation failed: ${invoice.error}`);
                }
                }
            }
        } catch (duitkuError) {
            console.error("[DUITKU_UPGRADE_ERROR]", duitkuError);
        }

        return NextResponse.json(transaction);
    } catch (error) {
        console.error("[BILLING_UPGRADE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
