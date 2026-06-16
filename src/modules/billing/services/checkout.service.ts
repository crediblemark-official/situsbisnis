import { db } from "@/modules/shared/core/db";
import * as billingRepo from "../repositories/billing.repository";
import { TenantClient } from "@/lib/modules/tenant/client";
import { IdentityClient } from "@/lib/modules/identity/client";
import { sendWhatsAppNotification } from "@/lib/services/whatsapp";

/**
 * Memproses transaksi yang disetujui (aktivasi paket/addon slots).
 */
export async function processApprovedTransaction(transactionId: string) {
    const updatedTx = await db.$transaction(async (tx) => {
        const currentTx = await billingRepo.findTransactionById(tx, transactionId);
        if (!currentTx) {
            throw new Error("TRANSACTION_NOT_FOUND");
        }
        if (currentTx.status !== "pending") {
            throw new Error("ALREADY_PROCESSED");
        }

        const updated = await billingRepo.updateTransactionStatus(tx, transactionId, "approved");

        if (updated.couponId) {
            await billingRepo.incrementCouponUses(tx, updated.couponId);
        }

        const siteOwner = await IdentityClient.getSiteOwner(updated.siteId);
        const siteInfo = await TenantClient.getSiteInfo(updated.siteId);

        if (siteOwner && siteOwner.referredById) {
            const platformSettings = await billingRepo.findPlatformSettings(tx);
            const isRecurringEnabled = platformSettings?.affiliateRecurringCommission ?? false;
            const approvedTxCount = await billingRepo.countApprovedTransactions(tx, updated.siteId);

            let shouldAwardCommission = true;
            if (!isRecurringEnabled) {
                if (approvedTxCount > 1) {
                    shouldAwardCommission = false;
                }
            }

            if (shouldAwardCommission) {
                let ratePercentage = 20;
                if (approvedTxCount > 1) {
                    ratePercentage = platformSettings?.affiliateRecurringCommissionRate ? Number(platformSettings.affiliateRecurringCommissionRate) : 10;
                } else {
                    ratePercentage = platformSettings?.affiliateCommissionRate ? Number(platformSettings.affiliateCommissionRate) : 20;
                }
                
                const commissionAmount = Number(updated.amount) * (ratePercentage / 100);
                
                await IdentityClient.awardAffiliateCommission(tx, {
                    userId: siteOwner.referredById,
                    amount: commissionAmount,
                    transactionId: updated.id,
                    description: `Komisi pembayaran dari situs ${siteInfo?.name || "website"}`
                });
            }
        }

        if (updated.addonType === "site_slot") {
            const existingSub = await billingRepo.findLatestSubscription(tx, updated.siteId);
            if (existingSub) {
                await billingRepo.updateSubscriptionAddonSlots(tx, existingSub.id, updated.addonQuantity || 0);
            }
        } else {
            const activeSubBeforeUpgrade = await billingRepo.findLatestSubscription(tx, updated.siteId);
            const carryOverSlots = activeSubBeforeUpgrade?.addonSlots || 0;

            await billingRepo.cancelAllSubscriptions(tx, updated.siteId);

            const now = new Date();
            const endDate = new Date(now);
            if (updated.plan.interval === "year") {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }

            const existingSubOfThisPlan = await billingRepo.findSubscriptionBySiteAndPlan(tx, updated.siteId, updated.planId);
            if (existingSubOfThisPlan) {
                await billingRepo.activateExistingSubscription(tx, existingSubOfThisPlan.id, {
                    endDate,
                    addonSlots: Math.max(existingSubOfThisPlan.addonSlots, carryOverSlots)
                });
            } else {
                await billingRepo.createSubscription(tx, {
                    siteId: updated.siteId,
                    planId: updated.planId,
                    status: "active",
                    startDate: now,
                    endDate,
                    addonSlots: carryOverSlots
                });
            }
        }

        return updated;
    }, {
        maxWait: 15000,
        timeout: 45000,
    });

    if (updatedTx && updatedTx.status === "approved") {
        try {
            const { revalidateTag } = await import("next/cache");
            revalidateTag(`site-${updatedTx.siteId}`, "default");
        } catch (e) {
            console.error("Failed to revalidate subscription cache:", e);
        }

        (async () => {
            try {
                const siteContact = await TenantClient.getSiteContact(updatedTx.siteId);
                const siteInfo = await TenantClient.getSiteInfo(updatedTx.siteId);
                const activeSub = await billingRepo.findActiveSubscription(updatedTx.siteId);

                const formattedEndDate = activeSub?.endDate
                    ? new Date(activeSub.endDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })
                    : "";

                const formattedAmount = new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0
                }).format(Number(updatedTx.amount));

                const planName = updatedTx.plan.name.toUpperCase();
                const siteName = siteInfo?.name || "Website Anda";

                const recipientPhone = siteContact?.whatsappNumber || siteContact?.contactPhone;
                if (recipientPhone) {
                    let message = `*SitusBisnis - Pembayaran Berhasil* 🎉\n\n`;
                    message += `Halo Pengelola *${siteName}*,\n\n`;
                    message += `Pembayaran Anda untuk paket *${planName}* sebesar *${formattedAmount}* telah berhasil diverifikasi dan disetujui.\n\n`;
                    if (formattedEndDate) {
                        message += `Layanan paket aktif/diperpanjang hingga: *${formattedEndDate}*.\n\n`;
                    }
                    message += `Terima kasih atas kepercayaan Anda menggunakan layanan kami!\n\n`;
                    message += `_Pesan ini dikirim otomatis oleh sistem SitusBisnis._`;

                    await sendWhatsAppNotification(recipientPhone, message);
                }

                const siteOwner = await IdentityClient.getSiteOwner(updatedTx.siteId);
                if (siteOwner && siteOwner.email) {
                    const { sendPaymentSuccessEmail } = await import("@/lib/services/email");
                    await sendPaymentSuccessEmail({
                        toEmail: siteOwner.email,
                        userName: siteOwner.name || "Pengguna",
                        siteName,
                        planName,
                        amount: formattedAmount,
                        endDate: formattedEndDate
                    });
                }
            } catch (error) {
                console.error("[NOTIFICATION_TRIGGER_ERROR]", error);
            }
        })();
    }

    return updatedTx;
}

