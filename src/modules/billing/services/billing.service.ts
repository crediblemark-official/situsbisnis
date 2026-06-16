import { db } from "@/modules/shared/core/db";
import { unstable_cache } from "next/cache";
import * as billingRepo from "../repositories/billing.repository";
import { ContentClient } from "@/lib/modules/content/client";
import { CatalogClient } from "@/lib/modules/catalog/client";
import { OrderClient } from "@/lib/modules/order/client";
import { sendWhatsAppNotification } from "@/lib/services/whatsapp";
import { TenantClient } from "@/lib/modules/tenant/client";
import { IdentityClient } from "@/lib/modules/identity/client";
import { LimitType, LimitCheckResult, PricingPlanDTO } from "../index";

const LIMIT_CONFIG: Record<LimitType, {
    field: string;
    label: string;
    dependency?: string;
    countFn: (siteId: string) => Promise<number>;
}> = {
    maxPosts: {
        field: "maxPosts",
        label: "posts",
        dependency: "hasBlog",
        countFn: (siteId) => ContentClient.countPosts(siteId)
    },
    maxProducts: {
        field: "maxProducts",
        label: "products",
        dependency: "hasProducts",
        countFn: (siteId) => CatalogClient.countProducts(siteId)
    },
    maxOrders: {
        field: "maxOrders",
        label: "orders",
        dependency: "hasOrders",
        countFn: (siteId) => OrderClient.countOrders(siteId)
    },
    maxTestimonials: {
        field: "maxTestimonials",
        label: "testimonials",
        dependency: "hasTestimonials",
        countFn: (siteId) => ContentClient.countTestimonials(siteId)
    },
    maxAssets: {
        field: "maxAssets",
        label: "MB storage",
        dependency: "hasGallery", 
        countFn: async (siteId) => {
            const bytes = await ContentClient.getMediaSize(siteId);
            return bytes / (1024 * 1024);
        }
    }
};

/**
 * Mengambil paket harga untuk ditampilkan ke landing page dengan caching.
 */
export async function getPricingPlans(): Promise<PricingPlanDTO[]> {
    return unstable_cache(
        async () => {
            try {
                const dbPlans = await billingRepo.findPricingPlans();
                const mainDomain = process.env.NEXT_PUBLIC_APP_URL || "SitusBisnis.com";
                const cleanDomain = mainDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");

                const formatPrice = (price: any) => {
                    return new Intl.NumberFormat('id-ID').format(Number(price));
                };

                return dbPlans.map((plan: any) => {
                    const coreFeatures: string[] = [];
                    const limits: { label: string; value: string }[] = [];
                    const planFeatures = plan.features as any || {};

                    if (plan.maxSites === 1) limits.push({ label: "Jumlah Website", value: "1 Website" });
                    else if (plan.maxSites === -1) limits.push({ label: "Jumlah Website", value: "Sepuasnya" });
                    else limits.push({ label: "Jumlah Website", value: `${plan.maxSites} Website` });

                    if (planFeatures.hasCustomDomain) coreFeatures.push("Bisa Pakai Domain Sendiri (.com/.id)");
                    else coreFeatures.push(`Alamat Web Bawaan (.${cleanDomain})`);

                    const quotaMapping = [
                        { key: "maxProducts", label: "Maksimal Produk", featureKey: "hasProducts" },
                        { key: "maxPosts", label: "Maksimal Artikel/Blog", featureKey: "hasBlog" },
                        { key: "maxAssets", label: "Maksimal Upload Foto", featureKey: "hasGallery" },
                        { key: "maxOrders", label: "Maksimal Transaksi", featureKey: "hasOrders" },
                        { key: "maxTestimonials", label: "Maksimal Testimoni", featureKey: "hasTestimonials" },
                    ];

                    quotaMapping.forEach(q => {
                        if (planFeatures[q.featureKey]) {
                            const val = plan[q.key];
                            limits.push({
                                label: q.label,
                                value: val === -1 ? "Sepuasnya" : `${val} Item`
                            });
                        }
                    });

                    if (planFeatures.hasCart) coreFeatures.push("Fitur Toko Online (Keranjang)");
                    if (planFeatures.hasPortfolio) coreFeatures.push("Galeri & Portofolio Karya");
                    if (planFeatures.hasInbox) coreFeatures.push("Kotak Pesan Masuk (Inbox)");
                    if (planFeatures.hasTaxonomies) coreFeatures.push("Bebas Buat Kategori/Label");

                    let color = "blue";
                    if (plan.price > 0) color = "emerald";
                    if (plan.price > 100000) color = "indigo";

                    return {
                        id: plan.id,
                        name: plan.name,
                        description: plan.description,
                        price: Number(plan.price),
                        priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
                        originalPrice: plan.originalPrice ? Number(plan.originalPrice) : 0,
                        originalPriceYearly: plan.originalPriceYearly ? Number(plan.originalPriceYearly) : 0,
                        interval: plan.interval,
                        trialDays: plan.trialDays || 0,
                        color,
                        displayPrice: formatPrice(plan.price),
                        displayPriceYearly: plan.priceYearly ? formatPrice(plan.priceYearly) : null,
                        displayOriginalPrice: plan.originalPrice ? formatPrice(plan.originalPrice) : null,
                        displayOriginalPriceYearly: plan.originalPriceYearly ? formatPrice(plan.originalPriceYearly) : null,
                        coreFeatures,
                        limits,
                        addonPrice: planFeatures.addonSitePrice ? formatPrice(planFeatures.addonSitePrice) : null,
                        addonBilling: plan.addonSiteBilling === 'recurring' ? '/bulan' : ' (Sekali bayar)'
                    };
                });
            } catch (e) {
                console.error("[getPricingPlans] Failed to fetch landing page plans:", e);
                return [];
            }
        },
        ["pricing-plans-cache"],
        { revalidate: 3600, tags: ["pricing-plans"] }
    )();
}

