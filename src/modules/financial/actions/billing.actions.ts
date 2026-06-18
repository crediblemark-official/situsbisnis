"use server";

import { getApiContext } from "@/lib/api/utils";
import { PaymentClient } from "@/modules/payment";
import { SubscriptionClient } from "@/modules/subscription";
import { FinancialClient } from "@/modules/financial";
import { serializeTransaction } from "@/lib/content/serialize";

export async function simulateDuitkuAction(body: { transactionId: string }) {
    try {
        if (process.env.NODE_ENV !== "development") {
            return { success: false, error: "Forbidden in production" };
        }

        const { session, error } = await getApiContext(["admin"]);
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { transactionId } = body;
        if (!transactionId) return { success: false, error: "Missing transactionId" };

        await PaymentClient.processApprovedTransaction(transactionId);
        return { success: true, message: "Transaction approved successfully" };
    } catch (err: any) {
        console.error("[SIMULATE_DUITKU_ACTION] Error:", err);
        return { success: false, error: err.message || "Internal Server Error" };
    }
}

export async function validateCouponAction(body: { code: string; planId: string }) {
    try {
        const { session, error } = await getApiContext(undefined, { requireSite: false });
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { code, planId } = body;
        const result = await FinancialClient.validateCoupon(code, planId);
        return { success: true, result };
    } catch (err: any) {
        console.error("[VALIDATE_COUPON_ACTION] Error:", err);
        if (err.message === "Kupon tidak ditemukan.") {
            return { success: false, error: err.message, status: 404 };
        }
        if (
            err.message === "Kode kupon wajib diisi." || 
            err.message === "Kupon sudah tidak aktif." || 
            err.message === "Kupon sudah kedaluwarsa." || 
            err.message === "Batas pemakaian kupon telah tercapai."
        ) {
            return { success: false, error: err.message, status: 400 };
        }
        return { success: false, error: "Internal Error" };
    }
}

export async function buySlotAction(body: { siteId: string; quantity: number; paymentMethod?: string }) {
    try {
        const { session, error } = await getApiContext(undefined, { requireSite: false });
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { siteId, quantity, paymentMethod = "manual" } = body;
        const transaction = await PaymentClient.buySlot(
            session.user.id,
            siteId,
            quantity,
            paymentMethod
        );
        return { success: true, result: serializeTransaction(transaction) };
    } catch (err: any) {
        console.error("[BUY_SLOT_ACTION] Error:", err);
        if (err.message === "Forbidden") {
            return { success: false, error: "Forbidden", status: 403 };
        }
        if (err.message === "Not Found" || err.message === "Active subscription not found") {
            return { success: false, error: err.message, status: 404 };
        }
        if (
            err.message === "Missing data" || 
            err.message === "Add-on slots not available for this plan" || 
            err.message.includes("tertunda")
        ) {
            return { success: false, error: err.message, status: 400 };
        }
        return { success: false, error: "Internal Error" };
    }
}

export async function upgradePlanAction(body: { 
    siteId: string; 
    planId: string; 
    billingCycle?: string;
    couponCode?: string; 
    paymentMethod?: string; 
}) {
    try {
        const { session, error } = await getApiContext(undefined, { requireSite: false });
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { siteId, planId, couponCode, paymentMethod = "manual" } = body;
        if (!siteId || !planId) return { success: false, error: "Missing data", status: 400 };

        const transaction = await PaymentClient.upgradePlan(
            session.user.id,
            (session.user as any).role,
            siteId,
            planId,
            couponCode,
            paymentMethod
        );
        return { success: true, result: serializeTransaction(transaction) };
    } catch (err: any) {
        console.error("[UPGRADE_PLAN_ACTION] Error:", err);
        if (err.message === "Forbidden") {
            return { success: false, error: "Forbidden", status: 403 };
        }
        if (err.message === "Plan not found") {
            return { success: false, error: "Plan not found", status: 404 };
        }
        if (err.message.includes("tertunda")) {
            return { success: false, error: err.message, status: 400 };
        }
        return { success: false, error: "Internal Error" };
    }
}

export async function confirmManualPaymentAction(body: { 
    transactionId: string; 
    notes?: string; 
    proofOfPayment?: string; 
}) {
    try {
        const { session, error } = await getApiContext(undefined, { requireSite: false });
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { transactionId, notes, proofOfPayment } = body;
        if (!transactionId) return { success: false, error: "Missing transaction ID", status: 400 };

        const transaction = await PaymentClient.confirmManualPayment(
            session.user.id,
            (session.user as any).role,
            transactionId,
            notes,
            proofOfPayment
        );
        return { success: true, result: serializeTransaction(transaction) };
    } catch (err: any) {
        console.error("[CONFIRM_MANUAL_PAYMENT_ACTION] Error:", err);
        if (err.message === "Forbidden") {
            return { success: false, error: "Forbidden", status: 403 };
        }
        if (err.message === "Transaction not found") {
            return { success: false, error: "Transaction not found", status: 404 };
        }
        return { success: false, error: "Internal Error" };
    }
}

