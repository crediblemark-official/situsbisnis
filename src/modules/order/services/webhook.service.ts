import * as orderRepo from "../repositories/order.repository";
import { processOrderPaymentCallback } from "./order.service";

/**
 * Mengecek status pembayaran pesanan (polling atau status check ke Duitku).
 */
export async function checkOrderStatus(orderId: string) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order) {
        throw new Error("Order not found");
    }

    const site = await orderRepo.findSiteById(order.siteId);

    if (order.paymentStatus === "paid" || order.paymentStatus === "approved") {
        return {
            orderId: order.id,
            status: order.paymentStatus,
            amount: Number(order.total),
            customerName: order.customerName,
            siteName: site?.name || "",
        };
    }

    if (!order.paymentReference) {
        return {
            orderId: order.id,
            status: order.paymentStatus || "pending",
            amount: Number(order.total),
            customerName: order.customerName,
            siteName: site?.name || "",
        };
    }

    const paymentSettings = await orderRepo.findPaymentSettings(order.siteId);
    const platformSettings = await orderRepo.findPlatformSettings();

    let merchantCode = paymentSettings?.duitkuMerchantCode;
    let apiKey = paymentSettings?.duitkuApiKey;
    let sandbox = paymentSettings?.duitkuSandbox ?? true;

    if (!merchantCode || !apiKey) {
        if (platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey) {
            merchantCode = platformSettings.duitkuMerchantCode;
            apiKey = platformSettings.duitkuApiKey;
            sandbox = platformSettings.duitkuSandbox;
        }
    }

    if (!merchantCode || !apiKey) {
        return {
            orderId: order.id,
            status: order.paymentStatus || "pending",
            amount: Number(order.total),
            customerName: order.customerName,
            siteName: site?.name || "",
        };
    }

    let merchantOrderIdForDuitku = order.id;
    if (order.paymentUrl && order.paymentUrl.startsWith("custom:")) {
        try {
            const customData = JSON.parse(order.paymentUrl.substring(7));
            if (customData.merchantOrderId) {
                merchantOrderIdForDuitku = customData.merchantOrderId;
            }
        } catch {}
    }

    const { paymentManager } = await import("@crediblemark/buayar");
    const result = await paymentManager.checkTransaction("duitku", {
        merchantOrderId: merchantOrderIdForDuitku,
    }, {
        merchantCode,
        apiKey,
        sandbox,
    });

    if (result.success && result.status === "paid" && order.paymentStatus !== "paid") {
        await orderRepo.updateOrderPaymentStatus(order.id, "paid", "processing");
        console.log(`[ORDER_CHECK_STATUS] Order '${order.id}' marked as paid via polling.`);
    }

    return {
        orderId: order.id,
        status: result.success ? (result.status === "paid" ? "paid" : order.paymentStatus || "pending") : (order.paymentStatus || "pending"),
        amount: Number(order.total),
        customerName: order.customerName,
        siteName: site?.name || "",
    };
}

/**
 * Memproses Duitku callback webhook untuk pesanan.
 */
export async function processOrderWebhook(body: Record<string, any>) {
    const { merchantCode, amount, merchantOrderId, signature, resultCode } = body;

    if (!merchantCode || !amount || !merchantOrderId || !signature) {
        throw new Error("Missing parameters");
    }

    const actualOrderId = merchantOrderId.includes("-") ? merchantOrderId.split("-")[0] : merchantOrderId;

    const order = await orderRepo.findOrderById(actualOrderId);
    if (!order) {
        throw new Error("Order not found");
    }

    const paymentSettings = await orderRepo.findPaymentSettings(order.siteId);

    let activeMerchantCode = paymentSettings?.duitkuMerchantCode;
    let apiKey = paymentSettings?.duitkuApiKey;
    let sandbox = paymentSettings?.duitkuSandbox ?? true;

    if (!activeMerchantCode || !apiKey) {
        const platformSettings = await orderRepo.findPlatformSettings();
        if (platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey) {
            activeMerchantCode = platformSettings.duitkuMerchantCode;
            apiKey = platformSettings.duitkuApiKey;
            sandbox = platformSettings.duitkuSandbox;
        } else {
            throw new Error("Site payment not configured");
        }
    }

    const { paymentManager } = await import("@crediblemark/buayar");
    const verification = await paymentManager.verifyCallback("duitku", body, {
        merchantCode: activeMerchantCode || "",
        apiKey,
        sandbox
    });

    if (!verification.isValid) {
        throw new Error("Invalid Signature");
    }

    if (verification.status === "paid") {
        const creditOwner = !paymentSettings?.duitkuMerchantCode || !paymentSettings?.duitkuApiKey;
        await processOrderPaymentCallback(actualOrderId, order.siteId, Number(order.total), creditOwner);
    }

    return { success: true };
}
