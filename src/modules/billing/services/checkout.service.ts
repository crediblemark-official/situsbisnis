import * as billingRepo from "../repositories/billing.repository";
import { TenantClient } from "@/lib/modules/tenant/client";
import { IdentityClient } from "@/lib/modules/identity/client";

/**
 * Membeli slot situs tambahan untuk tenant.
 */
export async function buySlot(
    userId: string,
    siteId: string,
    quantity: number,
    paymentMethod = "manual"
) {
    if (!siteId || !quantity || quantity < 1) {
        throw new Error("Missing data");
    }

    const site = await billingRepo.findSiteById(siteId);
    if (!site) {
        throw new Error("Not Found");
    }

    const hasAccess = await TenantClient.verifyUserSiteAccess(userId, siteId);
    if (!hasAccess) {
        throw new Error("Forbidden");
    }

    const subscription = await billingRepo.findActiveSubscription(siteId);

    if (!subscription || !subscription.plan) {
        throw new Error("Active subscription not found");
    }

    const planFeatures = subscription.plan.features as any;
    const addonPrice = planFeatures?.addonSitePrice || 0;

    if (addonPrice <= 0) {
        throw new Error("Add-on slots not available for this plan");
    }

    const totalAmount = addonPrice * quantity;

    const pendingWithProof = await billingRepo.findPendingTransactionWithProof(siteId);
    if (pendingWithProof) {
        throw new Error("Anda memiliki transaksi tertunda yang sedang diverifikasi admin. Harap tunggu persetujuan.");
    }

    await billingRepo.deletePendingTransactionsWithoutProof(siteId);

    let transaction = await billingRepo.createPendingTransaction({
        siteId,
        planId: subscription.planId,
        amount: totalAmount,
        addonType: "site_slot",
        addonQuantity: quantity,
        paymentMethod
    });

    try {
        if (paymentMethod === "duitku") {
            const platformSettings = await billingRepo.findPlatformSettings(null);

            if (platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey) {
                const { paymentManager } = await import("@crediblemark/buayar");
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://situsbisnis.com";

                const invoice = await paymentManager.createInvoice("duitku", {
                    orderId: transaction.id,
                    amount: totalAmount,
                    productDetails: `Pembelian Slot: +${quantity} Tambahan Situs • Utama: ${site.name}`,
                    customer: {
                        name: "Customer",
                        email: ""
                    },
                    returnUrl: `${appUrl}/dashboard/billing`,
                    callbackUrl: `${appUrl}/api/billing/webhook/duitku`
                }, {
                    merchantCode: platformSettings.duitkuMerchantCode,
                    apiKey: platformSettings.duitkuApiKey,
                    sandbox: platformSettings.duitkuSandbox
                });

                if (invoice.success && invoice.paymentUrl) {
                    transaction = await billingRepo.updateTransactionPaymentDetails(transaction.id, {
                        paymentUrl: invoice.paymentUrl,
                        paymentReference: invoice.reference,
                        paymentMethod: "duitku"
                    });
                } else {
                    console.warn(`[DUITKU] Addon invoice creation failed: ${invoice.error}`);
                }
            }
        }
    } catch (duitkuError) {
        console.error("[DUITKU_BUY_SLOT_ERROR]", duitkuError);
    }

    return transaction;
}

/**
 * Menginisialisasi checkout pembayaran via Duitku.
 */
export async function initializeCheckoutPayment(
    userId: string,
    userRole: string,
    transactionId: string,
    paymentMethod: string
) {
    if (!transactionId || !paymentMethod) {
        throw new Error("transactionId and paymentMethod are required");
    }

    const transaction = await billingRepo.findTransactionById(null, transactionId);
    if (!transaction) {
        throw new Error("Transaction not found");
    }

    const isAdmin = userRole === "admin";
    const site = await TenantClient.getSiteInfo(transaction.siteId);
    const ownerInfo = await IdentityClient.getSiteOwner(transaction.siteId);
    const isOwner = ownerInfo?.id === userId;

    if (!isAdmin && !isOwner) {
        throw new Error("Forbidden");
    }

    const platformSettings = await billingRepo.findPlatformSettings(null);
    if (!platformSettings?.duitkuMerchantCode || !platformSettings?.duitkuApiKey) {
        throw new Error("Platform payment settings not configured");
    }

    const { paymentManager, getPaymentMethodCategory } = await import("@crediblemark/buayar");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://situsbisnis.com";

    const suffix = Date.now().toString().slice(-4);
    const uniqueDuitkuId = `${transaction.id}-${paymentMethod}-${suffix}`;

    const invoice = await paymentManager.createInvoice("duitku", {
        orderId: uniqueDuitkuId,
        amount: Number(transaction.amount),
        productDetails: transaction.plan ? `Upgrade Paket ${transaction.plan.name}` : "Upgrade Layanan SitusBisnis",
        customer: {
            name: site?.name || "Tenant",
            email: "tenant@situsbisnis.com",
        },
        paymentMethod,
        returnUrl: `${appUrl}/dashboard/billing?status=success`,
        callbackUrl: `${appUrl}/api/billing/webhook/duitku`
    }, {
        merchantCode: platformSettings.duitkuMerchantCode,
        apiKey: platformSettings.duitkuApiKey,
        sandbox: platformSettings.duitkuSandbox
    });

    if (!invoice.success) {
        throw new Error(invoice.error || "Failed to create Duitku invoice");
    }

    const customPayload = {
        vaNumber: invoice.vaNumber || null,
        qrString: invoice.qrString || null,
        qrCodeUrl: invoice.qrCodeUrl || null,
        paymentCode: invoice.paymentCode || null,
        paymentMethod,
        category: getPaymentMethodCategory(paymentMethod),
        reference: invoice.reference,
        merchantOrderId: uniqueDuitkuId
    };

    const updatedTransaction = await billingRepo.updateTransactionPaymentDetails(transaction.id, {
        paymentUrl: `custom:${JSON.stringify(customPayload)}`,
        paymentReference: invoice.reference,
        paymentMethod: "duitku"
    });

    return {
        success: true,
        transaction: {
            id: updatedTransaction.id,
            paymentUrl: updatedTransaction.paymentUrl,
            paymentReference: updatedTransaction.paymentReference
        },
        paymentDetails: customPayload
    };
}

