import { SubscriptionClient } from "@/modules/subscription";
import * as transactionRepo from "../repositories/transaction.repository";
import { eventBus } from "@/modules/shared/core/event-bus";
import { processApprovedTransaction } from "./transaction.service";
import { MidtransPaymentWrapper } from "../providers/midtrans";

/**
 * Mengecek status transaksi pembayaran.
 */
export async function checkTransactionStatus(userId: string, userRole: string, transactionId: string) {
    if (!transactionId) {
        throw new Error("transactionId is required");
    }

    const transaction = await transactionRepo.findTransactionById(null, transactionId);
    if (!transaction) {
        throw new Error("Transaction not found");
    }

    const isAdmin = userRole === "admin";
    let isOwner = false;

    if (!isAdmin) {
        const ownerInfo = await eventBus.request<any, any>("request.auth.getSiteOwner", { siteId: transaction.siteId });
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

    const platformSettings = await SubscriptionClient.getPlatformSettings();
    const gateway = "midtrans";
    const gatewayApiKey = platformSettings?.gatewayApiKey;
    const gatewayMerchantId = platformSettings?.gatewayMerchantId;
    const gatewaySandbox = platformSettings?.gatewaySandbox ?? true;

    if (!gatewayApiKey || !gatewayMerchantId) {
        return {
            transactionId: transaction.id,
            status: transaction.status,
            amount: Number(transaction.amount),
            planName: (transaction.plan as any)?.name || "",
        };
    }

    let merchantOrderId = transaction.id;
    if (transaction.paymentUrl && transaction.paymentUrl.startsWith("custom:")) {
        try {
            const customData = JSON.parse(transaction.paymentUrl.substring(7));
            if (customData.merchantOrderId) {
                merchantOrderId = customData.merchantOrderId;
            }
        } catch {}
    }

    const result = await MidtransPaymentWrapper.checkTransaction({
        merchantOrderId,
    }, {
        merchantCode: gatewayMerchantId,
        apiKey: gatewayApiKey,
        sandbox: gatewaySandbox,
    });

    if (result.success && result.status === "paid" && transaction.status === "pending") {
        try {
            await processApprovedTransaction(transaction.id);
            console.log(`[CHECK_STATUS] Transaction '${transaction.id}' auto-approved via ${gateway} status polling.`);
        } catch (err: any) {
            if (err.message !== "ALREADY_PROCESSED") {
                console.error(`[CHECK_STATUS] Error processing ${gateway} check:`, err);
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

    const platformSettings = await SubscriptionClient.getPlatformSettings();
    const gatewayApiKey = platformSettings?.gatewayApiKey;
    const gatewayMerchantId = platformSettings?.gatewayMerchantId;

    if (!gatewayApiKey || !gatewayMerchantId) {
        throw new Error("Payment gateway not configured");
    }

    const result = await MidtransPaymentWrapper.getPaymentMethods({
        amount: Math.round(Number(amount)),
    });

    // Mapping payment method images to local assets
    const imageMapping: Record<string, string> = {
        "credit_card": "/logo-pembayaran/VC.svg",
        "googlepay": "/logo-pembayaran/VC.svg",
        "bca_va": "/logo-pembayaran/BC.svg",
        "bni_va": "/logo-pembayaran/I1.svg",
        "bri_va": "/logo-pembayaran/BR.svg",
        "mandiri_va": "/logo-pembayaran/M2.svg",
        "permata_va": "/logo-pembayaran/BT.svg",
        "cimb_va": "/logo-pembayaran/A1.svg",
        "danamon_va": "/logo-pembayaran/A1.svg",
        "bsi_va": "/logo-pembayaran/BV.svg",
        "seabank_va": "/logo-pembayaran/A1.svg",
        "other_va": "/logo-pembayaran/A1.svg",
        "qris": "/logo-pembayaran/QRIS.svg",
        "gopay": "/logo-pembayaran/JP.svg",
        "shopeepay": "/logo-pembayaran/FT.svg",
        "ovo": "/logo-pembayaran/OV.svg",
        "dana": "/logo-pembayaran/DA.svg",
        "linkaja": "/logo-pembayaran/DA.svg",
        "indomaret": "/logo-pembayaran/DN.svg",
        "alfamart": "/logo-pembayaran/IR.svg",
        "kredivo": "/logo-pembayaran/IR.svg",
        "akulaku": "/logo-pembayaran/IR.svg",
    };

    const filteredMethods = (result.methods || []).map(method => ({
        ...method,
        paymentImage: imageMapping[method.paymentMethod] || "",
    }));

    return { methods: filteredMethods };
}

/**
 * Memproses callback webhook dari Midtrans.
 */
export async function processMidtransWebhook(body: Record<string, any>) {
    const { order_id, status_code, gross_amount, signature_key } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
        throw new Error("Missing parameters");
    }

    const actualTransactionId = order_id.match(/^([^-]+)/)?.[1];
    if (!actualTransactionId) {
        throw new Error("Invalid order_id format");
    }

    const platformSettings = await SubscriptionClient.getPlatformSettings();
    if (!platformSettings || !platformSettings.gatewayApiKey) {
        throw new Error("Platform not configured");
    }

    const transaction = await transactionRepo.findTransactionById(null, actualTransactionId);
    if (!transaction) {
        throw new Error("Transaction not found");
    }

    const expectedAmount = Number(transaction.amount);
    if (Math.round(Number(gross_amount)) !== Math.round(expectedAmount)) {
        console.error(`[MIDTRANS] Amount mismatch: webhook=${gross_amount}, expected=${expectedAmount}`);
        throw new Error("Amount mismatch");
    }

    const verification = await MidtransPaymentWrapper.verifyCallback(body, {
        merchantCode: platformSettings.gatewayMerchantId || "",
        apiKey: platformSettings.gatewayApiKey,
        sandbox: platformSettings.gatewaySandbox
    });

    if (!verification.isValid) {
        throw new Error("Invalid Signature");
    }

    if (verification.status === "paid") {
        await processApprovedTransaction(actualTransactionId);
    }

    return { success: true };
}