/**
 * Memperbarui status transaksi.
 */
export async function updateTransactionStatus(transactionId: string, status: string) {
    return db.$transaction(async (tx) => {
        const currentTx = await billingRepo.findTransactionById(tx, transactionId);
        if (!currentTx) {
            throw new Error("TRANSACTION_NOT_FOUND");
        }
        if (currentTx.status !== "pending") {
            throw new Error("ALREADY_PROCESSED");
        }
        return billingRepo.updateTransactionStatus(tx, transactionId, status as any);
    });
}

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
 * Membatalkan transaksi pending secara permanen.
 */
export async function cancelTransaction(userId: string, transactionId: string) {
    if (!transactionId) {
        throw new Error("Missing transactionId");
    }

    const tx = await billingRepo.findTransactionById(null, transactionId);
    if (!tx) {
        throw new Error("Transaction not found");
    }

    const ownerInfo = await IdentityClient.getSiteOwner(tx.siteId);
    const isOwner = ownerInfo?.id === userId;

    if (!isOwner) {
        throw new Error("Forbidden");
    }

    if (tx.status !== "pending") {
        throw new Error("Hanya transaksi tertunda yang dapat dibatalkan.");
    }

    await billingRepo.deleteTransaction(transactionId);
    return { success: true };
}

/**
 * Mengecek status transaksi pembayaran.
 */
