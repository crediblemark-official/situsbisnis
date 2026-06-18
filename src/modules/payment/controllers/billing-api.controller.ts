import { NextResponse } from "next/server";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { PaymentClient } from "../index";

export async function checkoutPaymentApi(req: Request) {
    try {
        const { session, error, status } = await getApiContext(undefined, { requireSite: false });
        if (error) return apiError(error, status);
        const userId = session?.user?.id || "";
        const userRole = (session?.user as any)?.role || "user";

        const body = await req.json();
        const { transactionId, paymentMethod } = body;
        if (!transactionId || !paymentMethod) {
            return apiError("transactionId and paymentMethod are required", 400);
        }

        const result = await PaymentClient.initializeCheckoutPayment(userId, userRole, transactionId, paymentMethod);
        return apiResponse(result);
    } catch (error: any) {
        console.error("[BILLING_PAYMENT_INIT_ERROR]", error);
        if (error.message === "Transaction not found") return apiError(error.message, 404);
        if (error.message === "Forbidden") return apiError(error.message, 403);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function confirmPaymentApi(req: Request) {
    try {
        const { session, error, status } = await getApiContext(undefined, { requireSite: false });
        if (error) return apiError(error, status);
        const userId = session?.user?.id || "";
        const userRole = (session?.user as any)?.role || "user";

        const body = await req.json();
        const { transactionId } = body;
        if (!transactionId) return apiError("transactionId is required", 400);

        const result = await PaymentClient.confirmManualPayment(userId, userRole, transactionId);
        return apiResponse(result);
    } catch (error: any) {
        console.error("[CONFIRM_PAYMENT_ERROR]", error);
        return apiError(error.message || "Internal Error");
    }
}

export async function cancelPaymentApi(req: Request) {
    try {
        const { session, error, status } = await getApiContext(undefined, { requireSite: false });
        if (error) return apiError(error, status);
        const userId = session?.user?.id || "";

        const body = await req.json();
        const { transactionId } = body;
        if (!transactionId) return apiError("transactionId is required", 400);

        const result = await PaymentClient.cancelTransaction(userId, transactionId);
        return apiResponse(result);
    } catch (error: any) {
        console.error("[CANCEL_PAYMENT_ERROR]", error);
        return apiError(error.message || "Internal Error");
    }
}

export async function upgradePlanApi(req: Request) {
    try {
        const { session, error, status } = await getApiContext(undefined, { requireSite: false });
        if (error) return apiError(error, status);
        const userId = session?.user?.id || "";
        const userRole = (session?.user as any)?.role || "user";

        const body = await req.json();
        const { siteId, planId, couponCode, paymentMethod } = body;
        if (!siteId || !planId) return apiError("siteId and planId are required", 400);

        const result = await PaymentClient.upgradePlan(userId, userRole, siteId, planId, couponCode, paymentMethod);
        return apiResponse(result);
    } catch (error: any) {
        console.error("[UPGRADE_PLAN_ERROR]", error);
        return apiError(error.message || "Internal Error");
    }
}

export async function buySlotApi(req: Request) {
    try {
        const { session, error, status } = await getApiContext(undefined, { requireSite: false });
        if (error) return apiError(error, status);
        const userId = session?.user?.id || "";

        const body = await req.json();
        const { siteId, quantity = 1, paymentMethod = "manual" } = body;
        if (!siteId) return apiError("siteId is required", 400);

        const result = await PaymentClient.buySlot(userId, siteId, quantity, paymentMethod);
        return apiResponse(result);
    } catch (error: any) {
        console.error("[BUY_SLOT_ERROR]", error);
        return apiError(error.message || "Internal Error");
    }
}

export async function checkBillingStatusApi(req: Request) {
    try {
        const { session, error, status } = await getApiContext(undefined, { requireSite: false });
        if (error) return apiError(error, status);

        const body = await req.json();
        const { transactionId } = body;
        if (!transactionId) return apiError("transactionId is required", 400);

        const result = await PaymentClient.checkTransactionStatus(transactionId, session?.user?.id || "", (session?.user as any)?.role || "user");
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[CHECK_STATUS]", error);
        return apiError(error.message || "Internal Error");
    }
}

export async function updateTransactionStatusApi(req: Request) {
    try {
        const { error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const body = await req.json();
        const { transactionId, status: txStatus } = body;
        if (!transactionId || !txStatus) return apiError("Missing data", 400);

        let result;
        if (txStatus === "approved") {
            result = await PaymentClient.processApprovedTransaction(transactionId);
        } else {
            result = await PaymentClient.updateTransactionStatus(transactionId, txStatus);
        }

        return apiResponse(result);
    } catch (error: any) {
        console.error("[ADMIN_TRANSACTION_UPDATE]", error);
        if (error.message === "TRANSACTION_NOT_FOUND") return apiError("Transaction not found", 404);
        if (error.message === "ALREADY_PROCESSED") return apiError("Already processed", 400);
        return apiError("Internal Error");
    }
}

export async function getPaymentMethodsApi(req: Request) {
    try {
        const body = await req.json();
        const { amount } = body;
        if (!amount) return apiError("amount is required", 400);

        const methods = await PaymentClient.getPaymentMethods(Number(amount));
        return apiResponse({ methods });
    } catch (error: any) {
        console.error("[PAYMENT_METHODS_ERROR]", error);
        return apiError(error.message || "Internal Error");
    }
}
