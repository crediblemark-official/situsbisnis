import * as orderRepo from "../repositories/order.repository";
import { SubscriptionClient } from "@/modules/subscription";
import { MidtransPaymentWrapper, getPaymentMethodCategory } from "@/modules/payment/providers/midtrans";

// Cache hasil probe Midtrans secara global di process memory
let midtransProbeCache: { timestamp: number; enabled: string[] } | null = null;
const PROBE_CACHE_TTL = 1000 * 60 * 30; // 30 menit

/**
 * Membuat pesanan baru dan menghitung total harga secara aman.
 */
export async function createOrder(
    siteId: string,
    items: Array<{ productId: string; quantity: number }>,
    customerDetails: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        zip?: string;
        paymentMethod?: string;
    },
    sessionCustomer?: { name?: string | null; email?: string | null }
) {
    // Check subscription limit for orders
    const limitCheck = await SubscriptionClient.checkSiteLimit(siteId, "maxOrders");
    if (!limitCheck.allowed) {
        throw new Error(limitCheck.message || "Batas pesanan langganan Anda telah tercapai");
    }

    const customerEmail = sessionCustomer?.email || customerDetails.email;
    const customerName = sessionCustomer?.name || customerDetails.name || "Guest Customer";
    const address = customerDetails.address;
    const city = customerDetails.city;
    const zip = customerDetails.zip;
    const phone = customerDetails.phone;
    const paymentMethod = customerDetails.paymentMethod;

    const customerAddress = address 
        ? `${address}${city ? `, ${city}` : ""}${zip ? ` ${zip}` : ""}${phone ? ` (WA/Telp: ${phone})` : ""}` 
        : `No Address Provided${phone ? ` (WA/Telp: ${phone})` : ""}`;

    if (!customerEmail) {
        throw new Error("Email is required");
    }

    const productIds = items.map(item => item.productId);
    const dbProducts = await orderRepo.findProductsForSite(siteId, productIds);
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    let total = 0;
    const orderItemsData = [];

    for (const item of items) {
        const dbProduct = productMap.get(item.productId);
        if (!dbProduct) {
            throw new Error(`Product not found or invalid: ${item.productId}`);
        }
        
        const dbPrice = Number(dbProduct.price);
        total += dbPrice * item.quantity;
        
        orderItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            price: dbPrice.toFixed(2)
        });
    }

    const newOrder = await orderRepo.createOrder({
        customerName,
        customerEmail,
        customerAddress,
        total: total.toFixed(2),
        status: "pending",
        paymentStatus: "pending",
        fulfillmentStatus: "unfulfilled",
        paymentMethod: paymentMethod || "system",
        siteId,
        items: {
            create: orderItemsData
        }
    });

    const site = await orderRepo.findSiteById(siteId);
    const paymentSettings = await orderRepo.findPaymentSettings(siteId);
    const platformSettings = await orderRepo.findPlatformSettings();

    let merchantCode = paymentSettings?.gatewayMerchantId;
    let apiKey = paymentSettings?.gatewayApiKey;
    let sandbox = paymentSettings?.gatewaySandbox ?? true;

    if (!merchantCode || !apiKey) {
        merchantCode = platformSettings?.gatewayMerchantId;
        apiKey = platformSettings?.gatewayApiKey;
        sandbox = platformSettings?.gatewaySandbox ?? true;
    }

    let orderToReturn = newOrder;
    if (paymentMethod === "manual" && paymentSettings) {
        const customDetails = {
            paymentMethod: "manual",
            bankName: paymentSettings.bankName || "",
            accountHolder: paymentSettings.accountHolder || "",
            vaNumber: paymentSettings.accountNumber || "",
            instructions: paymentSettings.instructions || ""
        };
        try {
            orderToReturn = await orderRepo.updateOrderPaymentUrl(newOrder.id, `custom:${JSON.stringify(customDetails)}`);
        } catch (updateError) {
            console.error("[CreateOrder] Failed to save manual details:", updateError);
        }
    } else if (merchantCode && apiKey && paymentMethod !== "whatsapp") {
        try {
            const origin = process.env.NEXT_PUBLIC_APP_URL || "https://situsbisnis.com";
            
            const invoice = await MidtransPaymentWrapper.createInvoice({
                orderId: newOrder.id,
                amount: total,
                productDetails: `Pembayaran Pesanan #${newOrder.id} • Toko: ${site?.name || "SitusBisnis"}`,
                customer: {
                    name: customerName,
                    email: customerEmail,
                },
                returnUrl: `${origin}/checkout/success?orderId=${newOrder.id}`,
                callbackUrl: `${origin}/api/orders/webhook/payment`
            }, {
                merchantCode,
                apiKey,
                sandbox
            }, "snap");

            if (invoice.success && invoice.paymentUrl) {
                orderToReturn = await orderRepo.updateOrderPaymentUrl(newOrder.id, invoice.paymentUrl, invoice.reference);
            } else {
                console.warn(`[MIDTRANS_ORDER] Invoice creation failed: ${invoice.error}`);
            }
        } catch (gatewayError) {
            console.error(`[MIDTRANS_ORDER_ERROR]`, gatewayError);
        }
    }

    return orderToReturn;
}