export async function checkTransactionStatus(userId: string, userRole: string, transactionId: string) {
    if (!transactionId) {
        throw new Error("transactionId is required");
    }

    const transaction = await billingRepo.findTransactionById(null, transactionId);
    if (!transaction) {
        throw new Error("Transaction not found");
    }

    const isAdmin = userRole === "admin";
    let isOwner = false;

    if (!isAdmin) {
        const ownerInfo = await IdentityClient.getSiteOwner(transaction.siteId);
        isOwner = ownerInfo?.id === userId;
    }

    if (!isAdmin && !isOwner) {
        throw new Error("Forbidden");
    }

    if (transaction.status === "approved" || transaction.status === "rejected") {
        return {
            transactionId: transaction.id,
            status: transaction.status,
            amount: Number(transaction.amount),
            planName: (transaction.plan as any)?.name || "",
        };
    }

    if (!transaction.paymentReference) {
        return {
            transactionId: transaction.id,
            status: transaction.status,
            amount: Number(transaction.amount),
            planName: (transaction.plan as any)?.name || "",
        };
    }

    const platformSettings = await billingRepo.findPlatformSettings(null);
    if (!platformSettings?.duitkuMerchantCode || !platformSettings?.duitkuApiKey) {
        return {
            transactionId: transaction.id,
            status: transaction.status,
            amount: Number(transaction.amount),
            planName: (transaction.plan as any)?.name || "",
        };
    }

    let merchantOrderIdForDuitku = transaction.id;
    if (transaction.paymentUrl && transaction.paymentUrl.startsWith("custom:")) {
        try {
            const customData = JSON.parse(transaction.paymentUrl.substring(7));
            if (customData.merchantOrderId) {
                merchantOrderIdForDuitku = customData.merchantOrderId;
            }
        } catch {}
    }

    const { paymentManager } = await import("@crediblemark/buayar");
    const result = await paymentManager.checkTransaction("duitku", {
        merchantOrderId: merchantOrderIdForDuitku,
    }, {
        merchantCode: platformSettings.duitkuMerchantCode,
        apiKey: platformSettings.duitkuApiKey,
        sandbox: platformSettings.duitkuSandbox,
    });

    if (result.success && result.status === "paid" && transaction.status === "pending") {
        try {
            await processApprovedTransaction(transaction.id);
            console.log(`[CHECK_STATUS] Transaction '${transaction.id}' auto-approved via status polling.`);
        } catch (err: any) {
            if (err.message !== "ALREADY_PROCESSED") {
                console.error(`[CHECK_STATUS] Error processing:`, err);
            }
        }
    }

    return {
        transactionId: transaction.id,
        status: result.success ? result.status : transaction.status,
        statusCode: result.statusCode || "",
        amount: Number(transaction.amount),
        planName: (transaction.plan as any)?.name || "",
    };
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
 * Mengonfirmasi pembayaran manual dengan bukti transfer.
 */
export async function confirmManualPayment(
    userId: string,
    userRole: string,
    transactionId: string,
    notes?: string,
    proofOfPayment?: string
) {
    if (!transactionId) {
        throw new Error("Missing transaction ID");
    }

    const existingTransaction = await billingRepo.findTransactionById(null, transactionId);
    if (!existingTransaction) {
        throw new Error("Transaction not found");
    }

    const ownerInfo = await IdentityClient.getSiteOwner(existingTransaction.siteId);
    const isUserMember = ownerInfo?.id === userId;

    if (!isUserMember && userRole !== "admin") {
        throw new Error("Forbidden");
    }

    const transaction = await billingRepo.updateTransactionConfirmDetails(transactionId, {
        notes,
        proofOfPayment
    });

    return transaction;
}

/**
 * Mengambil daftar metode pembayaran yang tersedia dari gateway.
 */
export async function getPaymentMethods(amount: number) {
    if (!amount || isNaN(Number(amount))) {
        throw new Error("Amount is required");
    }

    const platformSettings = await billingRepo.findPlatformSettings(null);
    if (!platformSettings?.duitkuMerchantCode || !platformSettings?.duitkuApiKey) {
        throw new Error("Payment gateway not configured");
    }

    const { paymentManager } = await import("@crediblemark/buayar");

    const result = await paymentManager.getPaymentMethods("duitku", {
        amount: Math.round(Number(amount)),
    }, {
        merchantCode: platformSettings.duitkuMerchantCode,
        apiKey: platformSettings.duitkuApiKey,
        sandbox: platformSettings.duitkuSandbox,
    });

    if (!result.success) {
        throw new Error(result.error || "Failed to fetch payment methods");
    }

    return { methods: result.methods };
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

/**
 * Memproses callback webhook dari Duitku.
 */
export async function processDuitkuWebhook(body: Record<string, any>) {
    const { merchantCode, amount, merchantOrderId, signature } = body;

    if (!merchantCode || !amount || !merchantOrderId || !signature) {
        throw new Error("Missing parameters");
    }

    const actualTransactionId = merchantOrderId.includes("-") ? merchantOrderId.split("-")[0] : merchantOrderId;

    const platformSettings = await billingRepo.findPlatformSettings(null);
    if (!platformSettings || !platformSettings.duitkuApiKey) {
        throw new Error("Platform not configured");
    }

    const { paymentManager } = await import("@crediblemark/buayar");
    const verification = await paymentManager.verifyCallback("duitku", body, {
        merchantCode: platformSettings.duitkuMerchantCode || "",
        apiKey: platformSettings.duitkuApiKey,
        sandbox: platformSettings.duitkuSandbox
    });

    if (!verification.isValid) {
        throw new Error("Invalid Signature");
    }

    if (verification.status === "paid") {
        await processApprovedTransaction(actualTransactionId);
    }

    return { success: true };
}

/**
 * Mengirim notifikasi follow-up melalui WhatsApp (admin).
 */
export async function followupWhatsApp(phone: string, message: string) {
    if (!phone || !message) {
        throw new Error("Phone and message are required");
    }
    const result = await sendWhatsAppNotification(phone, message);
    if (!result.success) {
        throw new Error(result.error || "Failed to send WhatsApp follow-up");
    }
    return { success: true, message: "WhatsApp follow-up sent successfully", result: result.result };
}

/**
 * Mengirim notifikasi follow-up melalui Email (admin).
 */
export async function followupEmail(email: string, message: string, siteId: string) {
    if (!email || !message) {
        throw new Error("Email and message are required");
    }
    const siteOwner = siteId ? await IdentityClient.getSiteOwner(siteId) : null;
    const userName = siteOwner?.name || "Pengguna";

    const { sendFollowupEmail } = await import("@/lib/services/email");
    const result = await sendFollowupEmail({
        toEmail: email,
        userName,
        subject: `Pesan Penting Terkait Layanan Website Anda di SitusBisnis`,
        message
    });

    if (!result.success) {
        throw new Error(result.error || "Failed to send email follow-up");
    }

    return { success: true, message: "Email follow-up sent successfully", result: result.id };
}
