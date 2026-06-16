import * as orderRepo from "../repositories/order.repository";

/**
 * Menghitung jumlah pesanan di suatu situs.
 */
export async function countOrders(siteId: string): Promise<number> {
    return orderRepo.countOrders(siteId);
}

/**
 * Mengambil pesanan terbaru untuk suatu situs.
 */
export async function getRecentOrders(siteId: string, limit: number) {
    return orderRepo.findRecentOrders(siteId, limit);
}

/**
 * Mendapatkan data pesanan berdasarkan ID.
 */
export async function getOrderById(orderId: string) {
    return orderRepo.findOrderById(orderId);
}

/**
 * Mendapatkan pengaturan pembayaran situs.
 */
export async function getPaymentSettings(siteId: string) {
    return orderRepo.findPaymentSettings(siteId);
}

/**
 * Memproses callback pembayaran pesanan dari Duitku.
 */
export async function processOrderPaymentCallback(orderId: string, siteId: string, amount: number, creditOwner: boolean) {
    return orderRepo.processOrderPayment(orderId, siteId, amount, creditOwner);
}

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

/**
 * Mengambil detail pesanan yang dihias dengan data produk.
 */
export async function getOrderDetail(orderId: string, siteId: string) {
    if (!orderId) throw new Error("Order ID required");

    const order = await orderRepo.findOrderFirst(orderId, siteId);
    if (!order) {
        throw new Error("Order not found");
    }

    const { CatalogClient } = await import("@/lib/modules/catalog/client");
    const productIds = order.items.map(item => item.productId);
    const productsMap = await CatalogClient.getProductsMap(productIds);

    const decoratedItems = order.items.map(item => ({
        ...item,
        product: productsMap[item.productId] || null
    }));

    return {
        ...order,
        items: decoratedItems
    };
}

/**
 * Memperbarui status pesanan oleh owner/admin.
 */
export async function updateOrderFulfillment(
    orderId: string,
    siteId: string,
    body: { paymentStatus?: string; fulfillmentStatus?: string; status?: string }
) {
    const order = await orderRepo.findOrderFirst(orderId, siteId);
    if (!order) {
        throw new Error("Order not found");
    }

    const updateData: any = {};
    if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus;
    if (body.fulfillmentStatus) updateData.fulfillmentStatus = body.fulfillmentStatus;
    if (body.status) updateData.status = body.status;

    const updated = await orderRepo.updateOrderFulfillment(orderId, updateData);
    return { success: true, order: updated };
}

/**
 * Mengambil daftar pesanan dengan filter dan pagination.
 */
export async function getOrders(siteId: string, options: { skip: number; take: number; customerEmail?: string }) {
    const whereCondition: any = { siteId };
    if (options.customerEmail) {
        whereCondition.customerEmail = options.customerEmail;
    }

    const [orders, total] = await Promise.all([
        orderRepo.findOrders(whereCondition, options.skip, options.take),
        orderRepo.countOrdersWithFilter(whereCondition)
    ]);

    return { orders, total };
}