/**
 * Menginisialisasi pembayaran untuk pesanan yang sudah dibuat.
 */
export async function initializeOrderPayment(orderId: string, paymentMethod: string, origin: string) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order) {
        throw new Error("Order not found");
    }

    const site = await orderRepo.findSiteById(order.siteId);
    const paymentSettings = await orderRepo.findPaymentSettings(order.siteId);
    const platformSettings = await orderRepo.findPlatformSettings();

    let merchantCode = paymentSettings?.gatewayMerchantId;
    let apiKey = paymentSettings?.gatewayApiKey;
    let sandbox = paymentSettings?.gatewaySandbox ?? true;

    if (!merchantCode || !apiKey) {
        merchantCode = platformSettings?.gatewayMerchantId;
        apiKey = platformSettings?.gatewayApiKey;
        sandbox = platformSettings?.gatewaySandbox ?? true;
    }

    if (!merchantCode || !apiKey) {
        throw new Error("Payment settings not configured");
    }

    const suffix = Date.now().toString().slice(-4);
    const uniqueOrderId = `${order.id}-${paymentMethod}-${suffix}`;

    const invoice = await MidtransPaymentWrapper.createInvoice({
        orderId: uniqueOrderId,
        amount: Number(order.total),
        productDetails: `Pembayaran Pesanan #${order.id} • Toko: ${site?.name || "SitusBisnis"}`,
        customer: {
            name: order.customerName,
            email: order.customerEmail,
        },
        paymentMethod,
        returnUrl: `${origin}/checkout/success?orderId=${order.id}`,
        callbackUrl: `${origin}/api/orders/webhook/payment`
    }, {
        merchantCode,
        apiKey,
        sandbox
    }, "snap");

    if (!invoice.success) {
        throw new Error(invoice.error || `Failed to create midtrans invoice`);
    }

    const customPayload = {
        vaNumber: invoice.vaNumber || null,
        qrString: invoice.qrString || null,
        qrCodeUrl: invoice.qrCodeUrl || null,
        paymentCode: invoice.paymentCode || null,
        paymentMethod,
        category: getPaymentMethodCategory(paymentMethod),
        reference: invoice.reference,
        merchantOrderId: uniqueOrderId
    };

    const updatedOrder = await orderRepo.updateOrderPaymentUrl(order.id, `custom:${JSON.stringify(customPayload)}`, invoice.reference);

    return {
        success: true,
        order: {
            id: updatedOrder.id,
            paymentUrl: updatedOrder.paymentUrl,
            paymentReference: updatedOrder.paymentReference
        },
        paymentDetails: customPayload
    };
}

/**
 * Mengambil seluruh metode pembayaran yang tersedia untuk pesanan.
 */
export async function getOrderPaymentMethods(orderId: string) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order) {
        throw new Error("Order not found");
    }

    const paymentSettings = await orderRepo.findPaymentSettings(order.siteId);
    const platformSettings = await orderRepo.findPlatformSettings();

    let merchantCode = paymentSettings?.gatewayMerchantId;
    let apiKey = paymentSettings?.gatewayApiKey;

    if (!merchantCode || !apiKey) {
        merchantCode = platformSettings?.gatewayMerchantId;
        apiKey = platformSettings?.gatewayApiKey;
    }

    if (!merchantCode || !apiKey) {
        throw new Error("Payment settings not configured");
    }

    const result = await MidtransPaymentWrapper.getPaymentMethods({
        amount: Math.round(Number(order.total)),
    });

    if (!result.success) {
        throw new Error(result.error || `Failed to fetch payment methods from midtrans`);
    }

    const filteredMethods = result.methods || [];

    // Mapping payment method images to local assets
    const imageMapping: Record<string, string> = {
        "credit_card": "/logo-pembayaran/VC.svg",
        "googlepay": "/logo-pembayaran/VC.svg",
        "bca_va": "/logo-pembayaran/BC.svg",
        "bni_va": "/logo-pembayaran/I1.svg",
        "bri_va": "/logo-pembayaran/BR.svg",
        "mandiri_va": "/media/logo-pembayaran/M2.svg",
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

    const methods = (filteredMethods || []).map(method => ({
        ...method,
        paymentImage: imageMapping[method.paymentMethod] || "",
    }));
    
    if (paymentSettings?.bankName && paymentSettings?.accountNumber) {
        methods.push({
            paymentMethod: "manual",
            paymentName: `Transfer Bank Manual (${paymentSettings.bankName})`,
            paymentImage: "/logo-pembayaran/JP.svg",
            totalFee: "0",
            category: "Virtual Account"
        });
    }

    return { methods };
}
