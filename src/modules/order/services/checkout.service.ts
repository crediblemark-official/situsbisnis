import * as orderRepo from "../repositories/order.repository";
import { SubscriptionClient } from "@/modules/subscription";

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

    let gateway = paymentSettings?.paymentGateway;
    let merchantCode = paymentSettings?.gatewayMerchantId;
    let apiKey = paymentSettings?.gatewayApiKey;
    let sandbox = paymentSettings?.gatewaySandbox ?? true;

    if (!merchantCode || !apiKey) {
        gateway = platformSettings?.paymentGateway || "duitku";
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
            const { paymentManager } = await import("@crediblemark/buayar");
            const origin = process.env.NEXT_PUBLIC_APP_URL || "https://situsbisnis.com";
            
            const invoice = await paymentManager.createInvoice(gateway as any, {
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
            });

            if (invoice.success && invoice.paymentUrl) {
                orderToReturn = await orderRepo.updateOrderPaymentUrl(newOrder.id, invoice.paymentUrl, invoice.reference);
            } else {
                console.warn(`[${gateway.toUpperCase()}_ORDER] Invoice creation failed: ${invoice.error}`);
            }
        } catch (gatewayError) {
            console.error(`[${gateway.toUpperCase()}_ORDER_ERROR]`, gatewayError);
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

    let gateway = paymentSettings?.paymentGateway;
    let merchantCode = paymentSettings?.gatewayMerchantId;
    let apiKey = paymentSettings?.gatewayApiKey;
    let sandbox = paymentSettings?.gatewaySandbox ?? true;

    if (!merchantCode || !apiKey) {
        gateway = platformSettings?.paymentGateway || "duitku";
        merchantCode = platformSettings?.gatewayMerchantId;
        apiKey = platformSettings?.gatewayApiKey;
        sandbox = platformSettings?.gatewaySandbox ?? true;
    }

    if (!merchantCode || !apiKey) {
        throw new Error("Payment settings not configured");
    }

    const { paymentManager, getPaymentMethodCategory } = await import("@crediblemark/buayar");

    const suffix = Date.now().toString().slice(-4);
    const uniqueOrderId = `${order.id}-${paymentMethod}-${suffix}`;

    const invoice = await paymentManager.createInvoice(gateway as any, {
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
    });

    if (!invoice.success) {
        throw new Error(invoice.error || `Failed to create ${gateway} invoice`);
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

    const amount = Number(order.total);
    const paymentSettings = await orderRepo.findPaymentSettings(order.siteId);
    const platformSettings = await orderRepo.findPlatformSettings();

    let gateway = paymentSettings?.paymentGateway;
    let merchantCode = paymentSettings?.gatewayMerchantId;
    let apiKey = paymentSettings?.gatewayApiKey;
    let sandbox = paymentSettings?.gatewaySandbox ?? true;
    const gatewayApiType = (platformSettings?.gatewayApiType || "snap") as "snap" | "core"; // Uses value from platform settings (admin panel)

    if (!merchantCode || !apiKey) {
        gateway = platformSettings?.paymentGateway || "duitku";
        merchantCode = platformSettings?.gatewayMerchantId;
        apiKey = platformSettings?.gatewayApiKey;
        sandbox = platformSettings?.gatewaySandbox ?? true;
    }

    if (!merchantCode || !apiKey) {
        throw new Error("Payment settings not configured");
    }

    const { paymentManager } = await import("@crediblemark/buayar");

    const result = await paymentManager.getPaymentMethods(gateway as any, {
        amount: Math.round(amount),
    }, {
        merchantCode: merchantCode || "",
        apiKey,
        sandbox,
    });

    if (!result.success) {
        throw new Error(result.error || `Failed to fetch payment methods from ${gateway}`);
    }

    let filteredMethods = result.methods || [];

    // Nonaktifkan probe sementara untuk kecepatan - tampilkan semua metode pembayaran
    // if (gateway === "midtrans" && gatewayApiType === "core") {
    //     let enabledMethods: string[] = [];
    //     try {
    //         const midtransProvider = paymentManager.getProvider("midtrans") as any;
    //         const probeRes = await midtransProvider.probePaymentMethods({
    //             merchantCode: merchantCode || "",
    //             apiKey,
    //             sandbox,
    //         });
    //         if (probeRes && probeRes.success) {
    //             enabledMethods = probeRes.enabled || [];
    //         }
    //     } catch (probeErr) {
    //         console.error("[ORDER_PAYMENT_METHODS_PROBE_ERROR]", probeErr);
    //     }
    //
    //     if (enabledMethods.length > 0) {
    //         const methodMapping: Record<string, string[]> = {
    //             qris: ["qris"],
    //             gopay: ["gopay"],
    //             shopeepay: ["shopeepay"],
    //             ovo: ["ovo"],
    //             dana: ["dana"],
    //             linkaja: ["linkaja"],
    //             bca: ["bca_va"],
    //             bni: ["bni_va"],
    //             bri: ["bri_va"],
    //             cimb: ["cimb_va"],
    //             danamon: ["danamon_va"],
    //             bsi: ["bsi_va"],
    //             seabank: ["seabank_va"],
    //             mandiri: ["mandiri_va"],
    //             permata: ["permata_va", "other_va"],
    //             alfamart: ["alfamart"],
    //             indomaret: ["indomaret"],
    //             akulaku: ["akulaku"],
    //             kredivo: ["kredivo"],
    //         };
    //
    //         const probedKeys = Object.keys(methodMapping);
    //         const disabledMethodNames: string[] = [];
    //         for (const key of probedKeys) {
    //             if (!enabledMethods.includes(key)) {
    //                 disabledMethodNames.push(...methodMapping[key]);
    //             }
    //         }
    //
    //         filteredMethods = filteredMethods.filter(
    //             (m) => !disabledMethodNames.includes(m.paymentMethod)
    //         );
    //     }
    // }

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

    const methods = (filteredMethods || []).map(method => ({
        ...method,
        paymentImage: imageMapping[method.paymentMethod] || method.paymentImage,
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
