import * as orderRepo from "../repositories/order.repository";

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
            const { paymentManager } = await import("@crediblemark/buayar");
            const origin = process.env.NEXT_PUBLIC_APP_URL || "https://situsbisnis.com";
            
            const invoice = await paymentManager.createInvoice("duitku", {
                orderId: newOrder.id,
                amount: total,
                productDetails: `Pembayaran Pesanan #${newOrder.id} • Toko: ${site?.name || "SitusBisnis"}`,
                customer: {
                    name: customerName,
                    email: customerEmail,
                },
                returnUrl: `${origin}/checkout/success?orderId=${newOrder.id}`,
                callbackUrl: `${origin}/api/orders/webhook/duitku`
            }, {
                merchantCode,
                apiKey,
                sandbox
            });

            if (invoice.success && invoice.paymentUrl) {
                orderToReturn = await orderRepo.updateOrderPaymentUrl(newOrder.id, invoice.paymentUrl, invoice.reference);
            } else {
                console.warn(`[DUITKU_ORDER] Invoice creation failed: ${invoice.error}`);
            }
        } catch (duitkuError) {
            console.error("[DUITKU_ORDER_ERROR]", duitkuError);
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

    let merchantCode = paymentSettings?.duitkuMerchantCode;
    let apiKey = paymentSettings?.duitkuApiKey;
    let sandbox = paymentSettings?.duitkuSandbox ?? true;

    if (!merchantCode || !apiKey) {
        if (platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey) {
            merchantCode = platformSettings.duitkuMerchantCode;
            apiKey = platformSettings.duitkuApiKey;
            sandbox = platformSettings.duitkuSandbox;
        } else {
            throw new Error("Payment settings not configured");
        }
    }

    const { paymentManager, getPaymentMethodCategory } = await import("@crediblemark/buayar");

    const suffix = Date.now().toString().slice(-4);
    const uniqueDuitkuId = `${order.id}-${paymentMethod}-${suffix}`;

    const invoice = await paymentManager.createInvoice("duitku", {
        orderId: uniqueDuitkuId,
        amount: Number(order.total),
        productDetails: `Pembayaran Pesanan #${order.id} • Toko: ${site?.name || "SitusBisnis"}`,
        customer: {
            name: order.customerName,
            email: order.customerEmail,
        },
        paymentMethod,
        returnUrl: `${origin}/checkout/success?orderId=${order.id}`,
        callbackUrl: `${origin}/api/orders/webhook/duitku`
    }, {
        merchantCode,
        apiKey,
        sandbox
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

    const amount = Number(order.total);
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
        } else {
            throw new Error("Payment settings not configured");
        }
    }

    const { paymentManager } = await import("@crediblemark/buayar");

    const result = await paymentManager.getPaymentMethods("duitku", {
        amount: Math.round(amount),
    }, {
        merchantCode: merchantCode || "",
        apiKey,
        sandbox,
    });

    if (!result.success) {
        throw new Error(result.error || "Failed to fetch payment methods");
    }

    const methods = [...result.methods];
    
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
