import { db } from "@/modules/shared/core/db";
import * as billingRepo from "../repositories/billing.repository";
import * as transactionRepo from "../repositories/transaction.repository";
import * as subscriptionRepo from "../repositories/subscription.repository";
import * as couponRepo from "../repositories/coupon.repository";
import { eventBus } from "@/modules/shared/core/event-bus";

/**
 * Memproses transaksi yang disetujui (aktivasi paket/addon slots).
 */
export async function processApprovedTransaction(transactionId: string) {
    let outboxEvents: any[] = [];

    const updatedTx = await db.$transaction(async (tx) => {
        const currentTx = await transactionRepo.findTransactionById(tx, transactionId);
        if (!currentTx) {
            throw new Error("TRANSACTION_NOT_FOUND");
        }
        if (currentTx.status !== "pending") {
            throw new Error("ALREADY_PROCESSED");
        }

        const updated = await transactionRepo.updateTransactionStatus(tx, transactionId, "approved");

        if (updated.couponId) {
            await couponRepo.incrementCouponUses(tx, updated.couponId);
        }

        const siteOwner = await eventBus.request<any, any>("request.auth.getSiteOwner", { siteId: updated.siteId });
        const siteInfo = await eventBus.request<any, any>("request.tenant.getSiteInfo", { siteId: updated.siteId });

        if (siteOwner && siteOwner.referredById) {
            const platformSettings = await billingRepo.findPlatformSettings(tx);
            const isRecurringEnabled = platformSettings?.affiliateRecurringCommission ?? false;
            const approvedTxCount = await transactionRepo.countApprovedTransactions(tx, updated.siteId);

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
                
                const outboxAffiliate = await tx.eventOutbox.create({
                    data: {
                        eventName: "affiliate.commission.awarded",
                        payload: {
                            transactionId: updated.id,
                            userId: siteOwner.referredById,
                            amount: commissionAmount,
                            description: `Komisi pembayaran dari situs ${siteInfo?.name || "website"}`
                        },
                        sourceModule: "billing",
                        status: "pending"
                    }
                });
                outboxEvents.push(outboxAffiliate);
            }
        }

        const outboxPayment = await tx.eventOutbox.create({
            data: {
                eventName: "billing.payment.completed",
                payload: {
                    transactionId: updated.id,
                    siteId: updated.siteId,
                    amount: Number(updated.amount),
                    couponId: updated.couponId
                },
                sourceModule: "billing",
                status: "pending"
            }
        });
        outboxEvents.push(outboxPayment);

        if (updated.addonType === "site_slot") {
            const existingSub = await subscriptionRepo.findLatestSubscription(tx, updated.siteId);
            if (existingSub) {
                await subscriptionRepo.updateSubscriptionAddonSlots(tx, existingSub.id, updated.addonQuantity || 0);
            }
        } else {
            const activeSubBeforeUpgrade = await subscriptionRepo.findLatestSubscription(tx, updated.siteId);
            const carryOverSlots = activeSubBeforeUpgrade?.addonSlots || 0;

            await subscriptionRepo.cancelAllSubscriptions(tx, updated.siteId);

            const now = new Date();
            const endDate = new Date(now);
            if (updated.plan.interval === "year") {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }

            const existingSubOfThisPlan = await subscriptionRepo.findSubscriptionBySiteAndPlan(tx, updated.siteId, updated.planId);
            if (existingSubOfThisPlan) {
                await subscriptionRepo.activateExistingSubscription(tx, existingSubOfThisPlan.id, {
                    endDate,
                    addonSlots: Math.max(existingSubOfThisPlan.addonSlots, carryOverSlots)
                });
            } else {
                await subscriptionRepo.createSubscription(tx, {
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

    // Publikasikan semua outbox events yang terkumpul di luar transaksi
    for (const outbox of outboxEvents) {
        try {
            await eventBus.publish(outbox.eventName, outbox.payload, outbox.sourceModule);
            await db.eventOutbox.update({
                where: { id: outbox.id },
                data: {
                    status: "published",
                    publishedAt: new Date()
                }
            });
        } catch (publishError: any) {
            console.error(`[Outbox Error] Gagal mempublikasikan outbox ${outbox.id}:`, publishError);
            await db.eventOutbox.update({
                where: { id: outbox.id },
                data: {
                    status: "failed",
                    error: publishError.message || String(publishError)
                }
            });
        }
    }

    if (updatedTx && updatedTx.status === "approved") {
        try {
            const { revalidateTag } = await import("next/cache");
            revalidateTag(`site-${updatedTx.siteId}`, "default");
        } catch (e) {
            console.error("Failed to revalidate subscription cache:", e);
        }
    }

    return updatedTx;
}

/**
 * Memperbarui status transaksi.
 */
export async function updateTransactionStatus(transactionId: string, status: string) {
    return db.$transaction(async (tx) => {
        const currentTx = await transactionRepo.findTransactionById(tx, transactionId);
        if (!currentTx) {
            throw new Error("TRANSACTION_NOT_FOUND");
        }
        if (currentTx.status !== "pending") {
            throw new Error("ALREADY_PROCESSED");
        }
        return transactionRepo.updateTransactionStatus(tx, transactionId, status as any);
    });
}

/**
 * Membatalkan transaksi pending secara permanen.
 */
export async function cancelTransaction(userId: string, transactionId: string) {
    if (!transactionId) {
        throw new Error("Missing transactionId");
    }

    const tx = await transactionRepo.findTransactionById(null, transactionId);
    if (!tx) {
        throw new Error("Transaction not found");
    }

    const ownerInfo = await eventBus.request<any, any>("request.auth.getSiteOwner", { siteId: tx.siteId });
    const isOwner = ownerInfo?.id === userId;

    if (!isOwner) {
        throw new Error("Forbidden");
    }

    if (tx.status !== "pending") {
        throw new Error("Hanya transaksi tertunda yang dapat dibatalkan.");
    }

    await transactionRepo.deleteTransaction(transactionId);
    return { success: true };
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

    const existingTransaction = await transactionRepo.findTransactionById(null, transactionId);
    if (!existingTransaction) {
        throw new Error("Transaction not found");
    }

    const ownerInfo = await eventBus.request<any, any>("request.auth.getSiteOwner", { siteId: existingTransaction.siteId });
    const isUserMember = ownerInfo?.id === userId;

    if (!isUserMember && userRole !== "admin") {
        throw new Error("Forbidden");
    }

    const transaction = await transactionRepo.updateTransactionConfirmDetails(transactionId, {
        notes,
        proofOfPayment
    });

    return transaction;
}
