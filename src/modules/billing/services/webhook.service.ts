import * as billingRepo from "../repositories/billing.repository";
import { IdentityClient } from "@/lib/modules/identity/client";
import { processApprovedTransaction } from "./transaction.service";

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