/**
 * Mengambil nama paket aktif untuk daftar ID situs.
 */
export async function getActivePlanNamesForSites(siteIds: string[]): Promise<Record<string, string>> {
    if (siteIds.length === 0) return {};
    try {
        const subscriptions = await billingRepo.findActivePlanNamesForSites(siteIds);
        const resultMap: Record<string, string> = {};
        subscriptions.forEach(sub => {
            resultMap[sub.siteId] = sub.plan.name;
        });
        return resultMap;
    } catch (error) {
        console.error("[getActivePlanNamesForSites] Failed:", error);
        return {};
    }
}

/**
 * Memverifikasi apakah suatu situs melampaui limitasi paket langganannya.
 */
export async function checkSiteLimit(siteId: string, type: LimitType): Promise<LimitCheckResult> {
    const subscription = await billingRepo.findActiveSubscription(siteId);

    if (!subscription || !subscription.plan) {
        return {
            allowed: false,
            message: "No active subscription found. Please select a plan in the billing dashboard."
        };
    }

    const plan = subscription.plan;
    const config = LIMIT_CONFIG[type];

    if (config.dependency) {
        const features = (plan.features as any) || {};
        const isEnabled = features[config.dependency] === true;
        if (!isEnabled) {
            return {
                allowed: false,
                message: `Feature Disabled: The ${config.label} module is not included in your current plan. Please upgrade to unlock this feature.`
            };
        }
    }

    const limit = (plan as any)[config.field] ?? -1;
    if (limit === -1) {
        return { allowed: true };
    }

    const count = await config.countFn(siteId);
    if (count >= limit) {
        return {
            allowed: false,
            message: `Resource Limit Exceeded: Your ${plan.name} plan is capped at ${limit} ${config.label}. Upgrade your plan in the billing tab to unlock more.`
        };
    }

    return { allowed: true };
}

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
 * Memvalidasi kupon diskon dan menghitung harga akhirnya.
 */
export async function validateCoupon(code: string, planId?: string) {
    if (!code) {
        throw new Error("Kode kupon wajib diisi.");
    }

    const formattedCode = code.trim().toUpperCase();
    const coupon = await billingRepo.findCouponByCode(formattedCode);

    if (!coupon) {
        throw new Error("Kupon tidak ditemukan.");
    }

    if (!coupon.isActive) {
        throw new Error("Kupon sudah tidak aktif.");
    }

    const now = new Date();
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
        throw new Error("Kupon sudah kedaluwarsa.");
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        throw new Error("Batas pemakaian kupon telah tercapai.");
    }

    let planPrice = 0;
    if (planId) {
        const plan = await billingRepo.findPlanById(planId);
        if (plan) {
            planPrice = Number(plan.price);
        }
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
        discountAmount = planPrice * (Number(coupon.discountValue) / 100);
    } else {
        discountAmount = Number(coupon.discountValue);
    }

    const finalPrice = Math.max(0, planPrice - discountAmount);

    return {
        valid: true,
        coupon: {
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: Number(coupon.discountValue),
            affiliateId: coupon.affiliateId
        },
        originalPrice: planPrice,
        discountAmount,
        finalPrice
    };
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

    const subscription = await db.subscription.findFirst({
        where: { siteId, status: "active" },
        include: { plan: true }
    });

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
 * Memperpanjang masa uji coba (trial) gratis selama 7 hari.
 */
export async function extendTrial(userId: string, userRole: string, siteId: string) {
    if (!siteId) throw new Error("Site ID required");

    const site = await billingRepo.findSiteById(siteId);
    if (!site) {
        throw new Error("Site not found");
    }

    const isAdmin = userRole === "admin";
    if (!isAdmin) {
        const hasAccess = await TenantClient.verifyUserSiteAccess(userId, siteId);
        if (!hasAccess) {
            throw new Error("Forbidden");
        }
    }

    const sub = await db.subscription.findFirst({
        where: { siteId },
        orderBy: { createdAt: "desc" }
    });

    if (!sub) throw new Error("No subscription found");
    if (sub.trialExtended) throw new Error("Trial already extended");
    if (!sub.trialEndsAt) throw new Error("This is not a trial subscription");

    const newEndDate = new Date(sub.trialEndsAt);
    newEndDate.setDate(newEndDate.getDate() + 7);

    await billingRepo.updateSubscriptionTrial(sub.id, {
        trialEndsAt: newEndDate,
        trialExtended: true
    });

    try {
        const { revalidateTag } = await import("next/cache");
        revalidateTag(`site-${siteId}`, "default");
    } catch (e) {
        console.error("Failed to revalidate subscription cache:", e);
    }

    (async () => {
        try {
            const siteOwner = await IdentityClient.getSiteOwner(siteId);
            if (siteOwner && siteOwner.email) {
                const { sendTrialExtendedEmail } = await import("@/lib/services/email");
                const formattedEndDate = newEndDate.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                });
                await sendTrialExtendedEmail({
                    toEmail: siteOwner.email,
                    userName: siteOwner.name || "Pengguna",
                    siteName: site?.name || "Website Anda",
                    days: 7,
                    newEndDate: formattedEndDate
                });
            }
        } catch (err) {
            console.error("[EXTEND_TRIAL_EMAIL_ERROR] Failed to send email:", err);
        }
    })();

    return {
        success: true,
        message: "Trial extended successfully by 7 days."
    };
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
    const { merchantCode, amount, merchantOrderId, signature, resultCode } = body;

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

