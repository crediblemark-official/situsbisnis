import { SubscriptionClient } from "@/modules/subscription";
import { FinancialClient } from "@/modules/financial";
import * as transactionRepo from "../repositories/transaction.repository";
import { eventBus } from "@/modules/shared/core/event-bus";
import { db } from "@/modules/shared/core/db";

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

    const site = await SubscriptionClient.findSiteById(siteId);
    if (!site) {
        throw new Error("Not Found");
    }

    const hasAccess = await eventBus.request<any, any>("request.tenant.verifyUserSiteAccess", { userId, siteId });
    if (!hasAccess) {
        throw new Error("Forbidden");
    }

    const subscription = await SubscriptionClient.getActiveSubscription(siteId);

    if (!subscription || !subscription.plan) {
        throw new Error("Active subscription not found");
    }

    const planFeatures = subscription.plan.features as any;
    const addonPrice = planFeatures?.addonSitePrice || 0;

    if (addonPrice <= 0) {
        throw new Error("Add-on slots not available for this plan");
    }

    const totalAmount = addonPrice * quantity;

    let transaction = await db.$transaction(async (tx) => {
        const pendingWithProof = await transactionRepo.findPendingTransactionWithProofTx(tx, siteId);
        if (pendingWithProof) {
            throw new Error("Anda memiliki transaksi tertunda yang sedang diverifikasi admin. Harap tunggu persetujuan.");
        }

        await transactionRepo.deletePendingTransactionsWithoutProofTx(tx, siteId);

        return transactionRepo.createPendingTransactionTx(tx, {
            siteId,
            planId: subscription.planId,
            amount: totalAmount,
            addonType: "site_slot",
            addonQuantity: quantity,
            paymentMethod
        });
    });

    try {
        if (paymentMethod === "duitku") {
            const platformSettings = await SubscriptionClient.getPlatformSettings();

            if (platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey) {
                const { paymentManager } = await import("@crediblemark/buayar");
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://situsbisnis.com";
                const ownerInfo = await eventBus.request<any, any>("request.auth.getSiteOwner", { siteId });

                const invoice = await paymentManager.createInvoice("duitku", {
                    orderId: transaction.id,
                    amount: totalAmount,
                    productDetails: `Pembelian Slot: +${quantity} Tambahan Situs • Utama: ${site.name}`,
                    customer: {
                        name: ownerInfo?.name || "Customer",
                        email: ownerInfo?.email || ""
                    },
                    returnUrl: `${appUrl}/dashboard/billing`,
                    callbackUrl: `${appUrl}/api/billing/webhook/duitku`
                }, {
                    merchantCode: platformSettings.duitkuMerchantCode,
                    apiKey: platformSettings.duitkuApiKey,
                    sandbox: platformSettings.duitkuSandbox
                });

                if (!invoice.success || !invoice.paymentUrl) {
                    throw new Error(invoice.error || "Gagal membuat invoice Duitku");
                }

                transaction = await transactionRepo.updateTransactionPaymentDetails(transaction.id, {
                    paymentUrl: invoice.paymentUrl,
                    paymentReference: invoice.reference,
                    paymentMethod: "duitku"
                });
            }
        }
    } catch (duitkuError) {
        console.error("[DUITKU_BUY_SLOT_ERROR]", duitkuError);
        throw duitkuError;
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

    const transaction = await transactionRepo.findTransactionById(null, transactionId);
    if (!transaction) {
        throw new Error("Transaction not found");
    }

    const isAdmin = userRole === "admin";
    const site = await eventBus.request<any, any>("request.tenant.getSiteInfo", { siteId: transaction.siteId });
    const ownerInfo = await eventBus.request<any, any>("request.auth.getSiteOwner", { siteId: transaction.siteId });
    const isOwner = ownerInfo?.id === userId;

    if (!isAdmin && !isOwner) {
        throw new Error("Forbidden");
    }

    const platformSettings = await SubscriptionClient.getPlatformSettings();
    if (!platformSettings?.duitkuMerchantCode || !platformSettings?.duitkuApiKey) {
        throw new Error("Platform payment settings not configured");
    }

    const { paymentManager, getPaymentMethodCategory } = await import("@crediblemark/buayar");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://situsbisnis.com";

    const suffix = Date.now().toString().slice(-4);
    const uniqueDuitkuId = `${transaction.id}-${paymentMethod}-${suffix}`;

    const customerEmail = ownerInfo?.email || "";
    const invoice = await paymentManager.createInvoice("duitku", {
        orderId: uniqueDuitkuId,
        amount: Number(transaction.amount),
        productDetails: transaction.plan ? `Upgrade Paket ${transaction.plan.name}` : "Upgrade Layanan SitusBisnis",
        customer: {
            name: ownerInfo?.name || site?.name || "Tenant",
            email: customerEmail,
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

    const updatedTransaction = await transactionRepo.updateTransactionPaymentDetails(transaction.id, {
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
    const site = await SubscriptionClient.findSiteById(siteId);

    if (!site) {
        throw new Error("Forbidden");
    }

    if (!isAdmin) {
        const hasAccess = await eventBus.request<any, any>("request.tenant.verifyUserSiteAccess", { userId, siteId });
        if (!hasAccess) {
            throw new Error("Forbidden");
        }
    }

    const plan = await SubscriptionClient.findPlanById(planId);
    if (!plan) {
        throw new Error("Plan not found");
    }

    let totalAmount = Number(plan.price);

    const existingSub = await SubscriptionClient.findLatestSubscription(siteId);

    const now = new Date();
    const isCurrentlyInTrial = existingSub && existingSub.trialEndsAt && existingSub.trialEndsAt > now;

    if (existingSub && existingSub.addonSlots > 0 && (existingSub as any).plan?.addonSiteBilling === "recurring" && !isCurrentlyInTrial) {
        const planFeatures = (existingSub as any).plan.features as any;
        const addonPrice = planFeatures?.addonSitePrice || 0;
        totalAmount += (existingSub.addonSlots * addonPrice);
    }

    let appliedCoupon = null;
    if (couponCode) {
        const formattedCode = couponCode.trim().toUpperCase();
        const coupon = await FinancialClient.findCouponByCode(formattedCode);

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

        const siteOwner = await eventBus.request<any, any>("request.auth.getSiteOwner", { siteId });
        if (appliedCoupon.affiliateId && siteOwner && !siteOwner.referredById && siteOwner.id !== appliedCoupon.affiliateId) {
            await eventBus.request<any, any>("request.auth.updateUserReferrer", { userId: siteOwner.id, referredById: appliedCoupon.affiliateId });
        }
    }

    let transaction = await db.$transaction(async (tx) => {
        const pendingWithProof = await transactionRepo.findPendingTransactionWithProofTx(tx, siteId);
        if (pendingWithProof) {
            throw new Error("Anda memiliki transaksi tertunda yang sedang diverifikasi admin. Harap tunggu persetujuan.");
        }

        await transactionRepo.deletePendingTransactionsWithoutProofTx(tx, siteId);

        return transactionRepo.createUpgradeTransactionTx(tx, {
            siteId,
            planId,
            amount: totalAmount,
            couponId: appliedCoupon ? appliedCoupon.id : null,
            paymentMethod: paymentMethod
        });
    });

    try {
        if (paymentMethod === "duitku") {
            const platformSettings = await SubscriptionClient.getPlatformSettings();

            if (platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey) {
                const { paymentManager } = await import("@crediblemark/buayar");
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://situsbisnis.com";

                const ownerInfo = await eventBus.request<any, any>("request.auth.getSiteOwner", { siteId });
                const invoice = await paymentManager.createInvoice("duitku", {
                    orderId: transaction.id,
                    amount: totalAmount,
                    productDetails: `Peningkatan Paket: Premium ${plan.name.toUpperCase()} • Situs: ${site.name}`,
                    customer: {
                        name: ownerInfo?.name || site.name || "Customer",
                        email: ownerInfo?.email || ""
                    },
                    returnUrl: `${appUrl}/dashboard/billing`,
                    callbackUrl: `${appUrl}/api/billing/webhook/duitku`
                }, {
                    merchantCode: platformSettings.duitkuMerchantCode,
                    apiKey: platformSettings.duitkuApiKey,
                    sandbox: platformSettings.duitkuSandbox
                });

                if (!invoice.success || !invoice.paymentUrl) {
                    throw new Error(invoice.error || "Gagal membuat invoice Duitku");
                }

                transaction = await transactionRepo.updateTransactionPaymentDetails(transaction.id, {
                    paymentUrl: invoice.paymentUrl,
                    paymentReference: invoice.reference,
                    paymentMethod: "duitku"
                });
            }
        }
    } catch (duitkuError) {
        console.error("[DUITKU_UPGRADE_ERROR]", duitkuError);
        throw duitkuError;
    }

    return transaction;
}