/**
 * Melakukan upgrade paket langganan premium untuk site.
 */
export async function upgradePlan(
    userId: string,
    userRole: string,
    siteId: string,
    planId: string,
    couponCode?: string,
    paymentMethod = "manual"
) {
    if (!siteId || !planId) {
        throw new Error("Missing data");
    }

    const isAdmin = userRole === "admin";
    const site = await billingRepo.findSiteById(siteId);

    if (!site) {
        throw new Error("Forbidden");
    }

    if (!isAdmin) {
        const hasAccess = await TenantClient.verifyUserSiteAccess(userId, siteId);
        if (!hasAccess) {
            throw new Error("Forbidden");
        }
    }

    const plan = await billingRepo.findPlanById(planId);
    if (!plan) {
        throw new Error("Plan not found");
    }

    let totalAmount = Number(plan.price);

    const existingSub = await billingRepo.findLatestSubscription(null, siteId);

    const now = new Date();
    const isCurrentlyInTrial = existingSub && existingSub.trialEndsAt && existingSub.trialEndsAt > now;

    if (existingSub && existingSub.addonSlots > 0 && (existingSub as any).plan?.addonSiteBilling === "recurring" && !isCurrentlyInTrial) {
        const planFeatures = (existingSub as any).plan.features as any;
        const addonPrice = planFeatures?.addonSitePrice || 0;
        totalAmount += (existingSub.addonSlots * addonPrice);
    }

    const pendingWithProof = await billingRepo.findPendingTransactionWithProof(siteId);
    if (pendingWithProof) {
        throw new Error("Anda memiliki transaksi tertunda yang sedang diverifikasi admin. Harap tunggu persetujuan.");
    }

    await billingRepo.deletePendingTransactionsWithoutProof(siteId);

    let appliedCoupon = null;
    if (couponCode) {
        const formattedCode = couponCode.trim().toUpperCase();
        const coupon = await billingRepo.findCouponByCode(formattedCode);

        if (coupon && coupon.isActive) {
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

        const siteOwner = await IdentityClient.getSiteOwner(siteId);
        if (appliedCoupon.affiliateId && siteOwner && !siteOwner.referredById && siteOwner.id !== appliedCoupon.affiliateId) {
            await IdentityClient.updateUserReferrer(siteOwner.id, appliedCoupon.affiliateId);
        }
    }

    let transaction = await billingRepo.createUpgradeTransaction({
        siteId,
        planId,
        amount: totalAmount,
        couponId: appliedCoupon ? appliedCoupon.id : null,
        paymentMethod: paymentMethod
    });

    try {
        if (paymentMethod === "duitku") {
            const platformSettings = await billingRepo.findPlatformSettings(null);

            if (platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey) {
                const { paymentManager } = await import("@crediblemark/buayar");
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://situsbisnis.com";

                const invoice = await paymentManager.createInvoice("duitku", {
                    orderId: transaction.id,
                    amount: totalAmount,
                    productDetails: `Peningkatan Paket: Premium ${plan.name.toUpperCase()} • Situs: ${site.name}`,
                    customer: {
                        name: "Customer",
                        email: ""
                    },
                    returnUrl: `${appUrl}/dashboard/billing`,
                    callbackUrl: `${appUrl}/api/billing/webhook/duitku`
                }, {
                    merchantCode: platformSettings.duitkuMerchantCode,
                    apiKey: platformSettings.duitkuApiKey,
                    sandbox: platformSettings.duitkuSandbox
                });

                if (invoice.success && invoice.paymentUrl) {
                    transaction = await billingRepo.updateTransactionPaymentDetails(transaction.id, {
                        paymentUrl: invoice.paymentUrl,
                        paymentReference: invoice.reference,
                        paymentMethod: "duitku"
                    });
                } else {
                    console.warn(`[DUITKU] Invoice creation failed: ${invoice.error}`);
                }
            }
        }
    } catch (duitkuError) {
        console.error("[DUITKU_UPGRADE_ERROR]", duitkuError);
    }

    return transaction;
}
