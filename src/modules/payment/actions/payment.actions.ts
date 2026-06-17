"use server";

import { getApiContext } from "@/lib/api/utils";
import { PaymentClient } from "@/modules/payment";

export async function cancelTransactionAction(transactionId: string) {
    try {
        const { session, error } = await getApiContext(undefined, { requireSite: false });
        if (error || !session?.user?.id) return { success: false, error: error || "Unauthorized" };

        if (!transactionId) return { success: false, error: "Missing transactionId" };

        const result = await PaymentClient.cancelTransaction(
            session.user.id,
            transactionId
        );

        return { success: true, result };
    } catch (err: any) {
        console.error("[CANCEL_TRANSACTION_ACTION] Error:", err);
        if (err.message === "Forbidden" || err.message === "Transaction not found" || err.message.includes("Hanya transaksi")) {
            return { success: false, error: err.message };
        }
        return { success: false, error: "Failed to cancel transaction" };
    }
}

export async function upgradePlanAction(body: { siteId: string; planId: string; couponCode?: string; paymentMethod?: string }) {
    try {
        const { session, error } = await getApiContext(undefined, { requireSite: false });
        if (error || !session?.user?.id) return { success: false, error: error || "Unauthorized" };

        const { siteId, planId, couponCode, paymentMethod = "manual" } = body;
        if (!siteId || !planId) return { success: false, error: "Missing siteId or planId" };

        const transaction = await PaymentClient.upgradePlan(
            session.user.id,
            (session.user as any).role,
            siteId,
            planId,
            couponCode,
            paymentMethod
        );

        return { success: true, transaction };
    } catch (err: any) {
        console.error("[UPGRADE_PLAN_ACTION] Error:", err);
        if (err.message === "Forbidden" || err.message === "Plan not found" || err.message.includes("tertunda")) {
            return { success: false, error: err.message };
        }
        return { success: false, error: "Failed to upgrade plan" };
    }
}

export async function buySlotAction(body: { siteId: string; quantity: number; paymentMethod?: string }) {
    try {
        const { session, error } = await getApiContext(undefined, { requireSite: false });
        if (error || !session?.user?.id) return { success: false, error: error || "Unauthorized" };

        const { siteId, quantity, paymentMethod = "manual" } = body;
        if (!siteId) return { success: false, error: "Missing siteId" };

        const transaction = await PaymentClient.buySlot(
            session.user.id,
            siteId,
            quantity,
            paymentMethod
        );

        return { success: true, transaction };
    } catch (err: any) {
        console.error("[BUY_SLOT_ACTION] Error:", err);
        if (
            err.message === "Forbidden" || 
            err.message === "Not Found" || 
            err.message === "Active subscription not found" || 
            err.message === "Missing data" || 
            err.message === "Add-on slots not available for this plan" || 
            err.message.includes("tertunda")
        ) {
            return { success: false, error: err.message };
        }
        return { success: false, error: "Failed to buy slot" };
    }
}

export async function confirmManualPaymentAction(body: { transactionId: string; notes?: string; proofOfPayment?: string }) {
    try {
        const { session, error } = await getApiContext(undefined, { requireSite: false });
        if (error || !session?.user?.id) return { success: false, error: error || "Unauthorized" };

        const { transactionId, notes, proofOfPayment } = body;
        if (!transactionId) return { success: false, error: "Missing transaction ID" };

        const transaction = await PaymentClient.confirmManualPayment(
            session.user.id,
            (session.user as any).role,
            transactionId,
            notes,
            proofOfPayment
        );

        return { success: true, transaction };
    } catch (err: any) {
        console.error("[CONFIRM_MANUAL_PAYMENT_ACTION] Error:", err);
        if (err.message === "Forbidden" || err.message === "Transaction not found") {
            return { success: false, error: err.message };
        }
        return { success: false, error: "Failed to confirm payment" };
    }
}

export async function updateTransactionStatusAction(body: { transactionId: string; status: string }) {
    try {
        const { session, error } = await getApiContext(["admin"]);
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { transactionId, status } = body;
        if (!transactionId || !status) return { success: false, error: "Missing data" };

        let result;
        if (status === "approved") {
            result = await PaymentClient.processApprovedTransaction(transactionId);
        } else {
            result = await PaymentClient.updateTransactionStatus(transactionId, status);
        }

        return { success: true, result };
    } catch (err: any) {
        console.error("[UPDATE_TRANSACTION_STATUS_ACTION] Error:", err);
        if (err.message === "TRANSACTION_NOT_FOUND") {
            return { success: false, error: "Transaction not found" };
        }
        if (err.message === "ALREADY_PROCESSED") {
            return { success: false, error: "Transaction has already been processed" };
        }
        return { success: false, error: "Internal Error" };
    }
}