export async function extendTrialAction(body: { siteId: string }) {
    try {
        const { session, error, status } = await getApiContext(["owner", "admin"]);
        if (error || !session) return { success: false, error: error || "Unauthorized", status };

        const { siteId } = body;
        if (!siteId) return { success: false, error: "Site ID required", status: 400 };

        const result = await SubscriptionClient.extendTrial(
            (session as any).user.id,
            (session as any).user.role,
            siteId
        );
        return { success: true, result };
    } catch (err: any) {
        console.error("[EXTEND_TRIAL_ACTION] Error:", err);
        if (err.message === "Forbidden") {
            return { success: false, error: "Forbidden", status: 403 };
        }
        if (err.message === "Site not found" || err.message === "No subscription found") {
            return { success: false, error: err.message, status: 404 };
        }
        if (err.message === "TRIAL_ALREADY_EXTENDED") {
            return { success: false, error: "Trial already extended", status: 400 };
        }
        if (err.message === "NOT_A_TRIAL") {
            return { success: false, error: "This is not a trial subscription", status: 400 };
        }
        return { success: false, error: "Failed to extend trial" };
    }
}

export async function cancelTransactionAction(body: { transactionId: string }) {
    try {
        const { session, error } = await getApiContext(undefined, { requireSite: false });
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { transactionId } = body;
        if (!transactionId) return { success: false, error: "Missing transactionId", status: 400 };

        const result = await PaymentClient.cancelTransaction(
            session.user.id,
            transactionId
        );
        return { success: true, result: serializeTransaction(result) };
    } catch (err: any) {
        console.error("[CANCEL_TRANSACTION_ACTION] Error:", err);
        if (err.message === "Forbidden") {
            return { success: false, error: "Forbidden", status: 403 };
        }
        if (err.message === "Transaction not found") {
            return { success: false, error: "Transaction not found", status: 404 };
        }
        if (err.message.includes("Hanya transaksi")) {
            return { success: false, error: err.message, status: 400 };
        }
        return { success: false, error: "Internal Error" };
    }
}

export async function getPaymentMethodsAction(body: { amount: number }) {
    try {
        const { session, error } = await getApiContext(undefined, { requireSite: false });
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { amount } = body;
        if (!amount || isNaN(Number(amount))) {
            return { success: false, error: "Amount is required", status: 400 };
        }

        const result = await PaymentClient.getPaymentMethods(amount);
        return { success: true, result };
    } catch (err: any) {
        console.error("[GET_PAYMENT_METHODS_ACTION] Error:", err);
        if (err.message === "Payment gateway not configured") {
            return { success: false, error: err.message, status: 503 };
        }
        return { success: false, error: err.message || "Failed to fetch payment methods", status: 502 };
    }
}

export async function initializeCheckoutPaymentAction(body: { transactionId: string; paymentMethod: string }) {
    try {
        const { session, error } = await getApiContext(undefined, { requireSite: false });
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { transactionId, paymentMethod } = body;
        if (!transactionId || !paymentMethod) {
            return { success: false, error: "transactionId and paymentMethod are required", status: 400 };
        }

        const result = await PaymentClient.initializeCheckoutPayment(
            session.user.id,
            (session.user as any).role,
            transactionId,
            paymentMethod
        );
        return { success: true, result: serializeTransaction(result) };
    } catch (err: any) {
        console.error("[INITIALIZE_CHECKOUT_PAYMENT_ACTION] Error:", err);
        if (err.message === "Forbidden") {
            return { success: false, error: "Forbidden", status: 403 };
        }
        if (err.message === "Transaction not found") {
            return { success: false, error: "Transaction not found", status: 404 };
        }
        return { success: false, error: err.message || "Internal Server Error" };
    }
}

export async function checkTransactionStatusAction(body: { transactionId: string }) {
    try {
        const { session, error } = await getApiContext(undefined, { requireSite: false });
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { transactionId } = body;
        if (!transactionId) return { success: false, error: "transactionId is required", status: 400 };

        const result = await PaymentClient.checkTransactionStatus(
            session.user.id,
            (session.user as any).role,
            transactionId
        );
        return { success: true, result: serializeTransaction(result) };
    } catch (err: any) {
        console.error("[CHECK_TRANSACTION_STATUS_ACTION] Error:", err);
        if (err.message === "Forbidden") {
            return { success: false, error: "Forbidden", status: 403 };
        }
        if (err.message === "Transaction not found") {
            return { success: false, error: "Transaction not found", status: 404 };
        }
        return { success: false, error: "Internal Error" };
    }
}
